import { Entypo } from "@expo/vector-icons";
import { faildMessage, setHeight } from "@lib";
import Slider from "@react-native-community/slider";
import { useIsFocused } from "@react-navigation/native";
import { COLORS } from "constants/Colors";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  uri: string | null;
  compact?: boolean;
  neon?: boolean;
}

const PlayRecordedAudio: React.FC<Props> = ({ uri, compact = false, neon = false }) => {
  const accent = neon ? "#8FFFF0" : COLORS.primary;
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const focused = useIsFocused();

  useEffect(() => {
    if (!focused) player.pause();
  }, [focused, player]);

  useEffect(() => {
    if (status.error) faildMessage("Unable to load this recording. Please record again.");
  }, [status.error]);

  useEffect(() => {
    const prepareAudio = async () => {
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      });
      // Expo's native player exposes volume as a writable property.
      // eslint-disable-next-line react-hooks/immutability
      player.volume = 1;
    };
    void prepareAudio().catch(() => faildMessage("Unable to prepare audio playback. Please try again."));
  }, [player]);

  const togglePlayPause = async () => {
    if (!status.isLoaded || status.error) return;
    try {
      if (status.playing) {
        player.pause();
      } else {
        if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration)) {
          await player.seekTo(0);
        }
        player.play();
      }
    } catch {
      faildMessage("Unable to play this recording. Please try again.");
    }
  };

  const handleSeek = async (value: number) => {
    if (!status.isLoaded || status.error) return;
    try {
      await player.seekTo(value / 1000);
    } catch {
      faildMessage("Unable to seek in this recording. Please try again.");
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  if (!uri) return null;

  return (
    <View style={[styles.container, compact && styles.compact, neon && { backgroundColor: "transparent" }]}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={status.playing ? "Pause clip" : "Play clip"}
        disabled={!status.isLoaded || Boolean(status.error)} onPress={togglePlayPause} style={[styles.playButton, compact && styles.compactPlay]}>
        <Entypo
          name={status.playing ? "controller-paus" : "controller-play"}
          size={compact ? 24 : setHeight(5)}
          color={accent}
        />
      </TouchableOpacity>

      <View style={styles.sliderContainer}>
        <Slider
          style={{ flex: 1, ...(compact ? { height: 28 } : {}) }}
          minimumValue={0}
          maximumValue={(status.duration || 1) * 1000}
          value={status.currentTime * 1000}
          onSlidingComplete={handleSeek}
          disabled={!status.isLoaded || Boolean(status.error)}
          minimumTrackTintColor={accent}
          maximumTrackTintColor={neon ? "rgba(143,255,240,0.25)" : "#ccc"}
          thumbTintColor={accent}
        />
        {!compact && <View style={styles.timeWrapper}>
          <Text style={styles.time}>{formatTime(status.currentTime * 1000)}</Text>
          <Text style={styles.time}>{formatTime((status.duration || 1) * 1000)}</Text>
        </View>}
      </View>
      {compact && <Text style={[styles.time, { fontSize: 10, color: neon ? "#C6FFF6" : "#555", fontVariant: ["tabular-nums"] }]}>
        {formatTime(status.currentTime * 1000)} / {formatTime((status.duration || 1) * 1000)}
      </Text>}
    </View>
  );
};

export default PlayRecordedAudio;

const styles = StyleSheet.create({
  compact: { width: "100%", padding: 0, gap: 4, borderRadius: 0 },
  compactPlay: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center", padding: 0 },
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "95%",
    alignSelf: "center",
    backgroundColor: COLORS.secondary,
    padding: 10,
    borderRadius: setHeight(1.5),
  },
  playButton: {
    padding: 5,
  },
  sliderContainer: {
    flex: 1,
  },
  timeWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    color: "#555",
  },
});
