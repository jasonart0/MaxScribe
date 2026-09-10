import { COLORS } from "constants/Colors";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  View
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function SplashAnimation({ onAnimationEnd }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Dummy image opacity (fade in with last effect)
  const imageOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Step 1: Drop with bounce
    Animated.timing(translateY, {
      toValue: height / 2 - 10,
      duration: 800,
      easing: Easing.bounce,
      useNativeDriver: true,
    }).start();

    // Step 2: Scale to 2x
    setTimeout(() => {
      Animated.timing(scale, {
        toValue: 2,
        duration: 400,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    }, 1700);

    // Step 3: Scale to 4x
    setTimeout(() => {
      Animated.timing(scale, {
        toValue: 4,
        duration: 600,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    }, 2500);

    // Step 4: Fill screen + fade + show image
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: width * 2,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(imageOpacity, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start(() => onAnimationEnd && onAnimationEnd());
    }, 3500);
  }, []);

  return (
    <View style={styles.container}>
      {/* Dummy image (fades in) */}
      <Animated.Image
        source={require("../../assets/images/logo.png")} // 🔹 your dummy image
        style={[styles.logo, { opacity: imageOpacity }]}
        resizeMode="contain"
      />

      {/* Animated circle */}
      <Animated.View
        style={[
          styles.circle,
          { transform: [{ translateY }, { scale }], opacity },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 100,
    backgroundColor: COLORS.primary,
    alignSelf: "center",
    position: "absolute",
  },
  logo: {
    width: 200,
    height: 200,
    alignSelf: "center",
    position: "absolute",
    top: height / 2 - 100, // center vertically
  },
});
