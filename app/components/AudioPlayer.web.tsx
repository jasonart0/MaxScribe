import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props { uri: string | null; compact?: boolean; neon?: boolean }

export default function PlayRecordedAudio({ uri, compact = false, neon = false }: Props) {
  const [failedUri, setFailedUri] = React.useState<string | null>(null);
  if (!uri) return null;
  return (
    <View style={[styles.container, compact && { width: "100%", padding: 0 }, neon && { backgroundColor: "transparent" }]}>
      {React.createElement("audio", {
        src: uri, controls: true, preload: "metadata",
        "aria-label": "Recorded audio preview",
        style: { width: "100%", ...(compact ? { height: 32 } : {}), ...(neon ? { colorScheme: "dark" } : {}) },
        onError: () => setFailedUri(uri),
      })}
      {failedUri === uri && <Text style={styles.error}>The recording could not be played. Please record again.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "95%", alignSelf: "center", padding: 10, borderRadius: 12, backgroundColor: "#EAF5FF" },
  error: { color: "#B42318", marginTop: 8 },
});
