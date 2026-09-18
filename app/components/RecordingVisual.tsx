import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";

export function RecordingBackdrop() {
  const focused = useIsFocused();
  const [drift] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!focused) return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(drift, { toValue: 1, duration: 4200, easing: Easing.inOut(Easing.ease), useNativeDriver: true, isInteraction: false }),
      Animated.timing(drift, { toValue: 0, duration: 4200, easing: Easing.inOut(Easing.ease), useNativeDriver: true, isInteraction: false }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [drift, focused]);
  return <View pointerEvents="none" style={styles.backdrop}>
    <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 850">
      <Defs><LinearGradient id="recordingBlue" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#061C55" /><Stop offset="0.5" stopColor="#066BC4" /><Stop offset="1" stopColor="#02DBC4" />
      </LinearGradient></Defs>
      <Rect width="400" height="850" fill="url(#recordingBlue)" />
    </Svg>
    <Animated.View style={[styles.flame, { transform: [
      { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [55, -65] }) },
      { rotate: drift.interpolate({ inputRange: [0, 1], outputRange: ["-18deg", "12deg"] }) },
      { scale: drift.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] }) },
    ] }]}>
      <Svg width="100%" height="100%" viewBox="0 0 400 700">
        <Defs><RadialGradient id="blueFlame" cx="50%" cy="55%" rx="50%" ry="50%">
          <Stop offset="0" stopColor="#02DBC4" stopOpacity={0.55} /><Stop offset="0.5" stopColor="#02DBC4" stopOpacity={0.3} /><Stop offset="1" stopColor="#02DBC4" stopOpacity={0} />
        </RadialGradient></Defs>
        <Ellipse cx="200" cy="350" rx="200" ry="350" fill="url(#blueFlame)" />
      </Svg>
    </Animated.View>
  </View>;
}

export default function RecordingMic({ size, active, processing, stage, progress }: {
  size: number; active: boolean; processing: boolean; stage: "transcribing" | "conversation"; progress?: number;
}) {
  const [pulse] = useState(() => new Animated.Value(0));
  const [glow] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const fade = Animated.timing(glow, { toValue: processing ? 0 : 1, duration: 350, useNativeDriver: true });
    fade.start();
    return () => fade.stop();
  }, [processing, glow]);
  useEffect(() => {
    if (!active) return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1300, useNativeDriver: true, isInteraction: false }),
      Animated.timing(pulse, { toValue: 0, duration: 1300, useNativeDriver: true, isInteraction: false }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [active, pulse]);
  return <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
    <Animated.View pointerEvents="none" style={[styles.halo, { opacity: glow, transform: [
      { scale: active ? pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) : 1 },
    ] }]}>
      <View style={styles.innerHalo} />
    </Animated.View>
    {processing && <TranscriptionRing size={size} stage={stage} progress={progress ?? 8} />}
    <Svg width={size * (processing ? 0.36 : 0.53)} height={size * (processing ? 0.48 : 0.7)} viewBox="0 0 120 160"
      style={processing ? { marginTop: -size * 0.16 } : undefined}>
      <Path d="M30 40a30 30 0 0 1 60 0v60a30 30 0 0 1-60 0V40z M18 86v14a42 42 0 0 0 84 0V86 M60 142v15 M31 64h17 M31 74h17 M31 84h17 M31 94h17 M31 104h17 M72 64h17 M72 74h17 M72 84h17 M72 94h17 M72 104h17"
        stroke="#E9F9FF" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  </View>;
}

function TranscriptionRing({ size, stage, progress }: { size: number; stage: "transcribing" | "conversation"; progress: number }) {
  const ringProgress = stage === "conversation" ? Math.max(progress, 94) : progress;
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  return <View style={styles.ring} accessibilityRole="progressbar" accessibilityLabel="Estimated transcription progress"
    accessibilityValue={{ min: 0, max: 100, now: ringProgress }}>
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#FFFFFF" strokeOpacity={0.15} strokeWidth={5} fill="none" />
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#D7F5FF" strokeWidth={5} fill="none" strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={circumference * (1 - ringProgress / 100)}
        rotation={-90} origin={`${size / 2}, ${size / 2}`} />
    </Svg>
  </View>;
}

export function RecordingWaves({ active, metering }: { active: boolean; metering?: number }) {
  const [phase] = useState(() => new Animated.Value(0));
  const [amplitude] = useState(() => new Animated.Value(0.08));
  useEffect(() => {
    if (!active) return;
    phase.setValue(0);
    const animation = Animated.loop(Animated.timing(phase, { toValue: 1, duration: 2400, easing: Easing.linear,
      useNativeDriver: true, isInteraction: false }));
    animation.start();
    return () => animation.stop();
  }, [active, phase]);
  useEffect(() => {
    const level = active && metering != null && Number.isFinite(metering)
      ? Math.min(1, Math.pow(10, metering / 20) * 8) : 0;
    const animation = Animated.timing(amplitude, { toValue: active ? 0.12 + level * 0.88 : 0.04,
      duration: 130, useNativeDriver: true, isInteraction: false });
    animation.start();
    return () => animation.stop();
  }, [active, metering, amplitude]);
  return <View style={styles.waveClip} pointerEvents="none" accessibilityLabel="Microphone sound waves">
    <Animated.View style={{ width: 720, height: 76, transform: [
      { translateX: phase.interpolate({ inputRange: [0, 1], outputRange: [0, -360] }) }, { scaleY: amplitude },
    ] }}>
      <Svg width={720} height={76} viewBox="0 0 720 76">
        {[0, 1, 2, 3].map((line) => {
          const d = Array.from({ length: 181 }, (_, index) => {
            const x = index * 4;
            const y = 38 + Math.sin(x * Math.PI / 90 + line * 0.7) * (27 - line * 5) * (0.55 + 0.45 * Math.cos(x * Math.PI / 180));
            return `${index ? "L" : "M"}${x},${y.toFixed(2)}`;
          }).join(" ");
          return <Path key={line} d={d} fill="none" stroke="#D9F6FF" strokeOpacity={1 - line * 0.2} strokeWidth={2 - line * 0.25} />;
        })}
      </Svg>
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  backdrop: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, overflow: "hidden", backgroundColor: "#0758AE" },
  flame: { position: "absolute", top: "15%", right: "-20%", width: "120%", height: "90%" },
  halo: { position: "absolute", width: "100%", height: "100%", borderRadius: 999, backgroundColor: "rgba(132,218,255,0.09)", borderWidth: 1, borderColor: "rgba(192,235,255,0.08)", alignItems: "center", justifyContent: "center" },
  innerHalo: { width: "82%", height: "82%", borderRadius: 999, backgroundColor: "rgba(154,224,255,0.08)" },
  ring: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center" },
  percentage: { position: "absolute", color: "#FFFFFF", fontWeight: "600" },
  waveClip: { width: "100%", maxWidth: 360, height: 76, overflow: "hidden" },
});
