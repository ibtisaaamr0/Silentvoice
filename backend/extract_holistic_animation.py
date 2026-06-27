"""
PSL Animation Extractor v2 — uses MediaPipe Tasks API (mediapipe 0.10.x)

Improvements over v1:
  - pose_world_landmarks for arm bones: real metric 3D (eliminates z-depth noise)
  - HandLandmarker in RunningMode.VIDEO: temporal tracking across frames (fixes gaps)
  - Palm normal vectors stored: enables full wrist rotation in playback
  - FRAME_SKIP=1: every frame captured, maximum temporal resolution
  - Detection confidence lowered to 0.35: catches fast/occluded hands
  - Fresh hand detector per video: no tracking bleed between files
"""

import cv2
import json
import os
import glob
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_tasks
from mediapipe.tasks.python import vision as mp_vision

POSE_MODEL   = "pose_landmarker.task"
HAND_MODEL   = "hand_landmarker.task"
VIDEO_FOLDER = "videos"
OUTPUT_FILE  = "../psl_animation_library.json"
FRAME_SKIP   = 1  # every frame — doubles data vs v1, enables smooth 24+ FPS playback

# ─── Pose detector (IMAGE mode — pose_world_landmarks available in all modes) ────

pose_opts = mp_vision.PoseLandmarkerOptions(
    base_options=mp_tasks.BaseOptions(model_asset_path=POSE_MODEL),
    running_mode=mp_vision.RunningMode.IMAGE,
    num_poses=1,
    min_pose_detection_confidence=0.5,
    min_pose_presence_confidence=0.5,
    min_tracking_confidence=0.5,
)
pose_detector = mp_vision.PoseLandmarker.create_from_options(pose_opts)


def make_hand_detector():
    """Fresh HandLandmarker in VIDEO mode for each video — prevents cross-video bleed."""
    opts = mp_vision.HandLandmarkerOptions(
        base_options=mp_tasks.BaseOptions(model_asset_path=HAND_MODEL),
        running_mode=mp_vision.RunningMode.VIDEO,
        num_hands=2,
        min_hand_detection_confidence=0.35,
        min_hand_presence_confidence=0.35,
        min_tracking_confidence=0.35,
    )
    return mp_vision.HandLandmarker.create_from_options(opts)


# ─── Helpers ─────────────────────────────────────────────────────────────────────

def unit_vec(a, b):
    """
    Direction from landmark a to b, in Three.js Y-up space.
    Works for both NormalizedLandmark and world Landmark objects.
    x is kept as-is (image/world space); the playback negates x for front-facing mirror.
    y and z are flipped because MediaPipe y=down,z=away but Three.js y=up,z=toward.
    """
    v = np.array([b.x - a.x, -(b.y - a.y), -(b.z - a.z)])
    n = np.linalg.norm(v)
    if n < 1e-6:
        return None
    v /= n
    return {"x": round(float(v[0]), 5), "y": round(float(v[1]), 5), "z": round(float(v[2]), 5)}


def unit_vec_np(a_xyz, b_xyz):
    """Direction from numpy array a to b (already in Three.js space)."""
    v = b_xyz - a_xyz
    n = np.linalg.norm(v)
    if n < 1e-6:
        return None
    v /= n
    return {"x": round(float(v[0]), 5), "y": round(float(v[1]), 5), "z": round(float(v[2]), 5)}


def lm_to_threejs(lm):
    """Convert a single MediaPipe landmark to a Three.js-space numpy vector."""
    return np.array([lm.x, -lm.y, -lm.z])


