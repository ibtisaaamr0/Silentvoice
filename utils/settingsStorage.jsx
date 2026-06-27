import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'app_settings';

export const DEFAULT_SETTINGS = {
  practiceReminders: true,
  quizResults: true,
  appUpdates: false,
  newSignsAdded: true,
  biometricLock: false,
  saveHistory: true,
};

export const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.log('Error saving settings:', e);
  }
};

export const loadSettings = async () => {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch (e) {
    console.log('Error loading settings:', e);
    return DEFAULT_SETTINGS;
  }
};