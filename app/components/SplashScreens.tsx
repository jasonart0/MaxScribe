import { Asset } from "expo-asset";
import React, { useEffect, useRef, useState } from "react";
import { Animated, ImageSourcePropType, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "constants/Colors";
import BlueGradient from "./BlueGradient";

interface Props { onComplete: () => void }

const slides: { title: string; accent: string; description: string; image: ImageSourcePropType }[] = [
  {
    title: "RECORD", accent: "CONVERSATIONS.",
    description: "Capture patient and provider voice securely.",
    image: require("../../assets/images/onboarding-record.png"),
  },
  {
    title: "GENERATE", accent: "CLINICAL NOTES.",
    description: "AI converts conversations into accurate, structured notes.",
    image: require("../../assets/images/onboarding-notes.png"),
  },
  {
    title: "FILL RELEVANT", accent: "FORMS AUTOMATICALLY.",
    description: "Notes are used to complete relevant forms in seconds.",
    image: require("../../assets/images/onboarding-forms.png"),
  },
];

export default function SplashScreens({ onComplete }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [opacity] = useState(() => new Animated.Value(1));
  const transitionLock = useRef(false);
  const { height, width } = useWindowDimensions();
  const compact = height < 700;
  const slide = slides[activeIndex];
  const last = activeIndex === slides.length - 1;
  const illustrationSize = Math.min(440, width - 40);

  useEffect(() => {
    const next = slides[activeIndex + 1];
    if (next) void Asset.loadAsync(next.image as number).catch(() => {});
  }, [activeIndex]);

  useEffect(() => () => opacity.stopAnimation(), [opacity]);

  const advance = () => {
    if (transitionLock.current) return;
    if (last) { onComplete(); return; }
    transitionLock.current = true;
    setIsTransitioning(true);
    Animated.timing(opacity, { toValue: 0, duration: 100, useNativeDriver: true }).start(({ finished }) => {
      if (!finished) return;
      setActiveIndex((index) => index + 1);
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }).start(({ finished: completed }) => {
        if (!completed) return;
        transitionLock.current = false;
        setIsTransitioning(false);
      });
    });
  };

  return (
    <View style={styles.background}>
      {/* The same lightweight background stays mounted across all three slides. */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.circle, styles.topCircle]} />
        <View style={[styles.circle, styles.bottomCircle]} />
      </View>
      <SafeAreaView style={styles.safe}>
        <View style={styles.layout}>
          <View style={styles.topBar}>
            <Text style={styles.brand}>MaxScribe</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Splash screen ${activeIndex + 1} of 3. Tap to continue.`}
            disabled={isTransitioning} onPress={advance} style={styles.content}>
            <Animated.View style={[styles.slide, { opacity }]}>
              <View style={[styles.copy, compact && styles.copyCompact]}>
                <Text style={[styles.title, compact && styles.titleCompact]}>{slide.title}</Text>
                <Text style={[styles.title, styles.accent, compact && styles.titleCompact]}>{slide.accent}</Text>
                <Text style={[styles.description, compact && styles.descriptionCompact]}>{slide.description}</Text>
              </View>
              <View style={styles.illustrationArea}>
                <Animated.Image source={slide.image} resizeMode="contain" accessible={false}
                  style={[styles.illustration, { maxWidth: illustrationSize }]} />
              </View>
            </Animated.View>
          </Pressable>
          <View style={styles.footer}>
            <View style={styles.dots} accessibilityLabel={`Page ${activeIndex + 1} of 3`}>
              {slides.map((_, index) => (
                <View key={index} style={[styles.dot, index === activeIndex && styles.activeDot]}>
                  {index === activeIndex && <BlueGradient />}
                </View>
              ))}
            </View>
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" onPress={onComplete}
                style={({ pressed }) => [styles.skip, pressed && styles.pressed]}>
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={isTransitioning} onPress={advance}
                style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]}>
                <BlueGradient />
                <Text style={styles.nextText}>{last ? "Get Started" : "Continue"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: COLORS.background, overflow: "hidden" },
  circle: { position: "absolute", borderRadius: 999, backgroundColor: "#E7F3FF" },
  topCircle: { width: 300, height: 300, right: -140, top: 30 },
  bottomCircle: { width: 380, height: 380, left: -160, bottom: 90 },
  safe: { flex: 1 },
  layout: { flex: 1, width: "100%", maxWidth: 560, alignSelf: "center", paddingHorizontal: 24 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 52 },
  brand: { color: COLORS.deep, fontSize: 17, fontWeight: "700" },
  skip: { minHeight: 44, minWidth: 80, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  skipText: { color: COLORS.textLight, fontSize: 14 },
  content: { flex: 1, minHeight: 0 },
  slide: { flex: 1 },
  copy: { paddingTop: 32 },
  copyCompact: { paddingTop: 12 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: "800", color: "#071A60" },
  titleCompact: { fontSize: 25, lineHeight: 30 },
  accent: { color: "#087CF0" },
  description: { fontSize: 17, lineHeight: 25, marginTop: 12, color: COLORS.deep },
  descriptionCompact: { fontSize: 15, lineHeight: 22, marginTop: 8 },
  illustrationArea: { flex: 1, minHeight: 0, alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  illustration: { width: "100%", height: "100%" },
  footer: { paddingTop: 8, paddingBottom: 16, gap: 18 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#C8DFF5" },
  activeDot: { overflow: "hidden", backgroundColor: "#2B69C1" },
  actions: { gap: 8 },
  nextButton: { overflow: "hidden", minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 6, backgroundColor: "#2B69C1" },
  nextText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  pressed: { opacity: 0.8 },
});
