// MicPulse.js (Expo)
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const DEFAULTS = {
  size: 96, // mic icon size in px
  rippleCount: 3, // number of expanding layers
  rippleDuration: 1600, // ms for one ripple to expand and fade
  rippleDelay: 500, // stagger delay between ripples
  color: "#e23b3b", // red color for ripples
};

export default function MicPulse({
  size = DEFAULTS.size,
  rippleCount = DEFAULTS.rippleCount,
  rippleDuration = DEFAULTS.rippleDuration,
  rippleDelay = DEFAULTS.rippleDelay,
  color = DEFAULTS.color,
}) {
  // create animated values for each ripple
  const ripples = useRef(
    Array.from({ length: rippleCount }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  // mic icon bounce scale
  const micScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // start ripple loops with staggered delays
    const rippleAnims = ripples.map((ripple, i) => {
      const startDelay = i * rippleDelay;
      const anim = Animated.loop(
        Animated.sequence([
          Animated.delay(startDelay),
          Animated.parallel([
            Animated.timing(ripple.scale, {
              toValue: 2.8, // final scale multiplier
              duration: rippleDuration,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(ripple.opacity, {
              toValue: 0,
              duration: rippleDuration,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
          ]),
          // reset quickly (no visible jump because loop restarts)
          Animated.timing(ripple.scale, {
            toValue: 0,
            duration: 1,
            useNativeDriver: true,
          }),
          Animated.timing(ripple.opacity, {
            toValue: 1,
            duration: 1,
            useNativeDriver: true,
          }),
        ])
      );
      return anim;
    });

    // mic bounce animation (subtle)
    const micAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(micScale, {
          toValue: 1.06,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(micScale, {
          toValue: 1,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(400),
      ])
    );

    // start all
    rippleAnims.forEach((a) => a.start());
    micAnim.start();

    // cleanup
    return () => {
      rippleAnims.forEach((a) => a.stop());
      micAnim.stop();
    };
  }, [ripples, rippleDuration, rippleDelay, micScale]);

  const wrapperSize = size * 3.2; // container big enough to show ripples

  return (
    <View
      style={[styles.container, { width: wrapperSize, height: wrapperSize }]}
    >
      {/* ripples */}
      {ripples.map((ripple, i) => {
        const rippleStyle = {
          position: "absolute",
          left: wrapperSize / 2 - size * 0.6,
          top: wrapperSize / 2 - size * 0.6,
          width: size * 1.2,
          height: size * 1.2,
          borderRadius: (size * 1.2) / 2,
          borderWidth: 2,
          borderColor: color,
          transform: [{ scale: ripple.scale }],
          opacity: ripple.opacity,
        };
        return (
          <Animated.View key={i} style={rippleStyle} pointerEvents="none" />
        );
      })}

      {/* central mic button */}
      <TouchableOpacity
        disabled={true}
        activeOpacity={0.8}
        // onPress={onPress}
        style={[
          styles.centerButtonWrap,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            left: wrapperSize / 2 - size / 2,
            top: wrapperSize / 2 - size / 2,
          },
        ]}
      >
        <Animated.View
          style={{
            transform: [{ scale: micScale }],
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={[
              styles.centerButton,
              { width: size, height: size, borderRadius: size / 2 },
            ]}
          >
            <MaterialIcons
              name="mic"
              size={Math.round(size * 0.6)}
              color="#fff"
            />
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerButtonWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  centerButton: {
    backgroundColor: "#e23b3b", // solid red mic circle
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
});
