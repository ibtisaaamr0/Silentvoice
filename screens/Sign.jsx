import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Camera, useCameraDevice } from "react-native-vision-camera";
import Tts from "react-native-tts";

const BACKEND_URL = "http://192.168.100.190:8080/gesture-video";

// Screen states
const STATE_IDLE = "idle";
const STATE_RECORDING = "recording";
const STATE_TRANSLATING = "translating";
const STATE_RESULT = "result";

export default function Sign() {
  const device = useCameraDevice("front");
  const cameraRef = useRef(null);

  const [hasPermission, setHasPermission] = useState(false);
  const [screenState, setScreenState] = useState(STATE_IDLE);
  const [gesture, setGesture] = useState("");
  const [lang, setLang] = useState("en");

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleStartRecording = async () => {
    if (!cameraRef.current) return;
    setScreenState(STATE_RECORDING);

    cameraRef.current.startRecording({
      onRecordingFinished: async (video) => {
        setScreenState(STATE_TRANSLATING);
        await sendVideo(video.path);
      },
      onRecordingError: (error) => {
        console.log("Recording error:", error);
        setScreenState(STATE_IDLE);
      },
    });
  };

  const handleStopRecording = async () => {
    if (cameraRef.current) {
      await cameraRef.current.stopRecording();
    }
  };

  const sendVideo = async (videoPath) => {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: "file://" + videoPath,
        type: "video/mp4",
        name: "sign.mp4",
      });
      formData.append("lang", lang);

      const res = await fetch(BACKEND_URL, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const json = await res.json();
      setGesture(json.display || json.gesture || "No sign detected");
      setScreenState(STATE_RESULT);
    } catch (err) {
      console.log("Upload error:", err.message);
      setGesture("⚠️ Connection error, try again");
      setScreenState(STATE_RESULT);
    }
  };

  const handleRecordAgain = () => {
    setGesture("");
    setScreenState(STATE_IDLE);
  };

  const speakResult = () => {
    Tts.setDefaultLanguage(lang === "ur" ? "ur-PK" : "en-US");
    Tts.speak(gesture);
  };

  const toggleLang = () => setLang((p) => (p === "en" ? "ur" : "en"));

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera permission needed</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>No Camera Found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        video={true}
        audio={false}
      />

      {/* Language toggle */}
      {screenState !== STATE_TRANSLATING && (
        <TouchableOpacity style={styles.langButton} onPress={toggleLang}>
          <Text style={styles.langButtonText}>
            {lang === "en" ? "EN" : "UR"}
          </Text>
        </TouchableOpacity>
      )}

      {/* ============ STATE: IDLE ============ */}
      {screenState === STATE_IDLE && (
        <View style={styles.bottomPanel}>
          <Text style={styles.hint}>
            Tap to record a word or sentence in sign language
          </Text>
          <TouchableOpacity
            style={styles.recordButton}
            onPress={handleStartRecording}
            activeOpacity={0.8}
          >
            <View style={styles.recordDot} />
            <Text style={styles.recordText}>Start Recording</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ============ STATE: RECORDING ============ */}
      {screenState === STATE_RECORDING && (
        <View style={styles.bottomPanel}>
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingPulse} />
            <Text style={styles.recordingLabel}>Recording...</Text>
          </View>
          <TouchableOpacity
            style={styles.stopButton}
            onPress={handleStopRecording}
            activeOpacity={0.8}
          >
            <View style={styles.stopSquare} />
            <Text style={styles.recordText}>Stop Recording</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ============ STATE: TRANSLATING ============ */}
      {screenState === STATE_TRANSLATING && (
        <View style={styles.translatingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.translatingText}>Translating sign...</Text>
        </View>
      )}

      {/* ============ STATE: RESULT ============ */}
      {screenState === STATE_RESULT && (
        <View style={styles.bottomPanel}>
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Translation:</Text>
            <Text
              style={[
                styles.resultText,
                { writingDirection: lang === "ur" ? "rtl" : "ltr" },
              ]}
            >
              {gesture}
            </Text>
            <TouchableOpacity style={styles.speakButton} onPress={speakResult}>
              <Text style={styles.speakText}>🔊 Speak</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.recordButton}
            onPress={handleRecordAgain}
            activeOpacity={0.8}
          >
            <Text style={styles.recordText}>Record Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  text: { color: "white", fontSize: 18 },

  langButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  langButtonText: { fontWeight: "bold", color: "#222" },

bottomPanel: {
  position: "absolute",
  bottom: 100,   // increased to clear the tab bar
  left: 0,
  right: 0,
  alignItems: "center",
  paddingHorizontal: 20,
  zIndex: 10,
},
  hint: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },

  recordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e53935",
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 30,
    elevation: 5,
  },
  recordDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "white",
    marginRight: 10,
  },
  recordText: { color: "white", fontWeight: "bold", fontSize: 16 },

  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#424242",
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 30,
    elevation: 5,
  },
  stopSquare: {
    width: 14,
    height: 14,
    backgroundColor: "white",
    marginRight: 10,
    borderRadius: 3,
  },

  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#e53935",
    marginRight: 8,
  },
  recordingLabel: { color: "white", fontSize: 15, fontWeight: "600" },

  translatingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  translatingText: {
    color: "white",
    fontSize: 18,
    marginTop: 16,
    fontWeight: "600",
  },

  resultBox: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    width: "100%",
    alignItems: "center",
  },
  resultLabel: { color: "#aaa", fontSize: 13, marginBottom: 8 },
  resultText: {
    color: "white",
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
  },

  speakButton: {
    marginTop: 14,
    backgroundColor: "#1e88e5",
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
  speakText: { color: "white", fontWeight: "bold" },
});