def process_frame(frame_bgr, timestamp_ms, hand_det):
    """Return a dict of boneName -> direction vector for one video frame."""
    rgb    = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

    bones  = {}
    joints = {}

    # ── ARM BONES via pose_world_landmarks (metric 3D, no z-depth estimation) ──
    pose_result = pose_detector.detect(mp_img)

    if pose_result.pose_world_landmarks:
        wlm = pose_result.pose_world_landmarks[0]
        # Landmark indices: 11=L-shoulder 12=R-shoulder 13=L-elbow
        #                   14=R-elbow    15=L-wrist    16=R-wrist
        # pose_world_landmarks convention: same image-space x as normalized landmarks.
        # Playback negates x uniformly, so no change to unit_vec formula needed.

        v = unit_vec(wlm[12], wlm[14])
        if v: bones["rightArm"] = v

        v = unit_vec(wlm[14], wlm[16])
        if v: bones["rightForeArm"] = v

        v = unit_vec(wlm[11], wlm[13])
        if v: bones["leftArm"] = v

        v = unit_vec(wlm[13], wlm[15])
        if v: bones["leftForeArm"] = v

    # Joints (shoulder-relative positions) from normalized landmarks — retained for
    # IK reference and future use. Same z-noise issue but not used in playback.
    if pose_result.pose_landmarks:
        lm = pose_result.pose_landmarks[0]
        joints["rightElbow"] = {"x": round(lm[14].x - lm[12].x, 5),
                                 "y": round(-(lm[14].y - lm[12].y), 5),
                                 "z": round(-(lm[14].z - lm[12].z), 5)}
        joints["rightWrist"] = {"x": round(lm[16].x - lm[12].x, 5),
                                 "y": round(-(lm[16].y - lm[12].y), 5),
                                 "z": round(-(lm[16].z - lm[12].z), 5)}
        joints["leftElbow"]  = {"x": round(lm[13].x - lm[11].x, 5),
                                 "y": round(-(lm[13].y - lm[11].y), 5),
                                 "z": round(-(lm[13].z - lm[11].z), 5)}
        joints["leftWrist"]  = {"x": round(lm[15].x - lm[11].x, 5),
                                 "y": round(-(lm[15].y - lm[11].y), 5),
                                 "z": round(-(lm[15].z - lm[11].z), 5)}

    # ── HAND + FINGER BONES via HandLandmarker VIDEO mode (temporal tracking) ──
    hand_result = hand_det.detect_for_video(mp_img, timestamp_ms)

    if hand_result.hand_landmarks and hand_result.handedness:
        for hlm, handedness in zip(hand_result.hand_landmarks, hand_result.handedness):
            side = handedness[0].category_name.lower()   # "left" or "right"
            pfx  = "right" if side == "right" else "left"

            # ── Wrist direction: wrist (0) → middle MCP (9) ──────────────────
            v = unit_vec(hlm[0], hlm[9])
            if v: bones[f"{pfx}Hand"] = v

            # ── Palm normal vector ────────────────────────────────────────────
            # Computed as: pinky_MCP_vec × hand_fwd_vec (in Three.js space)
            # This gives the direction the palm SURFACE faces.
            # For right hand with palm toward viewer: result ≈ +z (toward camera).
            # Stored as {pfx}HandNormal — playback uses it to set full wrist rotation.
            wrist     = lm_to_threejs(hlm[0])
            mid_mcp   = lm_to_threejs(hlm[9])
            pinky_mcp = lm_to_threejs(hlm[17])
            hand_fwd  = mid_mcp   - wrist
            pinky_vec = pinky_mcp - wrist
            palm_norm = np.cross(pinky_vec, hand_fwd)
            pn_len    = np.linalg.norm(palm_norm)
            if pn_len > 1e-6:
                palm_norm /= pn_len
                bones[f"{pfx}HandNormal"] = {
                    "x": round(float(palm_norm[0]), 5),
                    "y": round(float(palm_norm[1]), 5),
                    "z": round(float(palm_norm[2]), 5),
                }

            # ── Finger segments: MCP→PIP (1), PIP→DIP (2), DIP→TIP (3) ───────
            finger_joints = {
                "Thumb":  [1,  2,  3,  4],
                "Index":  [5,  6,  7,  8],
                "Middle": [9,  10, 11, 12],
                "Ring":   [13, 14, 15, 16],
                "Pinky":  [17, 18, 19, 20],
            }
            for finger, fj in finger_joints.items():
                v1 = unit_vec(hlm[fj[0]], hlm[fj[1]])
                v2 = unit_vec(hlm[fj[1]], hlm[fj[2]])
                v3 = unit_vec(hlm[fj[2]], hlm[fj[3]])
                if v1: bones[f"{pfx}Hand{finger}1"] = v1
                if v2: bones[f"{pfx}Hand{finger}2"] = v2
                if v3: bones[f"{pfx}Hand{finger}3"] = v3

    if joints:
        bones["joints"] = joints

    return bones


# ─── Main extraction loop ─────────────────────────────────────────────────────────

video_files = glob.glob(f"{VIDEO_FOLDER}/**/*.mp4", recursive=True)
if not video_files:
    print(f"No .mp4 files found in {VIDEO_FOLDER}/")
    exit(1)

print(f"Found {len(video_files)} video(s). FRAME_SKIP={FRAME_SKIP}\n")

animation_library = {}

for video_path in sorted(video_files):
    label = os.path.splitext(os.path.basename(video_path))[0].lower().strip()
    print(f"  Processing '{label}' ...", end="", flush=True)

    hand_det   = make_hand_detector()   # fresh detector = no cross-video tracking bleed
    cap        = cv2.VideoCapture(video_path)
    video_fps  = cap.get(cv2.CAP_PROP_FPS) or 30.0

    frames_data = []
    frame_idx   = 0
    last_bones  = {}

    while True:
        ok, frame = cap.read()
        if not ok:
            break
        frame_idx += 1
        if FRAME_SKIP > 1 and frame_idx % FRAME_SKIP != 0:
            continue

        # Monotonically increasing timestamp (ms) required by VIDEO mode hand detector
        timestamp_ms = int(frame_idx / video_fps * 1000)

        bones = process_frame(frame, timestamp_ms, hand_det)

        if bones:
            merged     = {**last_bones, **bones}
            last_bones = merged
            frames_data.append(merged)
        elif last_bones:
            frames_data.append(last_bones.copy())

    cap.release()
    hand_det.close()

    if frames_data:
        animation_library[label] = frames_data
        print(f" {len(frames_data)} frames OK")
    else:
        print(" WARNING: no landmarks detected, skipping")

# ─── Save ─────────────────────────────────────────────────────────────────────────

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(animation_library, f, separators=(",", ":"))

size_kb = os.path.getsize(OUTPUT_FILE) // 1024
print(f"\nSaved {len(animation_library)} animations -> {OUTPUT_FILE}  ({size_kb} KB)")
