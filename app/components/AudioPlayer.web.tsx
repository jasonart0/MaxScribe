import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props { uri: string | null }

export default function PlayRecordedAudio({ uri }: Props) {
  const [failedUri, setFailedUri] = React.useState<string | null>(null);
  if (!uri) return null;
  return (
    <View style={styles.container}>
      {React.createElement("audio", {
        src: uri, controls: true, preload: "metadata",
        "aria-label": "Recorded audio preview",
        style: { width: "100%" },
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
