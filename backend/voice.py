import speech_recognition as sr
from googletrans import Translator

recognizer = sr.Recognizer()
translator = Translator()


# =========================
# SPEECH TO TEXT
# =========================
def speech_to_text(audio_file_path):

    try:
        with sr.AudioFile(audio_file_path) as source:
            audio = recognizer.record(source)

        text = recognizer.recognize_google(audio)
        return text

    except sr.UnknownValueError:
        return "Could not understand audio"

    except sr.RequestError:
        return "Speech API error"


# =========================
# TRANSLATION
# =========================
def translate_text(text, lang):

    if lang == "en":
        return text

    try:
        return translator.translate(text, dest=lang).text

    except:
        return "Translation error"