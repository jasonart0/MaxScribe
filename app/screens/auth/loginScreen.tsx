import { Ionicons } from "@expo/vector-icons";
import { faildMessage, isNotEmpty, successMessage } from "@lib";
import { loginUser } from "api/auth";
import AppBackground from "components/AppBackground";
import BlueGradient from "components/BlueGradient";
import GradientStatusBar from "components/GradientStatusBar";
import LoadingOverlay from "components/LoadingOverlay";
import { COLORS } from "constants/Colors";
import { getUserData } from "lib/authdata";
import { clearSavedLogin, getSavedLogin, saveLoginCredentials, supportsSavedPassword } from "lib/savedLogin";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#087DDA";
const INK = "#062E71";

export default function LoginScreen({ navigation }: any) {
  const { height } = useWindowDimensions();
  const isCompact = height < 760;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [savePassword, setSavePassword] = useState(false);
  const editedRef = useRef(false);
  const loginRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    void getUserData(); // Remove passwords stored by older versions in normal local storage.
    getSavedLogin().then((saved) => {
      if (!mounted || editedRef.current || !saved) return;
      setEmail(saved.email);
      setPassword(saved.password);
      setSavePassword(supportsSavedPassword);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const toggleSavePassword = async () => {
    editedRef.current = true;
    const next = !savePassword;
    setSavePassword(next);
    if (!next) {
      try { await clearSavedLogin(); }
      catch {
        setSavePassword(true);
        faildMessage("Unable to forget the saved login. Please try again.");
      }
    }
  };

  const handleLogin = async () => {
    if (loginRef.current) return;
    const missingEmail = !isNotEmpty(email);
    const missingPassword = !isNotEmpty(password);
    setEmailError(missingEmail);
    setPasswordError(missingPassword);

    if (missingEmail || missingPassword) {
      faildMessage("Please enter your email address and password");
      return;
    }

    loginRef.current = true;
    setIsLoading(true);
    try {
      const result = await loginUser(email.trim(), password);
      if (!result.success) {
        faildMessage(result.message || "Login failed. Please try again.");
        return;
      }

      let saved = true;
      let browserDeclined = false;
      try {
        if (savePassword) browserDeclined = (await saveLoginCredentials(email.trim(), password)) === false;
        else await clearSavedLogin();
      } catch { saved = false; }
      if (saved) successMessage("Login Successful", browserDeclined ? "Use your browser's password manager to save your password." : "");
      else faildMessage("Signed in, but the saved password setting could not be updated.");
      navigation.replace("Home");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to log in right now.";
      faildMessage(message);
    } finally {
      loginRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <AppBackground>
      <GradientStatusBar />
      <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "height" : undefined}
        style={styles.keyboardView}
      >
          <View style={[styles.page, isCompact && styles.pageCompact]}>
            <View style={[styles.content, isCompact && styles.contentCompact]}>
              <View style={styles.brandRow}>
                <Image
                  source={require("../../../assets/images/brand-icon.png")}
                  resizeMode="contain"
                  style={[styles.logo, isCompact && styles.logoCompact]}
                />
                <Text style={[styles.brandName, isCompact && styles.brandNameCompact]}>MaxScribe</Text>
              </View>

              <Text style={[styles.title, isCompact && styles.titleCompact]}>
                Welcome Back
              </Text>
              <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]}>
                Sign in to continue to your{"\n"}clinical workspace.
              </Text>

              <View style={[styles.form, isCompact && styles.formCompact]}>
                <View
                  style={[
                    styles.inputBox,
                    isCompact && styles.inputBoxCompact,
                    emailError && styles.inputError,
                  ]}
                >
                  <Ionicons name="mail-outline" size={25} color="#104A89" />
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="username"
                    textContentType="username"
                    keyboardType="email-address"
                    onChangeText={(value) => {
                      editedRef.current = true;
                      setEmail(value);
                      if (emailError) setEmailError(!value.trim());
                    }}
                    placeholder="Email Address"
                    placeholderTextColor="#7795C2"
                    returnKeyType="next"
                    style={styles.input}
                    value={email}
                  />
                </View>

                <View
                  style={[
                    styles.inputBox,
                    styles.passwordBox,
                    isCompact && styles.inputBoxCompact,
                    isCompact && styles.passwordBoxCompact,
                    passwordError && styles.inputError,
                  ]}
                >
                  <Ionicons name="lock-closed-outline" size={25} color="#104A89" />
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    textContentType="password"
                    onChangeText={(value) => {
                      editedRef.current = true;
                      setPassword(value);
                      if (passwordError) setPasswordError(!value.trim());
                    }}
                    onSubmitEditing={handleLogin}
                    placeholder="Password"
                    placeholderTextColor="#7795C2"
                    returnKeyType="go"
                    secureTextEntry={!passwordVisible}
                    style={styles.input}
                    value={password}
                  />
                  <Pressable
                    accessibilityLabel={passwordVisible ? "Hide password" : "Show password"}
                    accessibilityRole="button"
                    hitSlop={12}
                    onPress={() => setPasswordVisible((visible) => !visible)}
                    style={({ pressed }) => pressed && styles.pressed}
                  >
                    <Ionicons
                      name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                      size={27}
                      color="#104A89"
                    />
                  </Pressable>
                </View>

                <View style={styles.optionsRow}>
                  {supportsSavedPassword ? (
                    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: savePassword, disabled: isLoading }}
                      disabled={isLoading} onPress={toggleSavePassword} style={styles.savePasswordRow}>
                      <Ionicons name={savePassword ? "checkbox" : "square-outline"} size={22} color={PRIMARY} />
                      <Text style={styles.savePasswordText}>Save password</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.passwordManagerHint}>Save using browser manager</Text>
                  )}

                  <Pressable
                    accessibilityRole="button"
                    hitSlop={10}
                    onPress={() =>
                      Alert.alert(
                        "Forgot Password?",
                        "Please contact your practice administrator to reset your password.",
                      )
                    }
                    style={({ pressed }) => [styles.forgotButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </Pressable>
                </View>

                <Pressable
                  accessibilityRole="button"
                  disabled={isLoading}
                  accessibilityState={{ busy: isLoading, disabled: isLoading }}
                  onPress={handleLogin}
                  style={({ pressed }) => [
                    styles.signInButton,
                    isCompact && styles.signInButtonCompact,
                    pressed && styles.signInPressed,
                  ]}
                >
                  <BlueGradient />
                  <Text style={styles.signInText}>Sign In</Text>
                  {isLoading && <LoadingOverlay backgroundColor="transparent" color="#FFFFFF" />}
                </Pressable>
              </View>
            </View>

            <View
              style={[
                styles.illustrationArea,
                isCompact && styles.illustrationAreaCompact,
              ]}
              pointerEvents="none"
            >
              <View style={[styles.circle, styles.circleBottomLeft]} />
              <View style={[styles.circle, styles.circleDoctor]} />
              <View style={[styles.circle, styles.circleBottomRight]} />
              <Image
                source={require("../../../assets/images/login-doctor-ui.png")}
                resizeMode="contain"
                style={styles.doctorImage}
              />
            </View>
          </View>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "transparent" },
  keyboardView: { flex: 1 },
  page: {
    flex: 1,
    width: "100%",
    maxWidth: 540,
    alignSelf: "center",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  pageCompact: { minHeight: 0 },
  content: { zIndex: 2, paddingHorizontal: 20, paddingTop: 36 },
  contentCompact: { paddingHorizontal: 20, paddingTop: 18 },
  circle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(218, 239, 255, 0.60)",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 43, height: 43, borderRadius: 11, overflow: "hidden" },
  logoCompact: { width: 39, height: 39, borderRadius: 10 },
  brandName: { color: INK, fontSize: 25, lineHeight: 31, fontWeight: "800", letterSpacing: -0.6 },
  brandNameCompact: { fontSize: 23, lineHeight: 29 },
  title: {
    marginTop: 28,
    color: INK,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: -1.1,
  },
  titleCompact: { marginTop: 20, fontSize: 27, lineHeight: 33 },
  subtitle: {
    marginTop: 12,
    color: "#315487",
    fontSize: 16,
    lineHeight: 22,
  },
  subtitleCompact: { marginTop: 7, fontSize: 15, lineHeight: 21 },
  form: { marginTop: 22 },
  formCompact: { marginTop: 16 },
  inputBox: {
    height: 48,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.76)",
  },
  passwordBox: { marginTop: 10 },
  inputBoxCompact: { height: 48 },
  passwordBoxCompact: { marginTop: 10 },
  inputError: { borderColor: "#E65353" },
  input: {
    flex: 1,
    height: "100%",
    marginLeft: 12,
    color: INK,
    fontSize: 15,
    outlineStyle: "none",
  } as any,
  signInButton: {
    overflow: "hidden",
    height: 48,
    marginTop: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2B69C1",
  },
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    minHeight: 44,
    marginTop: 4,
  },
  savePasswordRow: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  savePasswordText: { color: INK, fontSize: 14 },
  passwordManagerHint: { color: COLORS.textLight, fontSize: 12, flexShrink: 1 },
  signInPressed: { opacity: 0.86, transform: [{ scale: 0.995 }] },
  signInButtonCompact: { height: 48, marginTop: 14 },
  signInText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  forgotButton: { minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  forgotText: { color: "#0676D1", fontSize: 14, fontWeight: "700" },
  pressed: { opacity: 0.65 },
  illustrationArea: {
    flex: 1,
    minHeight: 0,
    marginTop: 8,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  illustrationAreaCompact: { marginTop: 0 },
  circleBottomLeft: { width: 106, height: 106, left: -56, top: 20 },
  circleDoctor: { width: 330, height: 330, left: 46, top: 40 },
  circleBottomRight: { width: 184, height: 184, right: -50, bottom: -15 },
  doctorImage: {
    zIndex: 2,
    width: "96%",
    height: "100%",
    maxWidth: 500,
    marginBottom: -5,
  },
});
