import React, { useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

/** Native renderer for the shared left-to-right blue-to-teal gradient. */
export default function BlueGradient() {
  const gradientId = `buttonBlue-${useId().replace(/:/g, "")}`;

  return (
    <View pointerEvents="none" style={styles.fill}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#2B69C1" />
            <Stop offset="1" stopColor="#20D1C3" />
          </LinearGradient>
        </Defs>
        <Rect width="100" height="100" fill={`url(#${gradientId})`} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
});
