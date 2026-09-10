import { setHeight } from "@lib";
import { COLORS } from "constants/Colors";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, StyleSheet, View } from "react-native";
interface StepLoaderProps {
  visible: boolean;
  onFinish?: () => void;
}

const steps = [
  "Analyzing your request...",
  "Processing data with AI...",
  "Optimizing results...",
  "Finalizing output...",
];

export default function StepLoader({ visible, onFinish }: StepLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Animated values for dots
  const animValues = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  // Fade for step text
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Handle steps change
  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        clearInterval(interval);
        if (onFinish) onFinish();
        return prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [visible]);

  // Animate text fade on step change
  useEffect(() => {
    if (!visible) return;

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep, visible]);

  // Animate dots
  useEffect(() => {
    if (!visible) return;

    animValues.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 800,
            delay: i * 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent={true} // ✅ allows background to be seen
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.dotsContainer}>
          {animValues.map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  opacity: anim,
                  transform: [
                    {
                      scale: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1.4],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
        <Animated.Text style={[styles.text, { opacity: fadeAnim }]}>
          {steps[currentStep]}
        </Animated.Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 100,
    marginBottom: 20,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary, // Neon AI color
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  text: {
    marginTop: 10,
    color: "#000000ff",

    fontSize: setHeight(2),
    fontWeight: "bold",
    textAlign: "center",
  },
});
