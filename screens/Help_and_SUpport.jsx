import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Linking } from "react-native";
import * as Animatable from "react-native-animatable";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";

export default function HelpSupport() {
  return (
    <Animatable.View animation="fadeIn" duration={800} style={{ flex: 1, backgroundColor: "#ffffffff" }}>
      <ScrollView style={styles.container}>
        
        <Animatable.Text animation="fadeInDown" style={styles.heading}>
          Help & Support
        </Animatable.Text>

        <Animatable.View animation="fadeInUp" delay={200} style={styles.card}>
          <Text style={styles.info}>Need help? We’re here for you.</Text>

          <Pressable onPress={() => Linking.openURL("mailto:support@silentvoice.app")} style={styles.btn}>
            <FontAwesome5 name="envelope" size={18} color="#fff" />
            <Text style={styles.btnText}>Email Support</Text>
          </Pressable>

          <Pressable onPress={() => Linking.openURL("https://silentvoice.app/faq")} style={styles.btn}>
            <FontAwesome5 name="question-circle" size={18} color="#fff" />
            <Text style={styles.btnText}>Visit FAQ</Text>
          </Pressable>
        </Animatable.View>
      </ScrollView>
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#d3d3d3ff", paddingHorizontal: 20, paddingTop: 50 },
  heading: { fontSize: 20, fontWeight: "700", marginBottom: 15 },
  card: { backgroundColor: "#fff", padding: 20, borderRadius: 20 },
  info: { marginBottom: 15, color: "#333" },
  btn: {
    backgroundColor: "#b42f2fff",
    padding: 14,
    borderRadius: 15,
    marginVertical: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  btnText: { color: "#fff", marginLeft: 10, fontWeight: "600" },
});
