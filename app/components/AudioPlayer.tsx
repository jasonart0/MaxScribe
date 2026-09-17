import { Entypo } from "@expo/vector-icons";
import { faildMessage, setHeight } from "@lib";
import Slider from "@react-native-community/slider";
import { COLORS } from "constants/Colors";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  uri: string | null;
}

const PlayRecordedAudio: React.FC<Props> = ({ uri }) => {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

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
    <View style={styles.container}>
      <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
        <Entypo
          name={status.playing ? "controller-paus" : "controller-play"}
          size={setHeight(5)}
          color={COLORS.primary}
        />
      </TouchableOpacity>

      <View style={styles.sliderContainer}>
        <Slider
          style={{ flex: 1 }}
          minimumValue={0}
          maximumValue={(status.duration || 1) * 1000}
          value={status.currentTime * 1000}
          onSlidingComplete={handleSeek}
          minimumTrackTintColor={COLORS.primary}
          maximumTrackTintColor="#ccc"
          thumbTintColor={COLORS.primary}
        />
        <View style={styles.timeWrapper}>
          <Text style={styles.time}>{formatTime(status.currentTime * 1000)}</Text>
          <Text style={styles.time}>{formatTime((status.duration || 1) * 1000)}</Text>
        </View>
      </View>
    </View>
  );
};

export default PlayRecordedAudio;

const styles = StyleSheet.create({
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
