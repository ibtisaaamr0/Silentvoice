import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from "react-native";
import AudioRecord from "react-native-audio-record";
import Tts from "react-native-tts";
import { API_URL } from "../src/config";

const BACKEND_URL = `${API_URL}/voice`;

const STATE_IDLE = "idle";
const STATE_RECORDING = "recording";
const STATE_PROCESSING = "processing";
const STATE_RESULT = "result";

const audioOptions = {
  sampleRate: 16000,
  channels: 1,
  bitsPerSample: 16,
  audioSource: 6,
  wavFile: "voice.wav",
};

export default function Voice() {
  const [screenState, setScreenState] = useState(STATE_IDLE);
  const [originalText, setOriginalText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [audioPath, setAudioPath] = useState(null);

  useEffect(() => {
    requestPermission();
    AudioRecord.init(audioOptions);
  }, []);

  const requestPermission = async () => {
    if (Platform.OS === "android") {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
    }
  };

  const handleStartRecording = async () => {
    setScreenState(STATE_RECORDING);
    try {
      AudioRecord.start();
    } catch (err) {
      console.log("Start recording error:", err);
      setScreenState(STATE_IDLE);
    }
  };

  const handleStopRecording = async () => {
    try {
      const filePath = await AudioRecord.stop();
      setAudioPath(filePath);
      setScreenState(STATE_PROCESSING);
      await sendAudio(filePath);
    } catch (err) {
      console.log("Stop recording error:", err);
      setScreenState(STATE_IDLE);
    }
  };

  const sendAudio = async (filePath) => {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: "file://" + filePath,
        type: "audio/wav",
        name: "voice.wav",
      });
      formData.append("lang", "en");

      const res = await fetch(BACKEND_URL, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const json = await res.json();
      setOriginalText(json.original || "No speech detected");
      setTranslatedText("");
      setScreenState(STATE_RESULT);
    } catch (err) {
      console.log("Upload error:", err.message);
      setOriginalText("⚠️ Connection error, try again");
      setTranslatedText("");
      setScreenState(STATE_RESULT);
    }
  };

  const handleTranslate = async () => {
    if (!audioPath) return;
    setIsTranslating(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: "file://" + audioPath,
        type: "audio/wav",
        name: "voice.wav",
      });
      formData.append("lang", "ur");

      const res = await fetch(BACKEND_URL, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const json = await res.json();
      setTranslatedText(json.translated || "Translation unavailable");
    } catch (err) {
      console.log("Translate error:", err.message);
      setTranslatedText("⚠️ Translation failed");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleRecordAgain = () => {
    setOriginalText("");
    setTranslatedText("");
    setScreenState(STATE_IDLE);
  };

  const speakOriginal = () => {
    Tts.setDefaultLanguage("en-US");
    Tts.speak(originalText);
  };

  const speakTranslated = () => {
    Tts.setDefaultLanguage("ur-PK");
    Tts.speak(translatedText);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Voice to Text</Text>

      {screenState === STATE_IDLE && (
        <View style={styles.centerPanel}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>🎙️</Text>
          </View>
          <Text style={styles.hint}>Tap to record your voice</Text>
          <TouchableOpacity style={styles.recordButton} onPress={handleStartRecording}>
            <View style={styles.recordDot} />
            <Text style={styles.recordText}>Start Recording</Text>
          </TouchableOpacity>
        </View>
      )}

      {screenState === STATE_RECORDING && (
        <View style={styles.centerPanel}>
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingPulse} />
            <Text style={styles.recordingLabel}>Listening...</Text>
          </View>
          <TouchableOpacity style={styles.stopButton} onPress={handleStopRecording}>
            <View style={styles.stopSquare} />
            <Text style={styles.recordText}>Stop Recording</Text>
          </TouchableOpacity>
        </View>
      )}

      {screenState === STATE_PROCESSING && (
        <View style={styles.centerPanel}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.translatingText}>Transcribing speech...</Text>
        </View>
      )}

      {screenState === STATE_RESULT && (
        <View style={styles.centerPanel}>
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>You said</Text>
            <Text style={styles.resultText}>{originalText}</Text>
            <TouchableOpacity style={styles.speakButtonSmall} onPress={speakOriginal}>
              <Text style={styles.speakTextSmall}>🔊 Speak</Text>
            </TouchableOpacity>
          </View>

          {!translatedText && (
            <TouchableOpacity
              style={styles.translateButton}
              onPress={handleTranslate}
              disabled={isTranslating}
            >
              {isTranslating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.translateText}>🌐 Translate to Urdu</Text>
              )}
            </TouchableOpacity>
          )}

          {translatedText && (
            <View style={[styles.resultBox, { marginTop: 16, borderColor: "#10B981" }]}>
              <Text style={styles.resultLabel}>Urdu Translation</Text>
              <Text style={[styles.resultText, { writingDirection: "rtl" }]}>
                {translatedText}
              </Text>
              <TouchableOpacity style={styles.speakButtonSmall} onPress={speakTranslated}>
                <Text style={styles.speakTextSmall}>🔊 Speak</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.recordButton} onPress={handleRecordAgain}>
            <Text style={styles.recordText}>Record Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", padding: 20, paddingTop: 70 },
  screenTitle: { color: "#F1F5F9", fontSize: 22, fontWeight: "800", marginBottom: 30, textAlign: "center" },
  centerPanel: { alignItems: "center", flex: 1, justifyContent: "center" },
  iconCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: "rgba(99,102,241,0.15)",
    justifyContent: "center", alignItems: "center", marginBottom: 20,
  },
  iconEmoji: { fontSize: 36 },
  hint: { color: "#94A3B8", fontSize: 14, marginBottom: 24, textAlign: "center" },
  recordButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#6366F1", paddingHorizontal: 30, paddingVertical: 16, borderRadius: 30,
    elevation: 5, marginTop: 20,
  },
  recordDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: "white", marginRight: 10 },
  recordText: { color: "white", fontWeight: "bold", fontSize: 16 },
  stopButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#F43F5E", paddingHorizontal: 30, paddingVertical: 16, borderRadius: 30, elevation: 5,
  },
  stopSquare: { width: 14, height: 14, backgroundColor: "white", marginRight: 10, borderRadius: 3 },
  recordingIndicator: {
    flexDirection: "row", alignItems: "center", marginBottom: 24,
    backgroundColor: "rgba(244,63,94,0.12)", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
  },
  recordingPulse: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#F43F5E", marginRight: 8 },
  recordingLabel: { color: "#F43F5E", fontSize: 15, fontWeight: "700" },
  translatingText: { color: "#94A3B8", fontSize: 15, marginTop: 16, fontWeight: "600" },
  resultBox: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 22,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.3)",
  },
  resultLabel: { color: "#94A3B8", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  resultText: { color: "#F1F5F9", fontSize: 20, fontWeight: "700", textAlign: "center", lineHeight: 28 },
  speakButtonSmall: {
    marginTop: 14, backgroundColor: "rgba(99,102,241,0.2)",
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
  },
  speakTextSmall: { color: "#A5B4FC", fontWeight: "700", fontSize: 13 },
  translateButton: {
    marginTop: 16, backgroundColor: "#10B981",
    paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
  },
  translateText: { color: "white", fontWeight: "700", fontSize: 15 },
});