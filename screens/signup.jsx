import React, { useState } from "react";
import { 
  View, 
  StyleSheet, 
  Text, 
  TextInput, 
  Pressable, 
  Alert, 
  ActivityIndicator, 
  TouchableOpacity, 
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { signupUser } from "../Redux/features/authSlice";
import LinearGradient from "react-native-linear-gradient";
import * as ImagePicker from 'react-native-image-picker'; 
import * as Animatable from "react-native-animatable";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

const { width } = Dimensions.get("window");

export default function Signup({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState(null); 

  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.auth);
  const isDarkMode = useSelector((state) => state.theme?.isDarkMode);

  // --- Professional Color Palette (Synced with Dashboard) ---
  const colors = {
    bg: isDarkMode ? "#0F172A" : "#F8FAFC", 
    card: isDarkMode ? "#1E293B" : "#FFFFFF",
    text: isDarkMode ? "#F1F5F9" : "#0F172A",
    subtext: isDarkMode ? "#94A3B8" : "#64748B",
    primary: "#6366F1", // Modern Indigo
    accent: "#F43F5E",  // Soft Rose
    border: isDarkMode ? "#334155" : "#E2E8F0"
  };

  const handlePickImage = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 300,
      maxWidth: 300,
    };

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.assets && response.assets.length > 0) {
        setProfileImage(response.assets[0].uri);
      }
    });
  };

  const handleSignup = async () => {
    if (!email || !password || !name) {
      Alert.alert("Error", "All fields are required!");
      return;
    }

    const result = await dispatch(signupUser({ 
      email, 
      password, 
      name, 
      profilePicture: profileImage 
    }));

    if (signupUser.fulfilled.match(result)) {
      Alert.alert("Success", `Welcome ${name}!`);
      navigation.navigate("Tabs"); 
    } else {
      Alert.alert("Error", result.payload);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Header Section --- */}
        <Animatable.View animation="fadeInDown" duration={800} style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            Join your communication bridge today.
          </Text>
        </Animatable.View>

        {/* --- Form Container --- */}
        <Animatable.View animation="fadeInUp" duration={800} delay={200} style={styles.formContainer}>
          
          {/* --- Profile Picture Upload --- */}
          <TouchableOpacity 
            style={[styles.imagePickerContainer, { backgroundColor: colors.card, borderColor: colors.primary + "50" }]} 
            onPress={handlePickImage}
            activeOpacity={0.8}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialIcons name="add-a-photo" size={26} color={colors.primary} />
                <Text style={[styles.imagePlaceholderText, { color: colors.subtext }]}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
          
          {/* --- Inputs --- */}
          <TextInput 
            placeholder="Full Name" 
            placeholderTextColor={colors.subtext}
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} 
            value={name} 
            onChangeText={setName} 
          />
          <TextInput 
            placeholder="Email Address" 
            placeholderTextColor={colors.subtext}
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} 
            value={email} 
            onChangeText={setEmail} 
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput 
            placeholder="Password" 
            placeholderTextColor={colors.subtext}
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
            autoCapitalize="none"
          />

          {/* --- Signup Button --- */}
          <Pressable 
            onPress={handleSignup} 
            disabled={isLoading} 
            style={({ pressed }) => [
              styles.btnContainer, 
              { transform: [{ scale: pressed ? 0.97 : 1 }] }
            ]}
          >
            <LinearGradient colors={["#6366F1", "#8B5CF6"]} style={styles.button}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Sign Up</Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* --- Footer Link --- */}
          <TouchableOpacity 
            onPress={() => navigation.navigate("Login")} 
            style={styles.footerLink}
          >
            <Text style={[styles.footerText, { color: colors.subtext }]}>
              Already have an account? <Text style={{ color: colors.primary, fontWeight: "700" }}>Log In</Text>
            </Text>
          </TouchableOpacity>

        </Animatable.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { 
    flexGrow: 1, 
    paddingHorizontal: 24, 
    justifyContent: 'center',
    paddingBottom: 40 
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 35,
    marginTop: 40
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    letterSpacing: -0.5, 
    textAlign: 'center' 
  },
  subtitle: { 
    fontSize: 14, 
    marginTop: 6, 
    fontWeight: '500',
    textAlign: 'center' 
  },
  formContainer: {
    width: '100%'
  },
  imagePickerContainer: {
    alignSelf: 'center',
    width: 105,
    height: 105,
    borderRadius: 35, // Premium squircle look matching UI cards
    marginBottom: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderStyle: 'dashed',
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  previewImage: { 
    width: '100%', 
    height: '100%' 
  },
  imagePlaceholder: { 
    alignItems: 'center' 
  },
  imagePlaceholderText: { 
    fontSize: 11, 
    fontWeight: '600', 
    marginTop: 6 
  },
  input: { 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16,
    fontSize: 15,
    fontWeight: '500',
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  btnContainer: { 
    marginTop: 10, 
    borderRadius: 20, 
    overflow: 'hidden',
    elevation: 6,
    shadowColor: "#6366F1",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  button: { 
    paddingVertical: 16, 
    alignItems: 'center' 
  },
  btnText: { 
    color: '#fff', 
    fontWeight: '800', 
    fontSize: 16,
    letterSpacing: 0.3
  },
  footerLink: { 
    marginTop: 25, 
    alignItems: 'center' 
  },
  footerText: { 
    fontSize: 14, 
    fontWeight: '500' 
  }
});