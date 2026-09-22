import React from "react";
import { StyleSheet, View } from "react-native";

/** Shared left-to-right blue-to-teal gradient. */
export default function BlueGradient() {
  return <View pointerEvents="none" style={styles.gradient} />;
}

const styles = StyleSheet.create({
  gradient: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    experimental_backgroundImage: "linear-gradient(90deg, #2B69C1 0%, #20D1C3 100%)",
  },
});
