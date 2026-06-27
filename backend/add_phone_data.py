# add_phone_data.py
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

PHONE_VIDEO_FOLDER = "phone_videos"
OUTPUT_FOLDER = "dataset"
FRAME_SKIP = 2


def normalize_landmarks(landmarks_flat):
    landmarks = np.array(landmarks_flat).reshape(21, 3)
    wrist = landmarks[0].copy()
    landmarks = landmarks - wrist
    max_dist = np.max(np.linalg.norm(landmarks, axis=1))
    if max_dist > 0:
        landmarks = landmarks / max_dist
    return landmarks.flatten().tolist()


video_files = glob.glob(f"{PHONE_VIDEO_FOLDER}/**/*.mp4", recursive=True)

if not video_files:
    print(f"⚠️ No videos found in {PHONE_VIDEO_FOLDER}/")
    exit()

print(f"Found {len(video_files)} phone video(s) to process.\n")

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

        frame = cv2.flip(frame, 1)  # match live detection's flip behavior
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb)

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                raw_landmarks = []
                for lm in hand_landmarks.landmark:
                    raw_landmarks.extend([lm.x, lm.y, lm.z])
                normalized = normalize_landmarks(raw_landmarks)
                normalized.append(label)
                data.append(normalized)

    cap.release()

    if not data:
        print(f"   ⚠️ No hand detected — skipping\n")
        continue

    columns = []
    for i in range(21):
        columns += [f"x{i}", f"y{i}", f"z{i}"]
    columns.append("label")

    new_df = pd.DataFrame(data, columns=columns)

    if os.path.exists(output_path):
        existing_df = pd.read_csv(output_path)
        combined_df = pd.concat([existing_df, new_df], ignore_index=True)
        combined_df.to_csv(output_path, index=False)
        print(f"   ✅ Added {len(new_df)} new phone samples (total now: {len(combined_df)})\n")
    else:
        new_df.to_csv(output_path, index=False)
        print(f"   ✅ Created new file with {len(new_df)} samples\n")

print("🎉 Done adding phone data!")