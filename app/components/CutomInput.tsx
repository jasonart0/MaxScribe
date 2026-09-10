import { Ionicons } from "@expo/vector-icons"; // Expo users
import React, { useEffect, useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
// For CLI without Expo: use `react-native-vector-icons/Ionicons`
import { COLORS } from "constants/Colors";

const CustomInput = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  showPasswordToggle,
  style,
  required = false, // ✅ new prop
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(
    secureTextEntry || false
  );
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (required) {
      setIsError(value?.trim() === "");
    }
  }, [value, required]);

  return (
    <View
      style={[
        styles.container,
        style,
        isError && { borderColor: "red" }, // ✅ red border if required & empty
      ]}
    >
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
          if (required) {
            setIsError(text.trim() === "");
          }
        }}
        secureTextEntry={isPasswordVisible}
        style={styles.input}
        placeholderTextColor="#999"
      />

      {showPasswordToggle && (
        <TouchableOpacity
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
        >
          <Ionicons
            name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "lightgrey",
    borderRadius: 25,
    paddingHorizontal: 15,
    marginVertical: 8,
  },
  input: {
    flex: 1,
    height: 45,
    color: "#333",
  },
});

export default CustomInput;
