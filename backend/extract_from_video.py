import cv2
import mediapipe as mp
import pandas as pd
import os
import glob

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

os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Recursively find ALL .mp4 files in videos/ and its subfolders
video_files = glob.glob(f"{VIDEO_FOLDER}/**/*.mp4", recursive=True)

if not video_files:
    print(f"No .mp4 files found in {VIDEO_FOLDER}/ (including subfolders)")
    exit()

print(f"Found {len(video_files)} video(s) to process.\n")

summary = []

for video_path in video_files:
    label = os.path.splitext(os.path.basename(video_path))[0]
    output_path = f"{OUTPUT_FOLDER}/{label}.csv"

    # Skip if already processed (saves time on re-runs)
    if os.path.exists(output_path):
        print(f"⏭ Skipping '{label}' (already processed)")
        continue

    print(f" Processing: {video_path} → label: '{label}'")

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
                landmarks = []
                for lm in hand_landmarks.landmark:
                    landmarks.extend([lm.x, lm.y, lm.z])
                landmarks.append(label)
                data.append(landmarks)

    cap.release()

    if data:
        columns = []
        for i in range(21):
            columns += [f"x{i}", f"y{i}", f"z{i}"]
        columns.append("label")

        df = pd.DataFrame(data, columns=columns)
        df.to_csv(output_path, index=False)
        print(f"   Saved {len(data)} samples")
        summary.append((label, len(data)))
    else:
        print(f"    No hand detected — check video quality/lighting")
        summary.append((label, 0))

print("\n🎉 Done processing all videos!\n")
print("=== Summary ===")
for label, count in summary:
    flag = "LOW" if count < 50 else "good"
    print(f"{label:30s} {count:5d} samples  {flag}")