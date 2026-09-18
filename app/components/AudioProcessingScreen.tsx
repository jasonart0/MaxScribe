import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Animated, Easing, Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

type Props = { visible: boolean; patientName?: string; stage: "transcribing" | "conversation" };
const BLUE = "#4165FF";
const INK = "#202479";
const BAR_HEIGHTS = [8, 20, 34, 55, 30, 14, 26, 60, 86, 110, 88, 65, 40, 20, 28, 55, 30, 16, 8];
const RADIUS = 65;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function AudioProcessingScreen(props: Props) {
  return props.visible ? <ProcessingContent {...props} /> : null;
}

function ProcessingContent({ patientName, stage }: Props) {
  const [estimatedProgress, setProgress] = useState(8);
  const progress = stage === "conversation" ? 94 : estimatedProgress;
  const [wave] = useState(() => BAR_HEIGHTS.map(() => new Animated.Value(0)));
  const [pulse] = useState(() => new Animated.Value(0));
  const [rotation] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // The API has no processing-progress events. This estimate never completes
    // or dismisses the screen; only the actual request controls completion.
    const interval = setInterval(() => setProgress((value) => value >= 88 ? value
      : Math.min(88, value + Math.max(1, Math.round((88 - value) / 14)))), 1400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const animations = wave.map((value, index) => Animated.loop(Animated.sequence([
      Animated.timing(value, { toValue: 1, duration: 430 + index % 4 * 85, delay: index * 35,
        easing: Easing.inOut(Easing.ease), useNativeDriver: true, isInteraction: false }),
      Animated.timing(value, { toValue: 0, duration: 480, useNativeDriver: true, isInteraction: false }),
    ])));
    animations.push(Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 850, useNativeDriver: true, isInteraction: false }),
      Animated.timing(pulse, { toValue: 0, duration: 850, useNativeDriver: true, isInteraction: false }),
    ])));
    rotation.setValue(0);
    animations.push(Animated.loop(Animated.timing(rotation, { toValue: 1, duration: 4200,
      easing: Easing.linear, useNativeDriver: true, isInteraction: false })));
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [wave, pulse, rotation]);

  const transcribing = stage === "transcribing";
  return <Modal visible animationType="fade" presentationStyle="fullScreen" onRequestClose={() => {}}>
    <SafeAreaView style={styles.screen}>
      <View pointerEvents="none" style={styles.glow} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.panel}>
          <View style={styles.wave} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {BAR_HEIGHTS.map((height, index) => <Animated.View key={index} style={[styles.bar, { height,
              transform: [{ scaleY: wave[index].interpolate({ inputRange: [0, 1], outputRange: [0.45, 1.15] }) }] }]} />)}
          </View>
          <View style={styles.progress} accessibilityRole="progressbar" accessibilityLabel="Estimated processing progress"
            accessibilityValue={{ min: 0, max: 100, now: progress }}>
            <Animated.View style={{ transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] }}>
              <Svg width={160} height={160} viewBox="0 0 160 160">
                <Circle cx={80} cy={80} r={RADIUS} stroke="#E4EEFF" strokeWidth={13} fill="none" />
                <Circle cx={80} cy={80} r={RADIUS} stroke={BLUE} strokeWidth={13} fill="none" strokeLinecap="round"
                  strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`} strokeDashoffset={CIRCUMFERENCE * (1 - progress / 100)}
                  rotation={-90} origin="80, 80" />
              </Svg>
            </Animated.View>
            <View style={styles.percent}><Text style={styles.percentText}>{progress}%</Text></View>
          </View>
          <Text style={styles.estimate}>Estimated progress</Text>
          <Text style={styles.heading}>{transcribing ? "Processing audio..." : "Preparing transcript..."}</Text>
          {[{ label: "Patient", icon: "person" as const, detail: patientName },
            { label: "Provider", icon: "medical" as const }].map(({ label, icon, detail }) => <View key={label} style={styles.card}>
            <View style={styles.avatar}><Ionicons name={icon} color={BLUE} size={30} /></View>
            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle}>{label}</Text>
              {detail ? <Text numberOfLines={1} style={styles.patientName}>{detail}</Text>
                : <Animated.View style={[styles.skeleton, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] }) }]} />}
              <Animated.View style={[styles.skeleton, styles.shortLine, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 0.35] }) }]} />
            </View>
          </View>)}
          <View style={styles.status} accessibilityLiveRegion="polite">
            <View style={styles.dots}>{[0, 1, 2].map((index) => <Animated.View key={index} style={[styles.dot,
              { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: index % 2 ? [0.35, 1] : [1, 0.35] }) }]} />)}</View>
            <Text style={styles.statusText}>{transcribing ? "Transcribing..." : "Organizing conversation..."}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FAFDFF" },
  glow: { position: "absolute", width: 380, height: 380, borderRadius: 190, backgroundColor: "#EFF7FF", opacity: 0.55, top: -170, right: -160 },
  content: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20, paddingVertical: 28 },
  panel: { width: "100%", maxWidth: 400, alignItems: "center" },
  wave: { height: 135, flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 22 },
  bar: { width: 5, marginHorizontal: 4, borderRadius: 4, backgroundColor: BLUE },
  progress: { width: 160, height: 160 },
  percent: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, alignItems: "center", justifyContent: "center" },
  percentText: { fontSize: 32, fontWeight: "700", color: INK },
  estimate: { fontSize: 11, color: "#7584AC", marginTop: 7 },
  heading: { color: INK, fontSize: 20, fontWeight: "500", marginTop: 16, marginBottom: 24, textAlign: "center" },
  card: { width: "100%", flexDirection: "row", borderRadius: 20, padding: 16, backgroundColor: "#EFF6FF", marginBottom: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", marginRight: 14 },
  cardCopy: { flex: 1 },
  cardTitle: { color: BLUE, fontSize: 16, fontWeight: "600", marginBottom: 7 },
  patientName: { color: INK, fontSize: 14, marginBottom: 7 },
  skeleton: { height: 9, borderRadius: 5, backgroundColor: "#BED4FF", width: "100%", marginBottom: 8 },
  shortLine: { width: "72%", marginBottom: 0 },
  status: { width: "100%", paddingVertical: 18, paddingHorizontal: 16, borderRadius: 20, backgroundColor: "#EFF6FF", flexDirection: "row", alignItems: "center", marginTop: 2 },
  dots: { flexDirection: "row", gap: 9, marginRight: 14 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: BLUE },
  statusText: { color: BLUE, fontSize: 15, fontWeight: "500", flexShrink: 1 },
});
