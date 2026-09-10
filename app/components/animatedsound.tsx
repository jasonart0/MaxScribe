import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Easing,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function RecordingBars() {
  const [recording, setRecording] = useState(false);

  // Create multiple animated values for bars
  const bars = Array.from({ length: 10 }, () => useRef(new Animated.Value(10)).current);

  // Animate bars with random heights
  const animateBars = () => {
    bars.forEach((bar) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: Math.random() * 80 + 20, // random height
            duration: 300,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
          Animated.timing(bar, {
            toValue: Math.random() * 80 + 20,
            duration: 300,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
        ])
      ).start();
    });
  };

  // Stop bars animation
  const stopBars = () => {
    bars.forEach((bar) => bar.stopAnimation());
  };

  useEffect(() => {
    if (recording) {
      animateBars();
    } else {
      stopBars();
      bars.forEach((bar) => bar.setValue(10));
    }
  }, [recording]);

  return (
    <View style={styles.container}>
      {/* Recording visualizer */}
      <View style={styles.barsContainer}>
        {bars.map((bar, index) => (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                height: bar,
              },
            ]}
          />
        ))}
      </View>

      {/* Record button */}
      <TouchableOpacity
        style={styles.recordBtn}
        onPress={() => setRecording(!recording)}
      >
        <Text style={styles.btnText}>
          {recording ? "Stop" : "Record"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 40,
  },
  bar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: "#FF1744",
    marginHorizontal: 3,
  },
  recordBtn: {
    backgroundColor: "#FF1744",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  btnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
