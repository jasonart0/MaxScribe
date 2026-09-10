import { Entypo } from "@expo/vector-icons";
import { setHeight } from "@lib";
import Slider from "@react-native-community/slider";
import { COLORS } from "constants/Colors";
import { Audio, AVPlaybackStatus } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  uri: string | null;
}

const PlayRecordedAudio: React.FC<Props> = ({ uri }) => {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);

  useEffect(() => {
    const prepareAudio = async () => {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    };
    prepareAudio();
  }, []);

  // Load & cleanup
  useEffect(() => {
    const loadSound = async () => {
      if (!uri) return;

      // Unload old instance
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current.setOnPlaybackStatusUpdate(null);
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false, isLooping: false }, // ✅ ensure no loop
        updateStatus
      );

      soundRef.current = sound;
    };

    loadSound();

    return () => {
      if (soundRef.current) {
        soundRef.current.setOnPlaybackStatusUpdate(null);
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, [uri]);

  const updateStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    setPosition(status.positionMillis);
    setDuration(status.durationMillis || 1);

    if (status.didJustFinish) {
      // ✅ Explicitly stop to prevent looping on Android
      soundRef.current?.stopAsync();
      soundRef.current?.setPositionAsync(0);

      setIsPlaying(false);
      setPosition(0);
    }
  };

  const togglePlayPause = async () => {
    if (!soundRef.current) return;

    if (isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const handleSeek = async (value: number) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(value);
      setPosition(value);
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
         name={isPlaying ? "controller-paus" : "controller-play"}// ✅ fixed
          size={setHeight(5)}
          color={COLORS.primary}
        />
      </TouchableOpacity>

      <View style={styles.sliderContainer}>
        <Slider
          style={{ flex: 1 }}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onSlidingComplete={handleSeek}
          minimumTrackTintColor={COLORS.primary}
          maximumTrackTintColor="#ccc"
          thumbTintColor={COLORS.primary}
        />
        <View style={styles.timeWrapper}>
          <Text style={styles.time}>{formatTime(position)}</Text>
          <Text style={styles.time}>{formatTime(duration)}</Text>
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
