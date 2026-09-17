import React, { useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { COLORS } from "constants/Colors";

interface Props {
  active: boolean;
  metering?: number;
}

export default function RecordingWaveform({ active, metering }: Props) {
  const [bars] = useState(() => Array.from({ length: 30 }, () => new Animated.Value(3)));

  useEffect(() => {
    // Scale the displayed bars only; never change the recorded audio or its volume.
    const level = active && metering != null && Number.isFinite(metering)
      ? Math.min(1, Math.pow(10, metering / 20) * 8)
      : 0;
    const animations = bars.map((bar, index) => Animated.timing(bar, {
      toValue: 3 + level * (28 + (index % 5) * 8),
      duration: 100,
      useNativeDriver: false,
    }));
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [active, metering, bars]);

  return (
    <View style={styles.waveform} pointerEvents="none" accessibilityLabel="Microphone sound levels">
      {bars.map((height, index) => (
        <Animated.View key={index} style={[styles.bar, { height }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  waveform: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 68, width: "100%" },
  bar: { width: 3, marginHorizontal: 2.5, borderRadius: 3, backgroundColor: COLORS.primary },
});
