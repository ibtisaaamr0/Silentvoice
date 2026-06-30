from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import numpy as np
import cv2
import base64
import os
import urllib.parse
from model_downloader import ensure_model_downloaded

ensure_model_downloaded()

app = Flask(__name__)
CORS(app)

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "Backend running",
        "service": "Silent Voice API"
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok"
    })
try:
    from gesture import GestureRecognizer
    from voice import speech_to_text, translate_text
    from labels_urdu import translate as translate_label
    detector = GestureRecognizer()
    ML_READY = True
except Exception as e:
    print(f"[WARN] ML modules not loaded: {e}")
    ML_READY = False


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


# =========================
# GESTURE VIDEO ROUTE
# =========================@app.route("/gesture-video", methods=["POST"])
def gesture_video():

    print("\n========== NEW REQUEST ==========")
    print("Content-Type:", request.content_type)
    print("Files:", list(request.files.keys()))
    print("Form:", request.form.to_dict())

    if not ML_READY:
        return jsonify({"error": "ML not loaded"}), 500

    if "file" not in request.files:
        print("NO FILE RECEIVED")
        return jsonify({"error": "No video file"}), 400
        
    file = request.files['file']
    lang = request.form.get("lang", "en")

    print("Filename:", file.filename)
    print("Language:", lang)

    video_path = "temp_video.mp4"
    file.save(video_path)

    if os.path.exists(video_path):
        print("Video saved successfully.")
        print("Video size:", os.path.getsize(video_path), "bytes")
    else:
        print("Video was NOT saved!")

    print("Running gesture detection...")

    result = detector.detect_from_video(video_path)

    print("Detection result:", result)

    display = translate_label(result, lang)

    os.remove(video_path)

    print("Temporary video deleted.")
    print("====================================\n")

    return jsonify({
        "gesture": result,
        "display": display
    })


# =========================
# VOICE ROUTE
# =========================
@app.route("/voice", methods=["POST"])
def voice():
    if not ML_READY:
        return jsonify({"error": "ML modules unavailable"})
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
# VIDEO SERVE (range-request streaming)
# =========================
@app.route("/video/<path:filepath>", methods=["GET"])
def serve_video(filepath):
    # Safely handle encoded spaces (%20) or characters passed down by your front-end components
    decoded_filepath = urllib.parse.unquote(filepath)
    
    # Auto-append extension if the route payload skips it
    if not decoded_filepath.lower().endswith('.mp4'):
        decoded_filepath += '.mp4'

    video_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "videos")
    path = os.path.abspath(os.path.join(video_dir, decoded_filepath))
    
    # Directory Traversal Guard (Make sure the target path stays inside the intended folder)
    if not path.startswith(os.path.abspath(video_dir)):
        return "Access Denied", 403

    if not os.path.isfile(path):
        return "Not found", 404

    size = os.path.getsize(path)
    range_header = request.headers.get("Range")

    if range_header:
        ranges = range_header.replace("bytes=", "").split("-")
        start = int(ranges[0])
        end = int(ranges[1]) if ranges[1] else size - 1
    else:
        start, end = 0, size - 1

    length = end - start + 1

    def stream():
        with open(path, "rb") as f:
            f.seek(start)
            remaining = length
            while remaining > 0:
                chunk = f.read(min(65536, remaining))
                if not chunk:
                    break
                remaining -= len(chunk)
                yield chunk

    status = 206 if range_header else 200
    headers = {
        "Content-Type": "video/mp4",
        "Content-Length": str(length),
        "Content-Range": f"bytes {start}-{end}/{size}",
        "Accept-Ranges": "bytes",
    }
    return Response(stream(), status=status, headers=headers)


# =========================
# RUN SERVER
# =========================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)