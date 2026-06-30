"""
model_downloader.py — Downloads the sign_model.pkl from Google Drive at
startup if it's not already present locally. This lets us deploy to
platforms like Render without pushing a 245MB file to GitHub, while still
working unchanged on local dev (where the file is already in model/).

Usage:
    from model_downloader import ensure_model_downloaded
    ensure_model_downloaded()   # call this BEFORE GestureRecognizer() is created
"""

import os
import gdown

# ── Configuration ────────────────────────────────────────────────────────
# Replace this with your actual Google Drive file ID (the part between
# /d/ and /view in the share link).
GDRIVE_FILE_ID = "1tvBf6LfwzOiiCZIEtEmJnK2tnnP2Nkn1"

MODEL_DIR  = "model"
MODEL_PATH = os.path.join(MODEL_DIR, "sign_model.pkl")


def ensure_model_downloaded():
    """
    Checks if model/sign_model.pkl exists locally. If not, downloads it
    from Google Drive using gdown. Safe to call every startup — it's a
    no-op if the file is already present (e.g. local dev).
    """
    if os.path.exists(MODEL_PATH):
        size_mb = os.path.getsize(MODEL_PATH) / (1024 * 1024)
        print(f"[model_downloader] Model already present ({size_mb:.1f} MB) — skipping download.")
        return

    os.makedirs(MODEL_DIR, exist_ok=True)

    print("[model_downloader] Model not found locally. Downloading from Google Drive...")
    url = f"https://drive.google.com/uc?id={GDRIVE_FILE_ID}"

    try:
        gdown.download(url, MODEL_PATH, quiet=False)
    except Exception as e:
        print(f"[model_downloader] FAILED to download model: {e}")
        raise

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            "[model_downloader] Download appeared to succeed but file is missing. "
            "Check the GDRIVE_FILE_ID and that sharing is set to 'Anyone with the link'."
        )

    size_mb = os.path.getsize(MODEL_PATH) / (1024 * 1024)
    print(f"[model_downloader] Download complete ({size_mb:.1f} MB).")


if __name__ == "__main__":
    # Allows manual testing: python model_downloader.py
    ensure_model_downloaded()