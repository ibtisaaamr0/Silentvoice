import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform 
} from "react-native";
import * as Animatable from "react-native-animatable";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useSelector } from "react-redux";
import LinearGradient from "react-native-linear-gradient";

export default function AccountInfo({ navigation }) {
  const user = useSelector((state) => state.auth.user);
  const isDarkMode = useSelector((state) => state.theme?.isDarkMode);

  // Local state for editing
  const [name, setName] = useState(user?.name || "Ibtisam Rashid");
  const [email, setEmail] = useState(user?.email || "example@email.com");
  const [phone, setPhone] = useState("+92 ••• ••••••");

  const colors = {
    bg: isDarkMode ? "#0F172A" : "#F8FAFC",
    card: isDarkMode ? "#1E293B" : "#FFFFFF",
    text: isDarkMode ? "#F1F5F9" : "#1E293B",
    subtext: isDarkMode ? "#94A3B8" : "#64748B",
    inputBg: isDarkMode ? "#334155" : "#F1F5F9",
    primary: "#6366F1",
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      {/* --- 1. CUSTOM TOP BAR --- */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back-ios" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.text }]}>Edit Profile</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- 2. HEADER ICON --- */}
        <Animatable.View animation="fadeInDown" style={styles.headerIconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + "15" }]}>
            <MaterialIcons name="manage-accounts" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.headerSubtitle, { color: colors.subtext }]}>
            Keep your personal details up to date to ensure account security.
          </Text>
        </Animatable.View>

        {/* --- 3. INPUT GROUP --- */}
        <Animatable.View animation="fadeInUp" delay={200} style={[styles.card, { backgroundColor: colors.card }]}>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.subtext }]}>Full Name</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg }]}>
              <MaterialIcons name="person-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput 
                style={[styles.input, { color: colors.text }]} 
                value={name}
                onChangeText={setName}
                placeholderTextColor={colors.subtext}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.subtext }]}>Email Address</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg }]}>
              <MaterialIcons name="mail-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput 
                style={[styles.input, { color: colors.text }]} 
                value={email}
                editable={false} // Usually email isn't editable for security
                placeholderTextColor={colors.subtext}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.subtext }]}>Phone Number</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg }]}>
              <MaterialIcons name="phone-iphone" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput 
                style={[styles.input, { color: colors.text }]} 
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor={colors.subtext}
              />
            </View>
          </View>

          {/* --- 4. ACTION BUTTON --- */}
          <TouchableOpacity activeOpacity={0.8} style={styles.updateBtnWrapper}>
            <LinearGradient
              colors={[colors.primary, "#8B5CF6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.updateBtn}
            >
              <Text style={styles.updateText}>Save Changes</Text>
            </LinearGradient>
          </TouchableOpacity>

        </Animatable.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: { fontSize: 18, fontWeight: "800" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  headerIconContainer: { alignItems: 'center', marginVertical: 30 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  headerSubtitle: { textAlign: 'center', fontSize: 14, lineHeight: 20, paddingHorizontal: 20 },

  card: {
    padding: 24,
    borderRadius: 32,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: "700", textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 15 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 50, fontSize: 15, fontWeight: "600" },

  updateBtnWrapper: { marginTop: 10, borderRadius: 16, overflow: 'hidden' },
  updateBtn: { paddingVertical: 16, alignItems: "center" },
  updateText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});