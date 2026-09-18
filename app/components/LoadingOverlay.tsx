import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function LoadingOverlay({ backgroundColor, color }: { backgroundColor: string; color: string }) {
  return <View pointerEvents="none" style={styles.overlay}>
    <View style={[styles.overlay, { backgroundColor, opacity: 0.88 }]} />
    <ActivityIndicator color={color} />
  </View>;
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center", justifyContent: "center", borderRadius: 12 },
});
