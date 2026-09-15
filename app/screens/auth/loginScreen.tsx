import { localImages } from "@assets";
import { CustomButton, CustomInput, ScreenWrapper } from "@components";
import { Ionicons } from "@expo/vector-icons";
import { faildMessage, isNotEmpty, successMessage } from "@lib";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginUser } from "api/auth";
import { useLocalAuth } from "hooks/useLocalAuth";
import { getUserData } from "lib/authdata";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const TEAL = "#12BDB5";
const INK = "#17213D";

export default function LoginScreen({ navigation }: any) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isBioLoading, setIsBioLoading] = useState(false);
  const [supportsBiometric, setSupportsBiometric] = useState(false);
  const [idError, setIdError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [biometricType, setBiometricType] = useState("face");
  const { checkHardware, checkEnrolled, authenticate, getType } =
    useLocalAuth();

  useEffect(() => {
    (async () => {
      const compatible = await checkHardware();
      const enrolled = await checkEnrolled();
      const user = await getUserData();
      setBiometricType(await getType());
      setSupportsBiometric(
        compatible &&
          enrolled &&
          isNotEmpty(user?.id) &&
          isNotEmpty(user?.username)
      );
    })();
    // These helpers are intentionally checked once when the login screen mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async () => {
    const missingId = !isNotEmpty(id);
    const missingPassword = !isNotEmpty(password);
    setIdError(missingId);
    setPasswordError(missingPassword);

    if (missingId || missingPassword) {
      faildMessage("Please enter your user ID and password");
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginUser(id.trim(), password);
      if (!result.success) {
        faildMessage(result.message || "Login failed. Please try again.");
        return;
      }

      if (!rememberMe) {
        await AsyncStorage.removeItem("userdata");
      }
      successMessage("Login Successful");
      navigation.replace("Home");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to log in right now.";
      faildMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    const authenticated = await authenticate();
    const user = await getUserData();
    if (!authenticated || !isNotEmpty(user)) return;

    setIsBioLoading(true);
    try {
      const result = await loginUser(
        user?.username?.trim(),
        user?.password || ""
      );
      if (result.success) {
        successMessage("Login Successful");
        navigation.replace("Home");
      } else {
        faildMessage(result.message || "Biometric login failed.");
      }
    } catch {
      faildMessage("Biometric login is unavailable. Please log in manually.");
    } finally {
      setIsBioLoading(false);
    }
  };

  return (
    <ScreenWrapper
      scrollEnabled
      showback={false}
      headerUnScrollable={() => null}
      backgroundColor="#F5F7FC"
      statusBarColor="#F5F7FC"
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.container}>
        <View style={styles.decorativeCircle} />

        <View style={styles.brandBlock}>
          <View style={styles.logoBox}>
            <Image source={localImages.logo} style={styles.logo} />
          </View>
          <Text style={styles.title}>Log in</Text>
          <Text style={styles.subtitle}>
            Welcome back! Please log in{"\n"}to continue.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>User ID</Text>
          <CustomInput
            placeholder="Enter your user ID"
            value={id}
            style={styles.input}
            onChangeText={setId}
            required={idError}
            leftIcon={<Ionicons name="person-outline" size={20} color="#8992A7" />}
            returnKeyType="next"
          />

          <Text style={[styles.label, styles.passwordLabel]}>Password</Text>
          <CustomInput
            placeholder="Enter your password"
            value={password}
            style={styles.input}
            onChangeText={setPassword}
            secureTextEntry
            required={passwordError}
            showPasswordToggle
            iconColor="#8992A7"
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#8992A7" />}
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />

          <View style={styles.optionsRow}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: rememberMe }}
              onPress={() => setRememberMe((value) => !value)}
              style={styles.rememberButton}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxOn]}>
                {rememberMe ? (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                ) : null}
              </View>
              <Text style={styles.optionText}>Remember me</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                Alert.alert(
                  "Forgot password?",
                  "Please contact your practice administrator to reset your password."
                )
              }
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
          </View>

          <CustomButton
            isLoading={isLoading}
            title="Sign in"
            onPress={handleLogin}
            style={styles.signInButton}
            textStyle={styles.signInText}
          />

          {supportsBiometric ? (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>Or continue with</Text>
                <View style={styles.divider} />
              </View>
              <Pressable
                disabled={isBioLoading || isLoading}
                onPress={handleBiometricLogin}
                style={({ pressed }) => [
                  styles.biometricButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name={
                    biometricType === "face"
                      ? "scan-outline"
                      : "finger-print-outline"
                  }
                  size={22}
                  color={TEAL}
                />
                <Text style={styles.biometricText}>
                  Continue with {biometricType === "face" ? "Face ID" : "Fingerprint"}
                </Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </View>

      <Modal animationType="fade" transparent visible={isBioLoading}>
        <View style={styles.backdrop}>
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={TEAL} />
            <Text style={styles.loaderText}>Signing in...</Text>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    minHeight: 700,
    paddingHorizontal: 18,
    paddingTop: 30,
    backgroundColor: "#F5F7FC",
    overflow: "hidden",
  },
  decorativeCircle: {
    position: "absolute",
    width: 215,
    height: 215,
    borderRadius: 108,
    right: -92,
    top: -112,
    backgroundColor: "#E8FAFA",
  },
  brandBlock: {
    alignItems: "center",
    marginTop: 22,
  },
  logoBox: {
    width: 82,
    height: 82,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#DDF8F1",
  },
  logo: {
    width: 82,
    height: 82,
    resizeMode: "cover",
  },
  title: {
    color: INK,
    fontSize: 28,
    fontWeight: "700",
    marginTop: 15,
  },
  subtitle: {
    color: "#7B849D",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 4,
  },
  form: {
    marginTop: 26,
  },
  label: {
    color: INK,
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 1,
  },
  passwordLabel: {
    marginTop: 12,
  },
  input: {
    width: "100%",
    height: 52,
    marginVertical: 7,
    borderRadius: 12,
    borderColor: "#DCE9EC",
    backgroundColor: "#FFFFFF",
  },
  optionsRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rememberButton: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#B8C4CE",
  },
  checkboxOn: {
    borderColor: TEAL,
    backgroundColor: TEAL,
  },
  optionText: {
    color: "#657087",
    fontSize: 13,
    marginLeft: 8,
  },
  forgotText: {
    color: "#12AEB1",
    fontSize: 13,
    fontWeight: "600",
  },
  signInButton: {
    width: "100%",
    height: 52,
    marginTop: 18,
    marginBottom: 0,
    borderRadius: 12,
    paddingVertical: 0,
    backgroundColor: TEAL,
  },
  signInText: {
    fontSize: 16,
    fontWeight: "600",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 25,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#DDE3E8",
  },
  dividerText: {
    color: "#7C8597",
    fontSize: 12,
    marginHorizontal: 12,
  },
  biometricButton: {
    height: 48,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CFE7E8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  biometricText: {
    color: "#34777B",
    fontSize: 13,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.72,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(23, 33, 61, 0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  loaderBox: {
    minWidth: 140,
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loaderText: {
    color: INK,
    fontSize: 13,
    marginTop: 10,
  },
});
