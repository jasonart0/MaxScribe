// hooks/useLocalAuth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";

export function useLocalAuth() {
  const checkHardware = async () => {
    return await LocalAuthentication.hasHardwareAsync();
  };

  const checkEnrolled = async () => {
    return await LocalAuthentication.isEnrolledAsync();
  };

  const authenticate = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Login with Face ID / Fingerprint",
      fallbackLabel: "Enter Passcode",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });
    return result.success;
  };

  const getAuthEnabled = async () => {
    const val = await AsyncStorage.getItem("biometric_enabled");
    return val === "true";
  };

  const setAuthEnabled = async (value: boolean) => {
    const hasHardware = await checkHardware();
    const enrolled = await checkEnrolled();

    if (value && (!hasHardware || !enrolled)) {
      alert("Biometrics not available or not enrolled.");
      return;
    }
    await AsyncStorage.setItem("biometric_enabled", value ? "true" : "false");
  };
  const getType = async () => {
    let deviceType = "face";
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      deviceType = "fingerprint";
    } else if (
      types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
    ) {
      deviceType = "face";
    }
    return deviceType;
  };
  return {
    checkHardware,
    checkEnrolled,
    authenticate,
    getAuthEnabled,
    setAuthEnabled,
    getType
  };
}
