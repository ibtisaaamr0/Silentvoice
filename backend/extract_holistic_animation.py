"""
PSL Animation Extractor v2.7.0 — Production-Ready Structural Metric 3D Tracking
Uses MediaPipe Tasks API (mediapipe 0.10.x)

Fixes Applied over v2.6.0:
  - CRITICAL: Hand chirality fix — MediaPipe handedness is camera-mirrored,
    so "left" from API = person's RIGHT hand. Now correctly flipped.
  - Smoothing alpha rebalanced: fingers more responsive (0.35) than arms (0.25)
    so fast finger signs don't lag behind pose.
  - previous_vectors cleared cleanly only at sign boundary, not mid-video,
    to avoid first-frame jumps inside a multi-video sign.
  - Forward-fill now deep-copies last valid frame so mutations don't bleed.
  - avg_fps now uses per-video weighted frame count instead of simple average.
  - Added basic confidence gate: skip frame if pose landmarks visibility < 0.4
    to avoid poisoning the library with garbage low-confidence frames.
"""

import cv2
import orjson
import os
import glob
import copy
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_tasks
from mediapipe.tasks.python import vision as mp_vision
from collections import defaultdict

# ── Global smoothing state ──────────────────────────────────────────────────
previous_vectors = {}

# ── Paths ───────────────────────────────────────────────────────────────────
POSE_MODEL    = "pose_landmarker.task"
HAND_MODEL    = "hand_landmarker.task"

# FIX: Use absolute paths anchored to this script's location instead of
# fragile "../" relative paths. This was causing FileNotFoundError when the
# script was run from a different working directory than expected, or when
# the parent folder didn't exist yet.
_SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FOLDER = os.path.join(_SCRIPT_DIR, "..", "psl_library")
INDEX_FILE    = os.path.join(_SCRIPT_DIR, "..", "psl_index.json")

# ── Tuning constants ────────────────────────────────────────────────────────
FINGER_Z_DAMPING       = 0.35   # Suppresses noisy monocular depth on finger tips
POSE_VISIBILITY_GATE   = 0.40   # Skip pose joints below this confidence
FINGER_SMOOTH_ALPHA    = 0.35   # Higher = more responsive fingers (was 0.12, too laggy)
ARM_SMOOTH_ALPHA       = 0.25   # Arm/wrist smoothing (was 0.18)


# ── Detector factories ──────────────────────────────────────────────────────
def make_pose_detector():
    opts = mp_vision.PoseLandmarkerOptions(
        base_options=mp_tasks.BaseOptions(model_asset_path=POSE_MODEL),
        running_mode=mp_vision.RunningMode.IMAGE,
        num_poses=1,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )
    return mp_vision.PoseLandmarker.create_from_options(opts)


def make_hand_detector():
    opts = mp_vision.HandLandmarkerOptions(
        base_options=mp_tasks.BaseOptions(model_asset_path=HAND_MODEL),
        running_mode=mp_vision.RunningMode.VIDEO,
        num_hands=2,
        min_hand_detection_confidence=0.35,
        min_hand_presence_confidence=0.35,
        min_tracking_confidence=0.35,
    )
    return mp_vision.HandLandmarker.create_from_options(opts)


# ── Coordinate conversion ───────────────────────────────────────────────────
def lm_to_threejs_dict(lm, is_finger=False):
    """
    Converts a MediaPipe World Landmark (metric, meters) to Three.js
    right-handed coordinate space.

    MediaPipe world space:  Y-down,  Z-away from camera
    Three.js world space:   Y-up,    Z-toward viewer
    So: x stays, y flips sign, z flips sign.
    Fingers additionally get Z damped to suppress monocular depth noise.
    """
    z_val = float(-lm.z)
    if is_finger:
        z_val *= FINGER_Z_DAMPING

    return {
        "x": round(float(lm.x),  5),
        "y": round(float(-lm.y), 5),
        "z": round(z_val,        5),
    }


# ── Exponential smoothing ───────────────────────────────────────────────────
def smooth_position(name, current_pos, bone_type="arm"):
    """
    Exponential moving average per named landmark.
    Higher alpha = more responsive (less smoothing).
    Fingers need higher alpha so fast signs stay sharp.
    """
    global previous_vectors
    if current_pos is None:
        return previous_vectors.get(name)

    alpha = FINGER_SMOOTH_ALPHA if bone_type == "finger" else ARM_SMOOTH_ALPHA

    if name not in previous_vectors:
        previous_vectors[name] = current_pos
        return current_pos

    old = previous_vectors[name]
    smoothed = {
        "x": round(old["x"] * (1 - alpha) + current_pos["x"] * alpha, 5),
        "y": round(old["y"] * (1 - alpha) + current_pos["y"] * alpha, 5),
        "z": round(old["z"] * (1 - alpha) + current_pos["z"] * alpha, 5),
    }
    previous_vectors[name] = smoothed
    return smoothed


