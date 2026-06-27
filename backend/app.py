from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
import base64
import os

from gesture import GestureRecognizer
from voice import speech_to_text, translate_text
from labels_urdu import translate as translate_label   # 👈 NEW

app = Flask(__name__)
CORS(app)

detector = GestureRecognizer()


# =========================
# IMAGE DECODE (GESTURE)
# =========================
def decode_image(data):
    try:
        img_bytes = base64.b64decode(data)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return frame
    except:
        return None



@app.route("/gesture-video", methods=["POST"])
def gesture_video():
    if 'file' not in request.files:
        return jsonify({"error": "No video file"})

    file = request.files['file']
    lang = request.form.get("lang", "en")

    video_path = "temp_video.mp4"
    file.save(video_path)

    result = detector.detect_from_video(video_path)
    display = translate_label(result, lang)

    os.remove(video_path)

    return jsonify({
        "gesture": result,
        "display": display
    })

# =========================
# VOICE ROUTE
# =========================
@app.route("/voice", methods=["POST"])
def voice():

    if 'file' not in request.files:
        return jsonify({"error": "No audio file"})

    file = request.files['file']
    lang = request.form.get("lang", "en")

    file_path = "temp.wav"
    file.save(file_path)

    # STEP 1: Speech to text
    text = speech_to_text(file_path)

    # STEP 2: Translate
    translated = translate_text(text, lang)

    os.remove(file_path)

    return jsonify({
        "original": text,
        "translated": translated,
        "lang": lang
    })


# =========================
# RUN SERVER
# =========================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)