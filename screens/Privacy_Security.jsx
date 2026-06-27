import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logout } from "../Redux/features/authSlice";
import { resetProfile } from "../Redux/features/profileSlice";
import { loadSettings, saveSettings } from "../utils/settingsStorage";
import { checkBiometricAvailable, authenticateWithBiometrics } from "../utils/biometricAuth";

export default function PrivacySecurity() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const isDarkMode = useSelector((state) => state.theme?.isDarkMode);
  const [settings, setSettings] = useState(null);

  const colors = {
    bg: isDarkMode ? "#0F172A" : "#F8FAFC",
    card: isDarkMode ? "#1E293B" : "#FFFFFF",
    text: isDarkMode ? "#F1F5F9" : "#1E293B",
    subtext: isDarkMode ? "#94A3B8" : "#64748B",
    border: isDarkMode ? "#334155" : "#E2E8F0",
    accent: "#6366F1",
    danger: "#EF4444",
  };

  useEffect(() => {
    (async () => {
      const loaded = await loadSettings();
      setSettings(loaded);
    })();
  }, []);

  const handleBiometricToggle = async (value) => {
    if (value) {
      const available = await checkBiometricAvailable();
      if (!available) {
        Alert.alert("Not Available", "Your device doesn't support biometric authentication.");
        return;
      }
      const confirmed = await authenticateWithBiometrics();
      if (!confirmed) return;
    }
    const updated = { ...settings, biometricLock: value };
    setSettings(updated);
    await saveSettings(updated);
  };

  const handleSaveHistoryToggle = async (value) => {
    const updated = { ...settings, saveHistory: value };
    setSettings(updated);
    await saveSettings(updated);
  };

  const handleChangePassword = () => {
    navigation.navigate("ForgotPass");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all saved data on this device. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
            dispatch(logout());
            dispatch(resetProfile());
            navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          },
        },
      ]
    );
  };

  if (!settings) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy & Security</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={[styles.groupTitle, { color: colors.subtext }]}>Security</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <View style={[styles.iconSquare, { backgroundColor: colors.accent + "15" }]}>
              <MaterialIcons name="fingerprint" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Biometric Lock</Text>
              <Text style={[styles.rowSubtitle, { color: colors.subtext }]}>Require fingerprint to open the app</Text>
            </View>
            <Switch
              value={settings.biometricLock}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: colors.border, true: colors.accent + "80" }}
              thumbColor={settings.biometricLock ? colors.accent : "#f4f3f4"}
            />
          </View>

          <TouchableOpacity style={styles.row} onPress={handleChangePassword}>
            <View style={[styles.iconSquare, { backgroundColor: colors.accent + "15" }]}>
              <MaterialIcons name="lock" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text, flex: 1 }]}>Change Password</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.subtext} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.groupTitle, { color: colors.subtext, marginTop: 22 }]}>Data & Privacy</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.row}>
            <View style={[styles.iconSquare, { backgroundColor: colors.accent + "15" }]}>
              <MaterialIcons name="history" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Save Practice History</Text>
              <Text style={[styles.rowSubtitle, { color: colors.subtext }]}>Keep a record of signs you have practiced</Text>
            </View>
            <Switch
              value={settings.saveHistory}
              onValueChange={handleSaveHistoryToggle}
              trackColor={{ false: colors.border, true: colors.accent + "80" }}
              thumbColor={settings.saveHistory ? colors.accent : "#f4f3f4"}
            />
          </View>
        </View>

        <Text style={[styles.groupTitle, { color: colors.subtext, marginTop: 22 }]}>Account</Text>
        <TouchableOpacity
          style={[styles.dangerButton, { backgroundColor: isDarkMode ? "#ef444420" : "#FEE2E2" }]}
          onPress={handleDeleteAccount}
        >
          <MaterialIcons name="delete-outline" size={20} color={colors.danger} />
          <Text style={[styles.dangerText, { color: colors.danger }]}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 55, paddingBottom: 16 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  groupTitle: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", marginBottom: 10, marginLeft: 4, letterSpacing: 1 },
  card: { borderRadius: 20, overflow: "hidden", elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
  row: { flexDirection: "row", alignItems: "center", padding: 16 },
  iconSquare: { width: 38, height: 38, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 14 },
  rowLabel: { fontSize: 15, fontWeight: "700" },
  rowSubtitle: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  dangerButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 16 },
  dangerText: { fontSize: 15, fontWeight: "700", marginLeft: 10 },
});