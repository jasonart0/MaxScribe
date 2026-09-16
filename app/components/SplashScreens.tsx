import React, { useState } from "react";
import { COLORS } from "constants/Colors";
import {
  Animated,
  Easing,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

type SplashScreensProps = {
  onComplete: () => void;
};

const splashImages: ImageSourcePropType[] = [
  require("../../assets/images/splash-record.png"),
  require("../../assets/images/splash-notes.png"),
  require("../../assets/images/splash-forms.png"),
];

export default function SplashScreens({ onComplete }: SplashScreensProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transition] = useState(() => new Animated.Value(0));
  const isLastScreen = activeIndex === splashImages.length - 1;

  const showNextScreen = () => {
    if (isTransitioning) return;

    if (isLastScreen) {
      onComplete();
      return;
    }

    setIsTransitioning(true);
    Animated.timing(transition, {
      toValue: 1,
      duration: 450,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setActiveIndex((currentIndex) => currentIndex + 1);
      }
      transition.setValue(0);
      setIsTransitioning(false);
    });
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Splash screen ${activeIndex + 1} of ${splashImages.length}. Tap to continue.`}
        disabled={isTransitioning}
        onPress={showNextScreen}
        style={styles.pressable}
      >
        <Animated.Image
          source={splashImages[activeIndex]}
          resizeMode="cover"
          style={[
            styles.image,
            {
              opacity: transition.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
            },
          ]}
        />
        {!isLastScreen && (
          <Animated.Image
            source={splashImages[activeIndex + 1]}
            resizeMode="cover"
            style={[styles.image, styles.overlayImage, { opacity: transition }]}
          />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  pressable: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlayImage: {
    ...StyleSheet.absoluteFillObject,
  },
});
