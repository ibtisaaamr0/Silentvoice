import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import {useDispatch, useSelector} from 'react-redux';
import {loginUser} from '../Redux/features/authSlice';
import Logo from '../logo.png';

const {width} = Dimensions.get('window');

export default function Login({navigation}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useDispatch();
  const {isLoading} = useSelector(state => state.auth);
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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    const resultAction = await dispatch(loginUser({email, password}));
    if (loginUser.fulfilled.match(resultAction)) {
      navigation.navigate('Tabs');
    } else {
      Alert.alert(
        'Login Error',
        resultAction.payload || 'Something went wrong',
      );
    }
  };

  const isFilled = email.trim() !== '' && password.trim() !== '' && !isLoading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{flex: 1, backgroundColor: colors.bg}}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
        {/* --- Logo & Header --- */}
        <View style={styles.headerSection}>
          <Animatable.Image
            animation="bounceIn"
            duration={1500}
            source={Logo}
            style={styles.logo}
          />
          <Animatable.Text
            animation="fadeIn"
            delay={300}
            style={[styles.brandName, {color: colors.text}]}>
            Silent Voice
          </Animatable.Text>
          <Text style={[styles.tagline, {color: colors.subtext}]}>
            Your communication bridge awaits.
          </Text>
        </View>

        {/* --- Login Form --- */}
        <Animatable.View
          animation="fadeInUp"
          duration={800}
          style={styles.formCard}>
          

          <View style={styles.inputGroup}>
            <Text style={[styles.label, {color: colors.text}]}>Email</Text>
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
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, {color: colors.text}]}>Password</Text>
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor={colors.subtext}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              editable={!isLoading}
            />
          </View>

          <Pressable
            onPress={() => navigation.navigate('ForgotPass')}
            style={styles.forgotBtn}>
            <Text style={[styles.forgotText, {color: colors.primary}]}>
              Forgot Password?
            </Text>
          </Pressable>

          {/* --- Login Button --- */}
          <Pressable
            style={({pressed}) => [
              styles.button,
              {
                opacity: isFilled ? (pressed ? 0.9 : 1) : 0.6,
                transform: [{scale: pressed ? 0.98 : 1}],
              },
            ]}
            onPress={handleLogin}
            disabled={!isFilled}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              style={styles.gradientButton}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* --- Footer --- */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, {color: colors.subtext}]}>
              Don't have an account?{' '}
            </Text>
            <Pressable onPress={() => navigation.navigate('Signup')}>
              <Text style={[styles.signupLink, {color: colors.primary}]}>
                Sign Up
              </Text>
            </Pressable>
          </View>
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
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 50,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 22,
    marginBottom: 15,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  formCard: {
    width: '100%',
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 5,
  },
  inputGroup: {
    marginBottom: 18,
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  forgotText: {
    fontWeight: '700',
    fontSize: 14,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '800',
  },
});
