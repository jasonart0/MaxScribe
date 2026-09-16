import { Ionicons } from "@expo/vector-icons"; // Expo users
import React, { ReactNode, useState } from "react";
import {
    StyleProp,
    StyleSheet,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
// For CLI without Expo: use `react-native-vector-icons/Ionicons`
import { COLORS } from "constants/Colors";

type CustomInputProps = Pick<
  TextInputProps,
  | "placeholder"
  | "value"
  | "onChangeText"
  | "secureTextEntry"
  | "returnKeyType"
  | "onSubmitEditing"
> & {
  showPasswordToggle?: boolean;
  style?: StyleProp<ViewStyle>;
  required?: boolean;
  leftIcon?: ReactNode;
  iconColor?: string;
};

const CustomInput = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  showPasswordToggle,
  style,
  required = false,
  returnKeyType,
  onSubmitEditing,
  leftIcon,
  iconColor = COLORS.primary,
}: CustomInputProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(
    secureTextEntry || false
  );
  const isError = required && value?.trim() === "";

  return (
    <View
      style={[
        styles.container,
        style,
        isError && { borderColor: "red" }, // ✅ red border if required & empty
      ]}
    >
      {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={(text) => {
          onChangeText?.(text);
        }}
        secureTextEntry={isPasswordVisible}
        style={styles.input}
        placeholderTextColor="#999"
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
      />

      {showPasswordToggle && (
        <TouchableOpacity
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
        >
          <Ionicons
            name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={iconColor}
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
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 48,
    marginVertical: 6,
    backgroundColor: COLORS.card,
  },
  input: {
    flex: 1,
    height: 46,
    fontSize: 15,
    color: "#333",
  },
  leftIcon: {
    marginRight: 10,
  },
});

export default CustomInput;
