import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  Dimensions
} from "react-native";
import * as Animatable from "react-native-animatable";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from 'react-native-image-picker';

// --- REDUX IMPORTS ---
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../Redux/features/authSlice";
import { setProfilePicture, resetProfile } from "../Redux/features/profileSlice";

const { width } = Dimensions.get("window");

export default function Profile() {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  // 1. Redux State
  const user = useSelector((state) => state.auth.user);
  const profilePic = useSelector((state) => state.profile.profilePicture);
  const isDarkMode = useSelector((state) => state.theme?.isDarkMode);

  // 2. Dynamic Theme Colors
  const colors = {
    bg: isDarkMode ? "#0F172A" : "#F8FAFC",
    card: isDarkMode ? "#1E293B" : "#FFFFFF",
    text: isDarkMode ? "#F1F5F9" : "#1E293B",
    subtext: isDarkMode ? "#94A3B8" : "#64748B",
    border: isDarkMode ? "#334155" : "#F1F5F9",
    accent: "#6366F1", // Indigo Accent
  };

  useEffect(() => {
    if (user?.profilePicture && !profilePic) {
      dispatch(setProfilePicture(user.profilePicture));
    }
  }, [user]);

  const handleEditPicture = () => {
    const options = { mediaType: 'photo', maxWidth: 300, maxHeight: 300, quality: 1 };
    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.assets && response.assets.length > 0) {
        dispatch(setProfilePicture(response.assets[0].uri));
      }
    });
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          dispatch(logout());
          dispatch(resetProfile());
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        },
      },
    ]);
  };

  const menuGroups = [
    {
      title: "Account Settings",
      items: [
        { icon: "person", label: "Account Information", color: "#6366F1", action: () => navigation.navigate("AccountInfo") },
        { icon: "notifications", label: "Notifications", color: "#F59E0B", action: () => navigation.navigate("Notification") },
      ]
    },
    {
      title: "Security & Support",
      items: [
        { icon: "security", label: "Privacy & Security", color: "#10B981", action: () => navigation.navigate("Privacy_and_Security") },
        { icon: "help-outline", label: "Help & Support", color: "#EC4899", action: () => navigation.navigate("Help_and_Support") },
      ]
    }
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 120 }} 
        showsVerticalScrollIndicator={false}
      >
        {/* --- 1. REFINED HEADER --- */}
        <Animatable.View animation="fadeIn" style={styles.headerContainer}>
          <TouchableOpacity onPress={handleEditPicture} activeOpacity={0.9}>
            <View style={[styles.avatarContainer, { borderColor: colors.accent }]}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.profileImage} />
              ) : (
                <View style={[styles.initialsCircle, { backgroundColor: colors.accent }]}>
                  <Text style={styles.initialsText}>{user?.name?.charAt(0).toUpperCase() || "I"}</Text>
                </View>
              )}
              <View style={[styles.editBadge, { backgroundColor: colors.accent }]}>
                <MaterialIcons name="edit" size={12} color="#FFF" />
              </View>
            </View>
          </TouchableOpacity>

          <Text style={[styles.userName, { color: colors.text }]}>{user?.name || "Ibtisam Rashid"}</Text>
          <Text style={[styles.userEmail, { color: colors.subtext }]}>{user?.email || "user@example.com"}</Text>
        </Animatable.View>

        {/* --- 2. GROUPED MENU ITEMS --- */}
        {menuGroups.map((group, gIndex) => (
          <View key={gIndex} style={styles.groupWrapper}>
            <Text style={[styles.groupTitle, { color: colors.subtext }]}>{group.title}</Text>
            <View style={[styles.groupContainer, { backgroundColor: colors.card }]}>
              {group.items.map((item, iIndex) => (
                <Pressable 
                  key={iIndex} 
                  onPress={item.action}
                  style={({ pressed }) => [
                    styles.menuItem,
                    { backgroundColor: pressed ? colors.border : 'transparent' },
                    iIndex !== group.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                  ]}
                >
                  <View style={[styles.iconSquare, { backgroundColor: item.color + "15" }]}>
                    <MaterialIcons name={item.icon} size={22} color={item.color} />
                  </View>
                  <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                  <MaterialIcons name="chevron-right" size={20} color={colors.subtext} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {/* --- 3. LOGOUT (STYLED DIFFERENTLY) --- */}
        <TouchableOpacity 
          onPress={handleLogout}
          style={[styles.logoutButton, { backgroundColor: isDarkMode ? "#ef444420" : "#FEE2E2" }]}
        >
          <MaterialIcons name="logout" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* --- 4. BRAND QUOTE --- */}
        <Text style={[styles.footerText, { color: colors.subtext }]}>
          Silent Voice v1.0.4{"\n"}Breaking barriers through technology.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: { alignItems: "center", marginTop: 60, marginBottom: 30 },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, padding: 3, justifyContent: 'center', alignItems: 'center' },
  profileImage: { width: '100%', height: '100%', borderRadius: 50 },
  initialsCircle: { width: '100%', height: '100%', borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  initialsText: { color: "#FFF", fontSize: 36, fontWeight: "800" },
  editBadge: { position: 'absolute', bottom: 2, right: 2, padding: 6, borderRadius: 12, borderWidth: 2, borderColor: '#FFF' },
  
  userName: { fontSize: 24, fontWeight: "800", marginTop: 15, letterSpacing: -0.5 },
  userEmail: { fontSize: 14, fontWeight: "500", marginTop: 2 },

  groupWrapper: { paddingHorizontal: 20, marginBottom: 25 },
  groupTitle: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", marginBottom: 10, marginLeft: 10, letterSpacing: 1 },
  groupContainer: { borderRadius: 24, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16 },
  iconSquare: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: "600" },

  logoutButton: { marginHorizontal: 20, marginTop: 10, padding: 18, borderRadius: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  logoutText: { color: "#EF4444", fontWeight: "700", fontSize: 16, marginLeft: 10 },

  footerText: { textAlign: 'center', marginTop: 30, fontSize: 12, lineHeight: 18, fontWeight: '500' }
});