import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

export const checkBiometricAvailable = async () => {
  try {
    const { available } = await rnBiometrics.isSensorAvailable();
    return available;
  } catch (e) {
    return false;
  }
};

export const authenticateWithBiometrics = async () => {
  try {
    const { success } = await rnBiometrics.simplePrompt({
      promptMessage: 'Confirm your identity to open Silent Voice',
    });
    return success;
  } catch (e) {
    return false;
  }
};