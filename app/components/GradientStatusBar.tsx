import React from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BlueGradient from "./BlueGradient";

/** A transparent system status bar backed by the app's shared gradient. */
export default function GradientStatusBar() {
  const insets = useSafeAreaInsets();
  const height = Math.max(insets.top, StatusBar.currentHeight ?? 0);

  return (
    <>
      <View pointerEvents="none" style={[styles.background, { height }]}>
        <BlueGradient />
      </View>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: "#2B69C1",
  },
});
