import { COLORS } from "constants/Colors";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  ImageStyle,
  StyleSheet,
  View,
} from "react-native";

type SplashAnimationProps = {
  onAnimationEnd?: () => void;
};

export default function SplashAnimation({
  onAnimationEnd,
}: SplashAnimationProps) {
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      onAnimationEnd?.();
    };

    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        speed: 12,
        bounciness: 4,
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished: animationFinished }) => {
      if (animationFinished) finish();
    });

    // Never leave the app trapped on the splash if an animation callback is lost.
    const fallback = setTimeout(finish, 1400);

    return () => {
      clearTimeout(fallback);
      animation.stop();
    };
  }, [onAnimationEnd, opacity, scale]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require("../../assets/images/logo.png")}
        style={[
          styles.logo,
          { opacity, transform: [{ scale }] } as Animated.WithAnimatedValue<ImageStyle>,
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  logo: {
    width: 200,
    height: 200,
  },
});