# ── Per-frame processing ────────────────────────────────────────────────────
def process_frame(frame_bgr, timestamp_ms, pose_det, hand_det):
    """
    Extracts unified metric 3D landmark data from one video frame.
    Returns a structured dict or None if nothing detected.
    """
    rgb    = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

    frame_payload = {
        "pose":  {},
        "hands": {"left": [], "right": []},
    }

    # ── 1. POSE (upper body joints in metric world space) ───────────────────
    pose_result = pose_det.detect(mp_img)
    if pose_result.pose_world_landmarks:
        wlm = pose_result.pose_world_landmarks[0]

        # Also grab normalized landmarks for visibility scores
        vis_lm = pose_result.pose_landmarks[0] if pose_result.pose_landmarks else None

        pose_mapping = {
            "leftShoulder":  (wlm[11], 11),
            "rightShoulder": (wlm[12], 12),
            "leftElbow":     (wlm[13], 13),
            "rightElbow":    (wlm[14], 14),
            "leftWrist":     (wlm[15], 15),
            "rightWrist":    (wlm[16], 16),
        }

        for joint_name, (lm, idx) in pose_mapping.items():
            # Skip low-confidence joints — they poison the animation
            if vis_lm and hasattr(vis_lm[idx], 'visibility'):
                if vis_lm[idx].visibility < POSE_VISIBILITY_GATE:
                    continue
            raw_pos = lm_to_threejs_dict(lm, is_finger=False)
            frame_payload["pose"][joint_name] = smooth_position(joint_name, raw_pos, "arm")

    # ── 2. HANDS (metric world space via hand_world_landmarks) ──────────────
    hand_result = hand_det.detect_for_video(mp_img, timestamp_ms)
    if hand_result.hand_world_landmarks and hand_result.handedness:
        for h_wlm, handedness in zip(
            hand_result.hand_world_landmarks,
            hand_result.handedness
        ):
            # CRITICAL FIX: MediaPipe handedness is from the camera's perspective
            # which is a MIRROR of the actual person's hand.
            # "left" in API  → person's RIGHT hand
            # "right" in API → person's LEFT hand
            api_side = handedness[0].category_name.lower()
            side = "right" if api_side == "left" else "left"

            smoothed_hand_list = []
            for idx, lm in enumerate(h_wlm):
                is_finger  = (idx > 0)           # idx 0 = wrist, rest = fingers
                raw_pos    = lm_to_threejs_dict(lm, is_finger=is_finger)
                bone_type  = "finger" if is_finger else "arm"
                smoothed_pt = smooth_position(f"{side}_hand_lm_{idx}", raw_pos, bone_type)
                smoothed_hand_list.append(smoothed_pt)

            frame_payload["hands"][side] = smoothed_hand_list

    has_data = (
        frame_payload["pose"]
        or frame_payload["hands"]["left"]
        or frame_payload["hands"]["right"]
    )
    return frame_payload if has_data else None


# ── Main pipeline ───────────────────────────────────────────────────────────
def main():
    video_files = defaultdict(list)

    for directory in ["videos", "phone_videos"]:
        for path in glob.glob(f"{directory}/**/*.mp4", recursive=True):
            label = os.path.splitext(os.path.basename(path))[0].lower().strip()
            video_files[label].append(path)

    if not video_files:
        print("Error: No video files found in 'videos/' or 'phone_videos/'.")
        return

    total = sum(len(v) for v in video_files.values())
    print(f"Discovered {total} files across {len(video_files)} signs.\n")
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)

    pose_detector    = make_pose_detector()
    animation_library = {}

    try:
        for label in sorted(video_files.keys()):
            merged_frames  = []
            total_frames   = 0      # for weighted fps average
            weighted_fps   = 0.0

            # Clear smoothing state at sign boundary (not mid-video)
            previous_vectors.clear()
            print(f"Processing: '{label}'")

            for video_path in sorted(video_files[label]):
                print(f"   -> {video_path}")

                hand_detector = make_hand_detector()
                cap           = cv2.VideoCapture(video_path)
                video_fps     = cap.get(cv2.CAP_PROP_FPS) or 30.0
                frame_count_this_video = 0

                last_valid_frame = None
                frame_idx        = 0

                try:
                    while True:
                        ok, frame = cap.read()
                        if not ok:
                            break

                        frame_idx  += 1
                        timestamp_ms = int((frame_idx * 1000) / video_fps)

                        frame_data = process_frame(
                            frame, timestamp_ms, pose_detector, hand_detector
                        )

                        if frame_data:
                            last_valid_frame = frame_data
                            merged_frames.append(frame_data)
                        elif last_valid_frame:
                            # Deep copy so future mutations don't bleed into
                            # already-written forward-fill frames
                            merged_frames.append(copy.deepcopy(last_valid_frame))

                        frame_count_this_video += 1

                finally:
                    cap.release()
                    hand_detector.close()

                # Weighted fps accumulation
                weighted_fps += video_fps * frame_count_this_video
                total_frames += frame_count_this_video

            if merged_frames:
                avg_fps = (weighted_fps / total_frames) if total_frames > 0 else 30.0

                animation_data = {
                    "version":    2.7,
                    "fps":        round(avg_fps, 2),
                    "frameCount": len(merged_frames),
                    "frames":     merged_frames,
                }

                animation_library[label] = True

                filename = os.path.join(OUTPUT_FOLDER, f"{label}.json")
                with open(filename, "wb") as f:
                    f.write(orjson.dumps(animation_data))

                print(f"       Saved {len(merged_frames)} frames @ {avg_fps:.1f} fps")

        # Global index
        with open(INDEX_FILE, "wb") as f:
            f.write(orjson.dumps(sorted(animation_library.keys())))

        print(
            f"\nDone. {len(animation_library)} sign animations saved to '{OUTPUT_FOLDER}/'."
        )

    finally:
        pose_detector.close()


if __name__ == "__main__":
    main()