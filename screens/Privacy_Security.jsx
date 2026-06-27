import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator, // Added for the loading state
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';
import {useSelector} from 'react-redux';
import ReactNativeBiometrics from 'react-native-biometrics'; // 1. Import library

const rnBiometrics = new ReactNativeBiometrics();

export default function PrivacySecurity({navigation}) {
  const isDarkMode = useSelector(state => state.theme?.isDarkMode);
  const user = useSelector(state => state.auth.user);

  // 2. State to manage access
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const colors = {
    bg: isDarkMode ? '#0F172A' : '#F8FAFC',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    text: isDarkMode ? '#F1F5F9' : '#1E293B',
    subtext: isDarkMode ? '#94A3B8' : '#64748B',
    primary: '#6366F1',
    border: isDarkMode ? '#334155' : '#F1F5F9',
    danger: '#EF4444',
  };

  // 3. Biometric Check on Mount
  useEffect(() => {
    handleBiometricAuth();
  }, []);

  const handleBiometricAuth = async () => {
    try {
      const {available} = await rnBiometrics.isSensorAvailable();

      if (available) {
        const result = await rnBiometrics.simplePrompt({
          promptMessage: 'Confirm identity to access Security',
        });

        if (result.success) {
          setIsAuthenticated(true);
        } else {
          // If they cancel, send them back
          navigation.goBack();
        }
      } else {
        // If device has no biometrics, just let them in
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log('Biometric Error:', error);
      setIsAuthenticated(true); // Fallback so they aren't locked out
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Show a loader while waiting for fingerprint
  if (isLoading) {
    return (
      <View style={[styles.center, {backgroundColor: colors.bg}]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{color: colors.subtext, marginTop: 10}}>
          Authenticating...
        </Text>
      </View>
    );
  }

  // 5. If auth fails/cancels, return null (handled by navigation.goBack)
  if (!isAuthenticated) return null;

  // --- REST OF YOUR UI CODE BELOW ---
  const securityItems = [
    {
      icon: 'lock-outline',
      label: 'Change Password',
      desc: 'Receive a reset link via email',
      action: async () => {
        Alert.alert('Reset Password', `Send link to ${user.email}?`, [
          {text: 'Cancel'},
          {
            text: 'Send',
            onPress: () => auth().sendPasswordResetEmail(user.email),
          },
        ]);
      },
    },
    // ... other items
  ];

  return (
    <View style={{flex: 1, backgroundColor: colors.bg}}>
      {/* Render your TopBar and ScrollView here as before */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}>
          <MaterialIcons name="arrow-back-ios" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, {color: colors.text}]}>
          Privacy & Security
        </Text>
        <View style={{width: 40}} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animatable.View animation="fadeIn" style={styles.headerIconContainer}>
          <View
            style={[
              styles.shieldCircle,
              {backgroundColor: colors.primary + '15'},
            ]}>
            <MaterialIcons name="security" size={45} color={colors.primary} />
          </View>
          <Text style={[styles.headerSubtitle, {color: colors.subtext}]}>
            Your identity is verified. You can now manage sensitive settings.
          </Text>
        </Animatable.View>
        {/* Map through securityItems... */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  // ... copy the rest of your styles from previous response

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {fontSize: 18, fontWeight: '800'},

  scrollContent: {paddingHorizontal: 20, paddingBottom: 40},

  headerIconContainer: {alignItems: 'center', marginVertical: 30},
  shieldCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerSubtitle: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 30,
  },

  groupContainer: {
    borderRadius: 32,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  optionRow: {flexDirection: 'row', alignItems: 'center', padding: 20},
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {flex: 1},
  label: {fontSize: 16, fontWeight: '700'},
  description: {fontSize: 12, marginTop: 2, fontWeight: '500'},

  footerText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
