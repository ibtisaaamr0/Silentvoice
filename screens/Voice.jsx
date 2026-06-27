import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import AudioRecorderPlayer from "react-native-audio-recorder-player";
import Tts from "react-native-tts";

const BACKEND_URL = "http://192.168.100.190:8080/voice";

const STATE_IDLE = "idle";
const STATE_RECORDING = "recording";
const STATE_TRANSLATING = "translating";
const STATE_RESULT = "result";

const audioRecorderPlayer = new AudioRecorderPlayer();

export default function Voice() {
  const [screenState, setScreenState] = useState(STATE_IDLE);
  const [originalText, setOriginalText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [lang, setLang] = useState("en");
  const audioPathRef = useRef(null);

  const handleStartRecording = async () => {
    setScreenState(STATE_RECORDING);
    const path = "sound.wav";
    try {
      const uri = await audioRecorderPlayer.startRecorder(path, {
        AudioEncoderAndroid: "default",
        AudioSourceAndroid: "default",
      });
      audioPathRef.current = uri;
    } catch (err) {
      console.log("Start recording error:", err);
      setScreenState(STATE_IDLE);
    }
  };

  const handleStopRecording = async () => {
    try {
      const uri = await audioRecorderPlayer.stopRecorder();
      audioPathRef.current = uri;
      setScreenState(STATE_TRANSLATING);
      await sendAudio(uri);
    } catch (err) {
      console.log("Stop recording error:", err);
      setScreenState(STATE_IDLE);
    }
  };

  const sendAudio = async (audioUri) => {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: audioUri,
        type: "audio/wav",
        name: "voice.wav",
      });
      formData.append("lang", lang);

      const res = await fetch(BACKEND_URL, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const json = await res.json();
      setOriginalText(json.original || "No speech detected");
      setTranslatedText(json.translated || json.original || "");
      setScreenState(STATE_RESULT);
    } catch (err) {
      console.log("Upload error:", err.message);
      setOriginalText("⚠️ Connection error, try again");
      setTranslatedText("");
      setScreenState(STATE_RESULT);
    }
  };

  const handleRecordAgain = () => {
    setOriginalText("");
    setTranslatedText("");
    setScreenState(STATE_IDLE);
  };

  const speakResult = () => {
    Tts.setDefaultLanguage(lang === "ur" ? "ur-PK" : "en-US");
    Tts.speak(translatedText || originalText);
  };

  const toggleLang = () => setLang((p) => (p === "en" ? "ur" : "en"));

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.langButton} onPress={toggleLang}>
        <Text style={styles.langButtonText}>{lang === "en" ? "EN" : "UR"}</Text>
      </TouchableOpacity>

      {screenState === STATE_IDLE && (
        <View style={styles.centerPanel}>
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

      {screenState === STATE_TRANSLATING && (
        <View style={styles.centerPanel}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.translatingText}>Processing speech...</Text>
        </View>
      )}

      {screenState === STATE_RESULT && (
        <View style={styles.centerPanel}>
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>You said:</Text>
            <Text style={styles.resultText}>{originalText}</Text>

            {lang === "ur" && translatedText && (
              <>
                <Text style={[styles.resultLabel, { marginTop: 16 }]}>Translation:</Text>
                <Text style={[styles.resultText, { writingDirection: "rtl" }]}>
                  {translatedText}
                </Text>
              </>
            )}

            <TouchableOpacity style={styles.speakButton} onPress={speakResult}>
              <Text style={styles.speakText}>🔊 Speak</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.recordButton} onPress={handleRecordAgain}>
            <Text style={styles.recordText}>Record Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", padding: 20, justifyContent: "center" },
  langButton: {
    position: "absolute", top: 50, right: 20,
    backgroundColor: "rgba(255,255,255,0.9)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  langButtonText: { fontWeight: "bold", color: "#222" },
  centerPanel: { alignItems: "center" },
  hint: { color: "#94A3B8", fontSize: 14, marginBottom: 20, textAlign: "center" },
  recordButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#6366F1", paddingHorizontal: 30, paddingVertical: 16, borderRadius: 30, elevation: 5,
  },
  recordDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: "white", marginRight: 10 },
  recordText: { color: "white", fontWeight: "bold", fontSize: 16 },
  stopButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#424242", paddingHorizontal: 30, paddingVertical: 16, borderRadius: 30, elevation: 5,
  },
  stopSquare: { width: 14, height: 14, backgroundColor: "white", marginRight: 10, borderRadius: 3 },
  recordingIndicator: {
    flexDirection: "row", alignItems: "center", marginBottom: 20,
    backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  recordingPulse: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#F43F5E", marginRight: 8 },
  recordingLabel: { color: "white", fontSize: 15, fontWeight: "600" },
  translatingText: { color: "white", fontSize: 16, marginTop: 16, fontWeight: "600" },
  resultBox: {
    backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 24, marginBottom: 20, width: "100%", alignItems: "center",
  },
  resultLabel: { color: "#94A3B8", fontSize: 13, marginBottom: 8 },
  resultText: { color: "white", fontSize: 22, fontWeight: "bold", textAlign: "center" },
  speakButton: { marginTop: 16, backgroundColor: "#6366F1", paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10 },
  speakText: { color: "white", fontWeight: "bold" },
});