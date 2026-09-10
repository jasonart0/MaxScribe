import { setHeight, setWidth } from "@lib";
import { COLORS } from "constants/Colors";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
const CustomButton = ({ title, onPress, style, textStyle, isLoading }: any) => {
  return (
    <TouchableOpacity
      disabled={isLoading}
      style={[styles.button, style]}
      onPress={onPress}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: setHeight(4),
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    width: setWidth(90),
    alignSelf: "center",
  },
  text: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 18,
  },
});

export default CustomButton;
