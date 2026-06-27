import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { authenticateWithBiometrics } from "../utils/biometricAuth";

export default function LockScreen({ onUnlock }) {
  const [error, setError] = useState(false);

  const handleUnlock = async () => {
    const success = await authenticateWithBiometrics();
    if (success) {
      onUnlock();
    } else {
      setError(true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialIcons name="fingerprint" size={60} color="#6366F1" />
      </View>
      <Text style={styles.title}>Silent Voice is Locked</Text>
      <Text style={styles.subtitle}>
        {error ? "Authentication failed. Try again." : "Unlock using your fingerprint or face"}
      </Text>
      <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock}>
        <Text style={styles.unlockText}>Unlock</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", justifyContent: "center", alignItems: "center", padding: 30 },
  iconCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: "rgba(99,102,241,0.15)",
    justifyContent: "center", alignItems: "center", marginBottom: 24,
  },
  title: { color: "#F1F5F9", fontSize: 20, fontWeight: "800", marginBottom: 8 },
  subtitle: { color: "#94A3B8", fontSize: 14, textAlign: "center", marginBottom: 30 },
  unlockButton: { backgroundColor: "#6366F1", paddingHorizontal: 40, paddingVertical: 14, borderRadius: 30 },
  unlockText: { color: "white", fontWeight: "700", fontSize: 16 },
});