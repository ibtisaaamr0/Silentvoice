import cv2
import mediapipe as mp
import pandas as pd
import os
import glob
import numpy as np

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.6,
    min_tracking_confidence=0.6
)

VIDEO_FOLDER = "videos"
OUTPUT_FOLDER = "dataset"
FRAME_SKIP = 2


def normalize_landmarks(landmarks_flat):
    """Normalize landmarks relative to wrist position and hand size."""
    landmarks = np.array(landmarks_flat).reshape(21, 3)
    wrist = landmarks[0].copy()
    landmarks = landmarks - wrist  # translate so wrist is origin

    max_dist = np.max(np.linalg.norm(landmarks, axis=1))
    if max_dist > 0:
        landmarks = landmarks / max_dist  # scale to unit size

    return landmarks.flatten().tolist()


os.makedirs(OUTPUT_FOLDER, exist_ok=True)

video_files = glob.glob(f"{VIDEO_FOLDER}/**/*.mp4", recursive=True)

if not video_files:
    print(f"⚠️ No .mp4 files found in {VIDEO_FOLDER}/ (including subfolders)")
    exit()

print(f"Found {len(video_files)} video(s) to process.\n")

summary = []

for video_path in video_files:
    label = os.path.splitext(os.path.basename(video_path))[0]
    output_path = f"{OUTPUT_FOLDER}/{label}.csv"

    print(f"📹 Processing: {video_path} → label: '{label}'")

    cap = cv2.VideoCapture(video_path)
    data = []
    frame_count = 0

    while True:
        success, frame = cap.read()
        if not success:
            break

        frame_count += 1
        if frame_count % FRAME_SKIP != 0:
            continue

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb)

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                raw_landmarks = []
                for lm in hand_landmarks.landmark:
                    raw_landmarks.extend([lm.x, lm.y, lm.z])

                normalized = normalize_landmarks(raw_landmarks)  # 👈 NEW
                normalized.append(label)
                data.append(normalized)

    cap.release()

    if data:
        columns = []
        for i in range(21):
            columns += [f"x{i}", f"y{i}", f"z{i}"]
        columns.append("label")

        df = pd.DataFrame(data, columns=columns)
        df.to_csv(output_path, index=False)
        print(f"   ✅ Saved {len(data)} samples")
        summary.append((label, len(data)))
    else:
        print(f"   ⚠️ No hand detected")
        summary.append((label, 0))

print("\n🎉 Done processing all videos!\n")
print("=== Summary ===")
for label, count in summary:
    flag = "⚠️ LOW" if count < 50 else "✅"
    print(f"{label:30s} {count:5d} samples  {flag}")