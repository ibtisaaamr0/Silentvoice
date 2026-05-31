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
  Image 
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { signupUser } from "../Redux/features/authSlice";
import LinearGradient from "react-native-linear-gradient";
import * as ImagePicker from 'react-native-image-picker'; // ✅ Ensure this is installed
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

export default function Signup({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState(null); // Local state for the image

  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.auth);

  // --- IMAGE PICKER LOGIC ---
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

    // Pass the image URI to the thunk along with other details
    const result = await dispatch(signupUser({ 
      email, 
      password, 
      name, 
      profilePicture: profileImage // Now optional
    }));

    if (signupUser.fulfilled.match(result)) {
      Alert.alert("Success", `Welcome ${name}!`);
      navigation.navigate("Tabs"); 
    } else {
      Alert.alert("Error", result.payload);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      {/* --- PROFILE PICTURE UPLOAD AREA --- */}
      <TouchableOpacity style={styles.imagePickerContainer} onPress={handlePickImage}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.previewImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialIcons name="add-a-photo" size={30} color="#888" />
            <Text style={styles.imagePlaceholderText}>Add Photo (Optional)</Text>
          </View>
        )}
      </TouchableOpacity>
      
      <TextInput placeholder="Full Name" style={styles.input} value={name} onChangeText={setName} />
      <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
      <TextInput placeholder="Password" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

      <Pressable onPress={handleSignup} disabled={isLoading} style={styles.btnContainer}>
        <LinearGradient colors={["#FF6A3D", "#b42f2f"]} style={styles.button}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign Up</Text>}
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#b42f2f', marginBottom: 20, textAlign: 'center' },
  
  // --- NEW IMAGE PICKER STYLES ---
  imagePickerContainer: {
    alignSelf: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    marginBottom: 25,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  previewImage: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center' },
  imagePlaceholderText: { fontSize: 10, color: '#888', marginTop: 5 },

  input: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 15, marginBottom: 15 },
  btnContainer: { marginTop: 10, borderRadius: 10, overflow: 'hidden' },
  button: { padding: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});