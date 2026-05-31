import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  StyleSheet,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import * as Animatable from "react-native-animatable";
import auth from "@react-native-firebase/auth";
import Logo from "../logo.png";

export default function ForgotPassword({ navigation }) {
  const [email, setEmail] = useState("");

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }

    try {
      await auth().sendPasswordResetEmail(email);
      Alert.alert(
        "Email Sent",
        "Check your inbox for password reset instructions."
      );
      navigation.goBack();
    } catch (error) {
      console.log(error);
      if (error.code === "auth/invalid-email") {
        Alert.alert("Invalid Email", "Please enter a valid email address.");
      } else if (error.code === "auth/user-not-found") {
        Alert.alert("User Not Found", "No user exists with this email.");
      } else {
        Alert.alert("Error", "Something went wrong. Try again later.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#b42f2f", "#FF6A3D"]} style={styles.header}>
        <Animatable.Image
          animation="zoomIn"
          duration={800}
          source={Logo}
          style={styles.logo}
        />
        <Animatable.Text animation="fadeInDown" delay={400} style={styles.title}>
          Reset Password
        </Animatable.Text>
      </LinearGradient>

      <Animatable.View animation="fadeInUp" delay={500} style={styles.bottomCard}>
        <Text style={styles.heading}>Forgot Your Password?</Text>
        <Text style={styles.subtext}>
          Enter your registered email address to receive reset instructions.
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          placeholder="Enter your email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Pressable style={styles.button} onPress={handleResetPassword}>
          <LinearGradient
            colors={["#FF6A3D", "#b42f2f"]}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>Send Reset Link</Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 15 }}>
          <Text style={{ color: "#b42f2f", textAlign: "center" }}>Back to Login</Text>
        </Pressable>
      </Animatable.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffececff",
  },
  header: {
    height: "40%",
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 25,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "700",
  },
  bottomCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -40,
    padding: 25,
    elevation: 8,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#b42f2f",
    textAlign: "center",
  },
  subtext: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginBottom: 25,
  },
  label: {
    fontWeight: "600",
    color: "#333",
    marginTop: 10,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 15,
    padding: 12,
    marginTop: 8,
  },
  button: {
    marginTop: 25,
    borderRadius: 20,
    overflow: "hidden",
  },
  gradientButton: {
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
