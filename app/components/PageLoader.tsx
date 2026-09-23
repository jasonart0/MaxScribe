import React, { useEffect, useState } from "react";
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from "react-native";
import BlueGradient from "./BlueGradient";

type PageLoaderProps = {
  visible?: boolean;
  message?: string;
};

export default function PageLoader({ visible = false, message = "Please wait..." }: PageLoaderProps) {
  const [pulse] = useState(() => new Animated.Value(0));
  const [rotation] = useState(() => new Animated.Value(0));
  const [drift] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) return;
    const animation = Animated.parallel([
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true, isInteraction: false }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true, isInteraction: false }),
      ])),
      Animated.loop(Animated.timing(rotation, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: true, isInteraction: false })),
      Animated.loop(Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 3600, easing: Easing.inOut(Easing.ease), useNativeDriver: true, isInteraction: false }),
        Animated.timing(drift, { toValue: 0, duration: 3600, easing: Easing.inOut(Easing.ease), useNativeDriver: true, isInteraction: false }),
      ])),
    ]);
    animation.start();
    return () => animation.stop();
  }, [drift, pulse, rotation, visible]);

  if (!visible) return null;

  return (
    <View
      accessibilityLabel={message}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      style={styles.overlay}
    >
      <BlueGradient />
      <Animated.View pointerEvents="none" style={[styles.glow, styles.glowTop, {
        transform: [
          { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [-24, 38] }) },
          { scale: drift.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.12] }) },
        ],
      }]} />
      <Animated.View pointerEvents="none" style={[styles.glow, styles.glowBottom, {
        transform: [
          { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [34, -28] }) },
          { scale: drift.interpolate({ inputRange: [0, 1], outputRange: [1.14, 0.94] }) },
        ],
      }]} />
      <View style={styles.content}>
        <View style={styles.loader}>
          <Animated.View style={[styles.pulseRing, {
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.48, 0.08] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.3] }) }],
          }]} />
          <View style={styles.innerRing} />
          <Animated.View style={[styles.orbit, {
            transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }],
          }]}>
            <View style={styles.orbitDot} />
          </Animated.View>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.supportingText}>Securely processing your request</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1000,
    elevation: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    overflow: "hidden",
    backgroundColor: "#2B69C1",
  },
  glow: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: "rgba(138,240,229,0.16)",
  },
  glowTop: { top: -190, right: -170 },
  glowBottom: { bottom: -220, left: -150, backgroundColor: "rgba(117,196,255,0.17)" },
  content: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    justifyContent: "center",
  },
  loader: {
    width: 112,
    height: 112,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 1.5,
    borderColor: "#D9F6FF",
    backgroundColor: "rgba(217,246,255,0.08)",
  },
  innerRing: {
    position: "absolute",
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1,
    borderColor: "rgba(233,249,255,0.34)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  orbit: {
    position: "absolute",
    width: 94,
    height: 94,
    borderRadius: 47,
  },
  orbitDot: {
    position: "absolute",
    top: 1,
    left: 43,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#A0FFF3",
    shadowColor: "#A0FFF3",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  message: {
    marginTop: 22,
    color: "#FFFFFF",
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "700",
    textAlign: "center",
  },
  supportingText: {
    marginTop: 7,
    color: "rgba(232,248,255,0.78)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    textAlign: "center",
  },
});
