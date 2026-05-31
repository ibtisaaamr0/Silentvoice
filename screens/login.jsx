import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  Pressable,
  Alert,
  ActivityIndicator, // Added for loading feedback
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import * as Animatable from "react-native-animatable";
import Logo from "../logo.png";

// REDUX IMPORTS
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../Redux/features/authSlice";

export default function Login({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Redux Hooks
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.auth);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // Dispatch the loginUser thunk
    const resultAction = await dispatch(loginUser({ email, password }));

    if (loginUser.fulfilled.match(resultAction)) {
      // Success: Navigate to Tabs
      navigation.navigate("Tabs");
    } else {
      // Error: Show the error message from Redux
      Alert.alert("Login Error", resultAction.payload || "Something went wrong");
    }
  };

  const isFilled = email.trim() !== "" && password.trim() !== "" && !isLoading;

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#b42f2f", "#FF6A3D"]} style={styles.header}>
        <Animatable.Image
          animation="zoomIn"
          duration={800}
          delay={200}
          source={Logo}
          style={styles.logo}
        />
        <Animatable.Text animation="fadeInDown" delay={400} style={styles.title}>
          Silent Voice
        </Animatable.Text>
      </LinearGradient>

      <Animatable.View animation="fadeInUp" delay={500} style={styles.bottomCard}>
        <Text style={styles.heading}>Welcome Back 👋</Text>
        <Text style={styles.subtext}>Log in to continue your journey</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          placeholder="Enter your email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading} // Disable input while loading
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          placeholder="Enter your password"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          editable={!isLoading} // Disable input while loading
        />

        <Pressable
          style={[styles.button, { opacity: isFilled ? 1 : 0.6 }]}
          onPress={handleLogin}
          disabled={!isFilled}
        >
          <LinearGradient
            colors={isFilled ? ["#FF6A3D", "#b42f2f"] : ["#ffb5a0", "#d28c8c"]}
            style={styles.gradientButton}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("ForgotPass")}
          style={styles.forgotPassContainer}
        >
          <Text style={styles.forgotPassText}>Forgot Password?</Text>
        </Pressable>

        <Text style={styles.signupText}>Don't have an account?</Text>

        <Pressable
          style={styles.signupButton}
          onPress={() => navigation.navigate("Signup")}
          disabled={isLoading}
        >
          <Text style={styles.signupButtonText}>Sign Up</Text>
        </Pressable>
      </Animatable.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffececff" },
  header: {
    height: "40%",
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  logo: { width: 100, height: 100, borderRadius: 25, marginBottom: 10 },
  title: { fontSize: 24, color: "#fff", fontWeight: "700" },
  bottomCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -40,
    padding: 25,
    elevation: 8,
  },
  heading: { fontSize: 22, fontWeight: "700", color: "#b42f2f", textAlign: "center" },
  subtext: { fontSize: 13, color: "#777", textAlign: "center", marginBottom: 25 },
  label: { fontWeight: "600", color: "#333", marginTop: 10 },
  input: { backgroundColor: "#f5f5f5", borderRadius: 15, padding: 12, marginTop: 8 },
  button: { marginTop: 25, borderRadius: 20, overflow: "hidden" },
  gradientButton: { paddingVertical: 14, alignItems: "center", borderRadius: 20 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  forgotPassContainer: { marginTop: 15, alignItems: "center" },
  forgotPassText: { color: "#b42f2f", fontWeight: "600" },
  signupText: { textAlign: "center", marginTop: 20, color: "#444" },
  signupButton: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#b42f2f",
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: "center",
  },
  signupButtonText: { color: "#b42f2f", fontWeight: "700" },
});