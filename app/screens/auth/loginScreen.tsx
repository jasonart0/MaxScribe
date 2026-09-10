import { localImages } from "@assets";
import { CustomButton, CustomInput, ScreenWrapper } from "@components";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  faildMessage,
  getMD5Hash,
  isNotEmpty,
  setHeight,
  setWidth,
  successMessage,
} from "@lib";
import { loginUser } from "api/auth";
import { COLORS } from "constants/Colors";
import { useLocalAuth } from "hooks/useLocalAuth";
import { getUserData } from "lib/authdata";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
export default function LoginScreen({ navigation }: any) {
  const [id, setId] = useState("Admin@maximus");
  const [password, setPassword] = useState("Maxi@321");
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
  }, []);
  // const handleLogin = async () => {
  //   setIsLoading(true);
  //   try {
  //     const result = await loginUser(id.toLowerCase(), password);
  //     if (result.success) {
  //       successMessage("Login Successful", "Welcome back!");
  //       navigation.replace("Home");
  //     } else {
  //       Alert.alert("Login Failed", result.message);
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  const handleLogin = async () => {
    let hasError = false;

    if (!isNotEmpty(id)) {
      setIdError(true);
      hasError = true;
    } else {
      setIdError(false);
    }

    if (!isNotEmpty(password)) {
      setPasswordError(true);
      hasError = true;
    } else {
      setPasswordError(false);
    }

    if (hasError) {
      return; // ✅ Stop if validation failed
    }

    setIsLoading(true);
    try {
      const pas = await getMD5Hash(password.trim());

      const result = await loginUser(id.toLowerCase().trim(), pas);

      if (result.success) {
        successMessage("Login Successful");
        navigation.replace("Home");
      } else if (!result.success && result.message === "Unauthorized") {
        faildMessage("User ID or password may incorect");
      } else {
        // alert("Login Failed", result.message);
        faildMessage("Somthing went wrong. Try agin later");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBA = async () => {
    const a = await authenticate();
    const user = await getUserData();
    if (!isNotEmpty(user)) {
      return;
    }
    if (a && isNotEmpty(user)) {
      setIsBioLoading(true);
      try {
        const result = await loginUser(
          user?.username?.toLowerCase().trim(),
          user?.password.trim()
        );
        if (result.success) {
          setIsBioLoading(false);
          successMessage("Login Successful");
          navigation.replace("Home");
        } else {
          // alert("Login Failed", result?.message);
          faildMessage("Somthing went wrong try again");
          setIsBioLoading(false);
          faildMessage("Somthing went wrong. Try agin later");
        }
      } catch (error) {
        setIsBioLoading(false);
        faildMessage("Somthing went wrong. Try agin later");
      }
    }
  };
  return (
    <ScreenWrapper scrollEnabled headerUnScrollable={() => <></>}>
      <View style={styles.container}>
        {/* Logo */}
        <Image
          source={localImages.logo} // Replace with your logo
          style={styles.logo}
        />
        <Text
          style={{
            alignSelf: "center",
            fontSize: setHeight(4),
            fontWeight: "bold",
            color: COLORS.primary,
            marginBottom: setHeight(5),
            marginTop: setHeight(2),
          }}
        >
          MaxScribe
        </Text>
        <View
          style={{
            backgroundColor: "white",
            width: setWidth(90),
            alignContent: "center",
            justifyContent: "center",
            alignItems: "center",
            padding: setHeight(2),
            borderRadius: setHeight(3),
            shadowColor: "#4a4a4aff",
            shadowOpacity: 0.1,
            shadowOffset: { width: 1, height: 2 },
            shadowRadius: 5,
            elevation: 2,
          }}
        >
          <Text
            style={{
              alignSelf: "center",
              fontSize: setHeight(3),
              fontWeight: "700",
              color: COLORS.primary,
              marginBottom: setHeight(2),
              marginTop: setHeight(5),
            }}
          >
            Welcome!
          </Text>
          {/* Inputs */}
          <CustomInput
            placeholder="Type your Id here"
            value={id}
            style={styles.input}
            onChangeText={setId}
            required={idError}
          />

          <CustomInput
            placeholder="Password"
            value={password}
            style={styles.input}
            onChangeText={setPassword}
            secureTextEntry
            required={passwordError}
            showPasswordToggle
          />

          {/* Button */}
          <CustomButton
            isLoading={isLoading}
            title="Login"
            onPress={handleLogin}
            style={styles.button}
            textStyle={undefined}
          />
          {supportsBiometric && (
            <>
              <Text style={styles.orText}>OR</Text>
              {biometricType && (
                <TouchableOpacity
                  disabled={isBioLoading || isLoading}
                  style={styles.biometricBtn}
                  onPress={handleBA}
                >
                  {biometricType === "face" ? (
                    <MaterialCommunityIcons
                      name="face-recognition"
                      size={setHeight(2)}
                      color="#fff"
                    />
                  ) : (
                    <Ionicons
                      name="finger-print"
                      size={setHeight(2)}
                      color="#fff"
                    />
                  )}
                  <Text style={styles.biometricText}>
                    {biometricType === "face"
                      ? "Login with Face ID"
                      : "Login with Fingerprint"}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
          <Text style={styles.forgot}>Forget Password?</Text>
        </View>
      </View>
      <Modal animationType="fade" transparent={true} visible={isBioLoading}>
        <View style={styles.backdrop}>
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.text}>Loading</Text>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: setHeight(17),
    height: setHeight(17),
    marginBottom: 15,
    resizeMode: "contain",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  welcome: {
    fontSize: 18,
    marginVertical: 10,
    color: COLORS.primary,
  },
  forgot: {
    marginTop: 10,
    color: "#999",
  },
  button: {
    width: setWidth(80),
  },
  orText: {
    marginVertical: 12,
    color: "#cbd5e1",
  },
  biometricBtn: {
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    width: setWidth(80),
    backgroundColor: COLORS.primary,
  },
  biometricText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    minWidth: 120,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
  input: { width: setWidth(80) },
});
