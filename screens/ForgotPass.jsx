import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import auth from '@react-native-firebase/auth';
import {useSelector} from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Logo from '../logo.png';

export default function ForgotPassword({navigation}) {
  const [email, setEmail] = useState('');
  const isDarkMode = useSelector(state => state.theme?.isDarkMode);

  // --- Theme Synced Palette ---
  const colors = {
    bg: isDarkMode ? '#0F172A' : '#F8FAFC',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    text: isDarkMode ? '#F1F5F9' : '#0F172A',
    subtext: isDarkMode ? '#94A3B8' : '#64748B',
    primary: '#6366F1',
    border: isDarkMode ? '#334155' : '#E2E8F0',
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    try {
      await auth().sendPasswordResetEmail(email);
      Alert.alert(
        'Email Sent',
        'Check your inbox for password reset instructions.',
      );
      navigation.goBack();
    } catch (error) {
      if (error.code === 'auth/invalid-email') {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
      } else if (error.code === 'auth/user-not-found') {
        Alert.alert('User Not Found', 'No user exists with this email.');
      } else {
        Alert.alert('Error', 'Something went wrong. Try again later.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{flex: 1, backgroundColor: colors.bg}}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
        {/* --- Back Button --- */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back-ios" size={20} color={colors.text} />
        </TouchableOpacity>

        {/* --- Header Section --- */}
        <View style={styles.headerSection}>
          <Animatable.Image
            animation="zoomIn"
            duration={800}
            source={Logo}
            style={styles.logo}
          />
          <Animatable.Text
            animation="fadeInDown"
            style={[styles.brandName, {color: colors.text}]}>
            Reset Password
          </Animatable.Text>
          <Text style={[styles.tagline, {color: colors.subtext}]}>
            We'll help you get back into your account.
          </Text>
        </View>

        {/* --- Form Section --- */}
        <Animatable.View
          animation="fadeInUp"
          duration={800}
          delay={200}
          style={styles.formCard}>
          <Text style={[styles.instructionText, {color: colors.subtext}]}>
            Enter your registered email address to receive reset instructions.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, {color: colors.text}]}>
              Email Address
            </Text>
            <TextInput
              placeholder="name@example.com"
              placeholderTextColor={colors.subtext}
              value={email}
              onChangeText={setEmail}
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* --- Reset Button --- */}
          <Pressable
            style={({pressed}) => [
              styles.button,
              {transform: [{scale: pressed ? 0.98 : 1}]},
            ]}
            onPress={handleResetPassword}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              style={styles.gradientButton}>
              <Text style={styles.buttonText}>Send Reset Link</Text>
            </LinearGradient>
          </Pressable>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.footerLink}>
            <Text style={[styles.footerText, {color: colors.subtext}]}>
              Remembered it?{' '}
              <Text style={{color: colors.primary, fontWeight: '700'}}>
                Back to Login
              </Text>
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
    paddingHorizontal: 25,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 25,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 60,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 15,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  formCard: {
    width: '100%',
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    fontWeight: '500',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 5,
  },
  button: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#6366F1',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  footerLink: {
    marginTop: 25,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
