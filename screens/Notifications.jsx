import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { loadSettings, saveSettings } from "../utils/settingsStorage";
import { scheduleDailyReminder, cancelReminders } from "../utils/notifications";

export default function Notifications() {
  const navigation = useNavigation();
  const isDarkMode = useSelector((state) => state.theme?.isDarkMode);
  const [settings, setSettings] = useState(null);

  const colors = {
    bg: isDarkMode ? "#0F172A" : "#F8FAFC",
    card: isDarkMode ? "#1E293B" : "#FFFFFF",
    text: isDarkMode ? "#F1F5F9" : "#1E293B",
    subtext: isDarkMode ? "#94A3B8" : "#64748B",
    border: isDarkMode ? "#334155" : "#E2E8F0",
    accent: "#6366F1",
  };

  useEffect(() => {
    (async () => {
      const loaded = await loadSettings();
      setSettings(loaded);
    })();
  }, []);

  const toggle = async (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    await saveSettings(updated);

    if (key === "practiceReminders") {
      updated.practiceReminders ? scheduleDailyReminder() : cancelReminders();
    }
  };

  if (!settings) return null;

  const groups = [
    {
      title: "Learning",
      items: [
        { key: "practiceReminders", label: "Practice Reminders", subtitle: "Daily reminder at 6:00 PM", icon: "alarm" },
        { key: "quizResults", label: "Quiz Results", subtitle: "Get notified when your quiz score is ready", icon: "emoji-events" },
        { key: "newSignsAdded", label: "New Signs Added", subtitle: "Alerts when new vocabulary is available", icon: "auto-awesome" },
      ],
    },
    {
      title: "App",
      items: [
        { key: "appUpdates", label: "App Updates", subtitle: "News about new features and improvements", icon: "system-update" },
      ],
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {groups.map((group, gIndex) => (
          <View key={gIndex} style={styles.groupWrapper}>
            <Text style={[styles.groupTitle, { color: colors.subtext }]}>{group.title}</Text>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              {group.items.map((item, iIndex) => (
                <View
                  key={item.key}
                  style={[
                    styles.row,
                    iIndex !== group.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                >
                  <View style={[styles.iconSquare, { backgroundColor: colors.accent + "15" }]}>
                    <MaterialIcons name={item.icon} size={20} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowLabel, { color: colors.text }]}>{item.label}</Text>
                    <Text style={[styles.rowSubtitle, { color: colors.subtext }]}>{item.subtitle}</Text>
                  </View>
                  <Switch
                    value={settings[item.key]}
                    onValueChange={() => toggle(item.key)}
                    trackColor={{ false: colors.border, true: colors.accent + "80" }}
                    thumbColor={settings[item.key] ? colors.accent : "#f4f3f4"}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 55, paddingBottom: 16 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  groupWrapper: { marginBottom: 22 },
  groupTitle: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", marginBottom: 10, marginLeft: 4, letterSpacing: 1 },
  card: { borderRadius: 20, overflow: "hidden", elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
  row: { flexDirection: "row", alignItems: "center", padding: 16 },
  iconSquare: { width: 38, height: 38, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 14 },
  rowLabel: { fontSize: 15, fontWeight: "700" },
  rowSubtitle: { fontSize: 12, fontWeight: "500", marginTop: 2 },
});