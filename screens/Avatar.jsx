import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  Dimensions
} from "react-native";
import * as Animatable from "react-native-animatable";
import LinearGradient from "react-native-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { useSelector } from "react-redux";
import AvatarImg from "../avatar.jpeg"; 

const { width } = Dimensions.get("window");

export default function Avatar({ navigation }) {
  const isDarkMode = useSelector((state) => state.theme?.isDarkMode);

  // --- Dynamic Theme Palette ---
  const colors = {
    bg: isDarkMode ? "#0F172A" : "#F8FAFC",
    card: isDarkMode ? "#1E293B" : "#FFFFFF",
    text: isDarkMode ? "#F1F5F9" : "#1E293B",
    subtext: isDarkMode ? "#94A3B8" : "#64748B",
    primary: "#6366F1", // Indigo
    accent: "#F43F5E",  // Rose
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* --- 1. REFINED HEADER --- */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.helloText, { color: colors.text }]}>Your Avatar 🧍</Text>
            <Text style={[styles.subtitle, { color: colors.subtext }]}>
              Interact, customize, and bring your sign to life.
            </Text>
          </View>
          <Image source={AvatarImg} style={[styles.headerAvatar, { borderColor: colors.primary }]} />
        </View>

        {/* --- 2. AVATAR CARD (Fixing Transparency) --- */}
        <Animatable.View
          animation="fadeInUp"
          duration={1000}
          style={[styles.avatarCard, { backgroundColor: colors.card }]}
        >
          <LinearGradient colors={[colors.primary, "#8B5CF6"]} style={styles.gradientBox}>
            <View style={styles.imageInnerShadow}>
               {/* Fixed: borderRadius on Image hides the white corners */}
              <Image source={AvatarImg} style={styles.avatarImage} />
            </View>
          </LinearGradient>
          
          <Text style={[styles.cardTitle, { color: colors.text }]}>3D Animated Avatar</Text>
          <Text style={[styles.cardSubtitle, { color: colors.subtext }]}>Your digital communication partner</Text>
          
          <View style={[styles.statusBadge, { backgroundColor: colors.primary + "20" }]}>
            <View style={[styles.statusDot, { backgroundColor: "#10B981" }]} />
            <Text style={[styles.statusText, { color: colors.primary }]}>System Ready</Text>
          </View>
        </Animatable.View>

        {/* --- 3. UNIFIED ACTION BUTTONS --- */}
        <View style={styles.iconRow}>
          {[
            { label: "Start", icon: "play-arrow", lib: "MI", color: colors.primary },
            { label: "Edit", icon: "user-edit", lib: "FA5", color: colors.accent },
            { label: "Config", icon: "tune", lib: "MI", color: "#64748B" }
          ].map((item, index) => (
            <Animatable.View key={index} animation="zoomIn" delay={400 + (index * 100)}>
              <Pressable
                onPress={() => index === 1 ? navigation.navigate("Customize") : alert(`${item.label}ing...`)}
                style={({ pressed }) => [
                  styles.iconBox,
                  { 
                    backgroundColor: colors.card,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                    elevation: 4
                  }
                ]}
              >
                <View style={[styles.smallIconCircle, { backgroundColor: item.color + "15" }]}>
                  {item.lib === "MI" ? (
                    <MaterialIcons name={item.icon} size={28} color={item.color} />
                  ) : (
                    <FontAwesome5 name={item.icon} size={22} color={item.color} />
                  )}
                </View>
                <Text style={[styles.iconLabel, { color: colors.text }]}>{item.label}</Text>
              </Pressable>
            </Animatable.View>
          ))}
        </View>

        {/* --- 4. ENHANCED INFO SECTION --- */}
        <Animatable.View 
          animation="fadeInUp" 
          delay={1000} 
          style={[styles.bottomCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "20" }]}
        >
          <Text style={[styles.bottomText, { color: colors.text }]}>
            "Your avatar adapts to your expressions and gestures, helping you
            communicate naturally through sign language."
          </Text>
        </Animatable.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 60 },
  helloText: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 4, lineHeight: 18, width: '80%' },
  headerAvatar: { width: 45, height: 45, borderRadius: 22.5, borderWidth: 2 },

  avatarCard: {
    alignItems: "center",
    borderRadius: 30,
    paddingVertical: 35,
    marginTop: 30,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  gradientBox: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
  },
  imageInnerShadow: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    overflow: 'hidden', // This is key to fixing the white corners!
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 75, // Matches the container to mask corners
    resizeMode: "cover",
  },
  cardTitle: { fontSize: 20, fontWeight: "800", marginTop: 20 },
  cardSubtitle: { fontSize: 14, marginTop: 4, fontWeight: "500" },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 15 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 12, fontWeight: "700", textTransform: 'uppercase' },

  iconRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 30 },
  iconBox: { width: width * 0.28, height: 110, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  smallIconCircle: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  iconLabel: { fontSize: 13, fontWeight: "700" },

  bottomCard: { borderRadius: 24, padding: 25, marginVertical: 30, borderWidth: 1, alignItems: 'center' },
  bottomText: { fontSize: 14, textAlign: "center", lineHeight: 22, fontStyle: 'italic', fontWeight: '500' },
});