import React, { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

type SplashAnimationProps = {
  onAnimationEnd?: () => void;
};

const enterEasing = Easing.out(Easing.cubic);

export default function SplashAnimation({
  onAnimationEnd,
}: SplashAnimationProps) {
  const [backgroundScale] = useState(() => new Animated.Value(1));
  const [logoOpacity] = useState(() => new Animated.Value(0));
  const [logoScale] = useState(() => new Animated.Value(0.85));
  const [barsOpacity] = useState(() => new Animated.Value(0));
  const [barsScale] = useState(() => new Animated.Value(0.96));

  useEffect(() => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      onAnimationEnd?.();
    };

    const backgroundPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundScale, {
          toValue: 1.045,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(backgroundScale, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const logoEntrance = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        delay: 350,
        easing: enterEasing,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 850,
        delay: 350,
        easing: enterEasing,
        useNativeDriver: true,
      }),
    ]);

    const logoBreathing = Animated.loop(
      Animated.sequence([
        Animated.delay(250),
        Animated.timing(logoScale, {
          toValue: 1.035,
          duration: 750,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const barsEntrance = Animated.parallel([
      Animated.timing(barsOpacity, {
        toValue: 1,
        duration: 600,
        delay: 950,
        easing: enterEasing,
        useNativeDriver: true,
      }),
      Animated.timing(barsScale, {
        toValue: 1,
        duration: 700,
        delay: 950,
        easing: enterEasing,
        useNativeDriver: true,
      }),
    ]);

    const barsWave = Animated.loop(
      Animated.sequence([
        Animated.timing(barsScale, {
          toValue: 1.045,
          duration: 520,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(barsScale, {
          toValue: 0.965,
          duration: 640,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(barsScale, {
          toValue: 1.02,
          duration: 560,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(barsScale, {
          toValue: 1,
          duration: 640,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    backgroundPulse.start();
    logoEntrance.start(() => logoBreathing.start());
    barsEntrance.start(() => barsWave.start());

    const fallback = setTimeout(finish, 2200);

    return () => {
      clearTimeout(fallback);
      backgroundPulse.stop();
      logoEntrance.stop();
      logoBreathing.stop();
      barsEntrance.stop();
      barsWave.stop();
    };
  }, [backgroundScale, barsOpacity, barsScale, logoOpacity, logoScale, onAnimationEnd]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require("../../assets/images/bg-img.png")}
        resizeMode="cover"
        style={[styles.background, { transform: [{ scale: backgroundScale }] }]}
      />
      <Animated.Image
        source={require("../../assets/images/Baar-img.png")}
        resizeMode="contain"
        style={[styles.bars, { opacity: barsOpacity, transform: [{ scaleY: barsScale }] }]}
      />
      <Animated.Image
        source={require("../../assets/images/logo-img.png")}
        resizeMode="contain"
        style={[styles.logo, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#19C3D4",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  bars: {
    position: "absolute",
    width: "94%",
    aspectRatio: 2172 / 724,
  },
  logo: {
    position: "absolute",
    width: "40%",
    aspectRatio: 1,
  },
});
