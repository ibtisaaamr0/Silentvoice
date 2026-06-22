import cv2
import mediapipe as mp
import pickle
import numpy as np
from collections import deque, Counter


class GestureRecognizer:
    def __init__(self, model_path="model/sign_model.pkl"):
        self.buffer = deque(maxlen=7)
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6
        )
        with open(model_path, "rb") as f:
            self.model = pickle.load(f)

    def detect(self, frame):
        # used by /gesture (single frame)
        if frame is None:
            return "No Frame"
        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb)
        gesture = "No Hand"
        if results.multi_hand_landmarks:
            lm = results.multi_hand_landmarks[0].landmark
            features = []
            for point in lm:
                features.extend([point.x, point.y, point.z])
            features = np.array(features).reshape(1, -1)
            gesture = self.model.predict(features)[0]
        self.buffer.append(gesture)
        return max(set(self.buffer), key=self.buffer.count)

    def detect_from_video(self, video_path):
        cap = cv2.VideoCapture(video_path)
        predictions = []
        frame_num = 0

        while True:
            success, frame = cap.read()
            if not success:
                break
            frame_num += 1

            frame = cv2.flip(frame, 1)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.hands.process(rgb)

            if results.multi_hand_landmarks:
                lm = results.multi_hand_landmarks[0].landmark
                features = []
                for point in lm:
                    features.extend([point.x, point.y, point.z])
                features = np.array(features).reshape(1, -1)

                probs = self.model.predict_proba(features)[0]
                best_idx = np.argmax(probs)
                confidence = probs[best_idx]
                pred = self.model.classes_[best_idx]

                print(f"Frame {frame_num}: {pred} (confidence: {confidence:.2f})")  # 👈 DEBUG

                if confidence > 0.5:
                    predictions.append(pred)
            else:
                print(f"Frame {frame_num}: no hand detected")  # 👈 DEBUG

        cap.release()

        if not predictions:
            return "No Hand Detected"

        most_common = Counter(predictions).most_common(1)[0][0]
        print(f"Final votes: {Counter(predictions)}")  # 👈 DEBUG
        return most_common