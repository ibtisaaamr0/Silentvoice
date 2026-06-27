import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import Tts from "react-native-tts";

export default function TextToVoice() {
  const [inputText, setInputText] = useState("");
  const [lang, setLang] = useState("en");

  const speak = () => {
    if (!inputText.trim()) return;
    Tts.setDefaultLanguage(lang === "ur" ? "ur-PK" : "en-US");
    Tts.speak(inputText);
  };

  const toggleLang = () => setLang((p) => (p === "en" ? "ur" : "en"));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Text to Voice</Text>
        <TouchableOpacity style={styles.langButton} onPress={toggleLang}>
          <Text style={styles.langButtonText}>{lang === "en" ? "EN" : "UR"}</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={[styles.input, { writingDirection: lang === "ur" ? "rtl" : "ltr" }]}
        placeholder={lang === "ur" ? "یہاں لکھیں..." : "Type something..."}
        placeholderTextColor="#94A3B8"
        value={inputText}
        onChangeText={setInputText}
        multiline
      />

      <TouchableOpacity style={styles.speakButton} onPress={speak}>
        <Text style={styles.speakText}>🔊 Speak</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", padding: 20, paddingTop: 60 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { color: "white", fontSize: 22, fontWeight: "800" },
  langButton: {
    backgroundColor: "rgba(255,255,255,0.9)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  langButtonText: { fontWeight: "bold", color: "#222" },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 18,
    color: "white", fontSize: 16, minHeight: 140, textAlignVertical: "top",
  },
  speakButton: {
    marginTop: 20, backgroundColor: "#6366F1", paddingVertical: 16, borderRadius: 30, alignItems: "center",
  },
  speakText: { color: "white", fontWeight: "bold", fontSize: 16 },
});