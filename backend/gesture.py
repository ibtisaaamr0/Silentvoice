import cv2
import mediapipe as mp
from collections import deque

class GestureRecognizer:
    def __init__(self):
        self.buffer = deque(maxlen=5)

        self.mp_hands = mp.solutions.hands
        self.mp_draw = mp.solutions.drawing_utils

        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            model_complexity=0,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

    def detect(self, frame):
        if frame is None:
            return "No Frame"

        # Resize for better detection speed
        frame = cv2.resize(frame, (640, 480))

        # Flip
        frame = cv2.flip(frame, 1)

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        results = self.hands.process(rgb)

        gesture = "No Hand"

        if results.multi_hand_landmarks:

            for hand_landmarks in results.multi_hand_landmarks:

                # Draw landmarks
                self.mp_draw.draw_landmarks(
                    frame,
                    hand_landmarks,
                    self.mp_hands.HAND_CONNECTIONS
                )

                lm = hand_landmarks.landmark

                fingers = []

                # Thumb
                fingers.append(1 if lm[4].x < lm[3].x else 0)

                # Fingers
                tips = [8, 12, 16, 20]
                pips = [6, 10, 14, 18]

                for tip, pip in zip(tips, pips):
                    fingers.append(1 if lm[tip].y < lm[pip].y else 0)

                total = sum(fingers)

                if total == 5:
                    gesture = "Hello"
                elif total == 0:
                    gesture = "Fist"
                elif fingers == [0, 1, 1, 0, 0]:
                    gesture = "Peace"
                elif fingers == [1, 0, 0, 0, 0]:
                    gesture = "Thumbs Up"
                elif fingers == [0, 1, 0, 0, 0]:
                    gesture = "Pointing"
                else:
                    gesture = str(fingers)

        # Save debug image
        cv2.imwrite("debug_detection.jpg", frame)

        self.buffer.append(gesture)

        return max(set(self.buffer), key=self.buffer.count)