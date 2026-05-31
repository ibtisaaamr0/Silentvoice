import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PermissionsAndroid,
  Platform,
} from "react-native";

import Voice from "@react-native-voice/voice";
import axios from "axios";

const BACKEND_URL = "http://192.168.100.185:8080/voice";

export default function VoiceScreen() {
  const [recording, setRecording] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [lang, setLang] = useState("ur");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;

    requestPermissions();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
    }
  };

  const onSpeechResults = (e) => {
    const text = e.value?.[0] || "";
    setSpokenText(text);
  };

  const startRecording = async () => {
    setSpokenText("");
    setTranslatedText("");
    setRecording(true);

    try {
      await Voice.start("en-US");
    } catch (e) {
      console.log(e);
    }
  };

  const stopRecording = async () => {
    setRecording(false);

    try {
      await Voice.stop();
    } catch (e) {
      console.log(e);
    }
  };

  // 🔥 MANUAL TRANSLATE BUTTON (FIXED RELIABILITY)
  const translateText = async () => {
    if (!spokenText) return;

    try {
      setLoading(true);

      const res = await axios.post(BACKEND_URL, {
        text: spokenText,
        lang: lang,
      });

      setTranslatedText(res.data.translated);
    } catch (err) {
      setTranslatedText("❌ Translation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>🎙 Voice Translator</Text>

      {/* LANGUAGE SELECT */}
      <Text style={styles.label}>Select Language</Text>

      <View style={styles.row}>
        {[
          { code: "en", label: "English" },
          { code: "ur", label: "Urdu" },
          { code: "pa", label: "Punjabi" },
        ].map((item) => (
          <TouchableOpacity
            key={item.code}
            onPress={() => setLang(item.code)}
            style={[
              styles.langBtn,
              lang === item.code && styles.activeLang,
            ]}
          >
            <Text style={{ color: "white" }}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* MIC BUTTON */}
      <TouchableOpacity
        style={[
          styles.mic,
          recording && { backgroundColor: "#990000" },
        ]}
        onPress={recording ? stopRecording : startRecording}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          {recording ? "Stop Recording" : "Start Speaking"}
        </Text>
      </TouchableOpacity>

      {/* TRANSLATE BUTTON */}
      <TouchableOpacity
        style={styles.translateBtn}
        onPress={translateText}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          {loading ? "Translating..." : "Translate"}
        </Text>
      </TouchableOpacity>

      {/* OUTPUT BOXES */}
      <View style={styles.box}>
        <Text style={styles.heading}>You said:</Text>
        <Text style={styles.text}>
          {spokenText || "Speak something..."}
        </Text>
      </View>

      <View style={styles.box}>
        <Text style={styles.heading}>Translated:</Text>
        <Text style={styles.text}>
          {translatedText || "Translation will appear here"}
        </Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    padding: 20,
    justifyContent: "center",
  },

  title: {
    fontSize: 26,
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  label: {
    color: "#aaa",
    textAlign: "center",
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },

  langBtn: {
    padding: 10,
    backgroundColor: "#222",
    marginHorizontal: 5,
    borderRadius: 10,
  },

  activeLang: {
    backgroundColor: "#00bcd4",
  },

  mic: {
    backgroundColor: "red",
    padding: 18,
    borderRadius: 50,
    alignItems: "center",
    marginBottom: 15,
  },

  translateBtn: {
    backgroundColor: "#4caf50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 25,
  },

  box: {
    backgroundColor: "#1c1c1c",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },

  heading: {
    color: "#00bcd4",
    fontWeight: "bold",
    marginBottom: 8,
  },

  text: {
    color: "white",
    fontSize: 16,
  },
});