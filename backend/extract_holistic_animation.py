"""
PSL Animation Extractor — uses MediaPipe Tasks API (mediapipe 0.10.x / Python 3.13)
Extracts per-frame arm + finger bone data from each video and saves to
psl_animation_library.json, which the 3D avatar reads directly.

NO machine learning training needed — we directly convert real human sign
language video into avatar bone animations.
"""

import cv2
import json
import os
import glob
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_tasks
from mediapipe.tasks.python import vision as mp_vision

POSE_MODEL = "pose_landmarker.task"
HAND_MODEL = "hand_landmarker.task"
VIDEO_FOLDER = "videos"
OUTPUT_FILE = "../psl_animation_library.json"  # Saved to project root for React Native
FRAME_SKIP = 2  # Process every 2nd frame (balance accuracy vs. file size)

# ─── Model setup ────────────────────────────────────────────────────────────

pose_opts = mp_vision.PoseLandmarkerOptions(
    base_options=mp_tasks.BaseOptions(model_asset_path=POSE_MODEL),
    running_mode=mp_vision.RunningMode.IMAGE,
    num_poses=1,
    min_pose_detection_confidence=0.5,
    min_pose_presence_confidence=0.5,
    min_tracking_confidence=0.5,
)
hand_opts = mp_vision.HandLandmarkerOptions(
    base_options=mp_tasks.BaseOptions(model_asset_path=HAND_MODEL),
    running_mode=mp_vision.RunningMode.IMAGE,
    num_hands=2,
    min_hand_detection_confidence=0.5,
    min_hand_presence_confidence=0.5,
    min_tracking_confidence=0.5,
)

pose_detector = mp_vision.PoseLandmarker.create_from_options(pose_opts)
hand_detector  = mp_vision.HandLandmarker.create_from_options(hand_opts)

# ─── Helpers ────────────────────────────────────────────────────────────────

def joint_rel(point, origin):
    """Landmark position relative to origin, in avatar-facing Y-up space."""
    return {
        "x": round(point.x - origin.x, 5),
        "y": round(-(point.y - origin.y), 5),
        "z": round(-(point.z - origin.z), 5),
    }


def unit_vec(a, b):
    """Direction vector from landmark a to b, normalised."""
    v = np.array([b.x - a.x, -(b.y - a.y), -(b.z - a.z)])  # flip Y,Z for Three.js
    n = np.linalg.norm(v)
    if n < 1e-6:
        return None
    v = v / n
    return {"x": round(float(v[0]), 5), "y": round(float(v[1]), 5), "z": round(float(v[2]), 5)}


def process_frame(frame_bgr):
    """Return a dict of boneName -> direction vector for one frame."""
    rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

    bones = {}
    joints = {}

    # ── Pose (arms) ──────────────────────────────────────────────────────
    pose_result = pose_detector.detect(mp_img)
    if pose_result.pose_landmarks:
        lm = pose_result.pose_landmarks[0]
        # Indices: 11=L-shoulder 12=R-shoulder 13=L-elbow 14=R-elbow 15=L-wrist 16=R-wrist

        v = unit_vec(lm[12], lm[14])
        if v:
            bones["rightArm"] = v
            joints["rightElbow"] = joint_rel(lm[14], lm[12])
            joints["rightWrist"] = joint_rel(lm[16], lm[12])

        v = unit_vec(lm[14], lm[16])
        if v:
            bones["rightForeArm"] = v

        v = unit_vec(lm[11], lm[13])
        if v:
            bones["leftArm"] = v
            joints["leftElbow"] = joint_rel(lm[13], lm[11])
            joints["leftWrist"] = joint_rel(lm[15], lm[11])

        v = unit_vec(lm[13], lm[15])
        if v:
            bones["leftForeArm"] = v

    # ── Hands + fingers ──────────────────────────────────────────────────
    hand_result = hand_detector.detect(mp_img)
    if hand_result.hand_landmarks and hand_result.handedness:
        for hlm, handedness in zip(hand_result.hand_landmarks, hand_result.handedness):
            side = handedness[0].category_name.lower()   # "left" or "right"
            pfx  = "right" if side == "right" else "left"

            # Hand base: wrist → middle MCP (index 9)
            v = unit_vec(hlm[0], hlm[9])
            if v: bones[f"{pfx}Hand"] = v

            # Fingers: [MCP, PIP, DIP, TIP]
            finger_joints = {
                "Thumb":  [1, 2, 3, 4],
                "Index":  [5, 6, 7, 8],
                "Middle": [9, 10, 11, 12],
                "Ring":   [13, 14, 15, 16],
                "Pinky":  [17, 18, 19, 20],
            }
            for finger, joints in finger_joints.items():
                v1 = unit_vec(hlm[joints[0]], hlm[joints[1]])
                v2 = unit_vec(hlm[joints[1]], hlm[joints[2]])
                v3 = unit_vec(hlm[joints[2]], hlm[joints[3]])
                if v1: bones[f"{pfx}Hand{finger}1"] = v1
                if v2: bones[f"{pfx}Hand{finger}2"] = v2
                if v3: bones[f"{pfx}Hand{finger}3"] = v3

    if joints:
        bones["joints"] = joints

    return bones

# ─── Main extraction loop ────────────────────────────────────────────────────

video_files = glob.glob(f"{VIDEO_FOLDER}/**/*.mp4", recursive=True)
if not video_files:
    print(f"No .mp4 files found in {VIDEO_FOLDER}/")
    exit(1)

print(f"Found {len(video_files)} video(s).\n")

animation_library = {}

for video_path in sorted(video_files):
    label = os.path.splitext(os.path.basename(video_path))[0].lower().strip()
    print(f"  Processing '{label}' ...", end="", flush=True)

    cap = cv2.VideoCapture(video_path)
    frames_data = []
    frame_idx = 0
    last_bones = {}

    while True:
        ok, frame = cap.read()
        if not ok:
            break
        frame_idx += 1
        if frame_idx % FRAME_SKIP != 0:
            continue

        bones = process_frame(frame)

        if bones:
            # Fill missing bones from previous frame (temporal smoothing)
            merged = {**last_bones, **bones}
            last_bones = merged
            frames_data.append(merged)
        elif last_bones:
            frames_data.append(last_bones.copy())

    cap.release()

    if frames_data:
        animation_library[label] = frames_data
        print(f" {len(frames_data)} frames OK")
    else:
        print(" ⚠ no landmarks detected, skipping")

# ─── Save ────────────────────────────────────────────────────────────────────

os.makedirs(os.path.dirname(OUTPUT_FILE) if os.path.dirname(OUTPUT_FILE) else ".", exist_ok=True)

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(animation_library, f, separators=(",", ":"))  # compact — no indent

size_kb = os.path.getsize(OUTPUT_FILE) // 1024
print(f"\nSaved {len(animation_library)} animations -> {OUTPUT_FILE}  ({size_kb} KB)")
