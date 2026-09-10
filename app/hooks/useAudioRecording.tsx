// useVoiceRecorder.expo.ts
import { Audio } from "expo-av";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing } from "react-native";

const MIN_BAR = 2; // px
const MAX_BAR = 80; // px
const BARS = 30;

// const recordingOptions: Audio.RecordingOptions = {
//   android: {
//     extension: ".m4a",
//     outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
//     audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
//     sampleRate: 44100,
//     numberOfChannels: 1,
//     bitRate: 128000,
//   },
//   ios: {
//     extension: ".m4a",
//     audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
//     sampleRate: 44100,
//     numberOfChannels: 1,
//     bitRate: 128000,
//     linearPCMBitDepth: 16,
//     linearPCMIsBigEndian: false,
//     linearPCMIsFloat: false,
//   },
//   // 👇 THIS is required for dB levels
//   isMeteringEnabled: true,
// };
const recordingOptions: Audio.RecordingOptions = {
  android: {
    extension: ".m4a",
    outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
    audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000, // ✅ safe for APIs
  },
  ios: {
    extension: ".m4a",
    audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MEDIUM,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
    outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
  },
  isMeteringEnabled: true,
};

export const useVoiceRecorder = () => {
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Start speaking...");
  const [timer, setTimer] = useState(0);

  const [levels, setLevels] = useState<number[]>(() => new Array(BARS).fill(0));
  const animValues = useRef(
    levels.map(() => new Animated.Value(MIN_BAR))
  ).current;

  const recordingRef = useRef<Audio.Recording | null>(null);

  // keep SEPARATE refs for intervals
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const meterIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isStartingRef = useRef(false);

  const formatTime = (totalSeconds: number) => {
    const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
      2,
      "0"
    );
    const secs = String(totalSeconds % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  const updateWaveform = (newValue: number) => {
    // newValue expected 0..1
    setLevels((prev) => {
      const updated = [...prev.slice(1), newValue];
      updated.forEach((val, i) => {
        Animated.timing(animValues[i], {
          toValue: MIN_BAR + (MAX_BAR - MIN_BAR) * val,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false, // height cannot use native driver
        }).start();
      });
      return updated;
    });
  };

  const startTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      // ⏱ increment once per second
      setTimer((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const startMetering = () => {
    if (meterIntervalRef.current) clearInterval(meterIntervalRef.current);
    meterIntervalRef.current = setInterval(async () => {
      if (!recordingRef.current) return;
      const status = await recordingRef.current.getStatusAsync();
      // status.metering is in dB; ~[-160, 0]
      if (status?.isRecording && status?.metering !== undefined) {
        const db = status.metering; // -160 .. 0
        const clamped = Math.max(-60, Math.min(0, db)); // focus on useful range
        const normalized = (clamped + 40) / 40; // 0..1
        updateWaveform(normalized);
      }
    }, 100);
  };

  const stopMetering = () => {
    if (meterIntervalRef.current) {
      clearInterval(meterIntervalRef.current);
      meterIntervalRef.current = null;
    }
  };

  const collapseBars = () => {
    animValues.forEach((v) =>
      Animated.timing(v, {
        toValue: MIN_BAR,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start()
    );
  };

  const startRecording = async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Microphone permission is required.");
        return;
      }

      // cleanup any earlier session
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch {}
        recordingRef.current = null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      recordingRef.current = recording;

      // state
      setStatusMessage("Listening...");
      setIsRecording(true);
      setIsPaused(false);
      setTimer(0);

      // run loops
      startTimer();
      startMetering();
    } catch (e) {
      console.error("Start recording error:", e);
    } finally {
      isStartingRef.current = false;
    }
  };

  const pauseRecording = async () => {
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.pauseAsync();
      stopTimer();
      stopMetering();
      setIsPaused(true);
      setStatusMessage("Paused");
      collapseBars(); // visually collapse like WhatsApp
    } catch (e) {
      console.error("Pause error:", e);
    }
  };

  const resumeRecording = async () => {
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.startAsync(); // resumes a paused recording in expo-av
      setIsPaused(false);
      setStatusMessage("Resumed");
      startTimer();
      startMetering();
    } catch (e) {
      console.error("Resume error:", e);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return null;

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      stopTimer();
      stopMetering();
      setIsRecording(false);
      setIsPaused(false);
      setStatusMessage("Stopped");
      collapseBars();

      recordingRef.current = null;
      return uri ?? null;
    } catch (e) {
      console.error("Stop error:", e);
      return null;
    }
  };

  useEffect(() => {
    if (!permissionResponse) {
      requestPermission();
    } else if (!permissionResponse.granted) {
      Alert.alert("Permission Denied", "Microphone permission is required.");
    }

    return () => {
      stopTimer();
      stopMetering();
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isRecording,
    isPaused,
    statusMessage,
    timer,
    setTimer, // keep for your screen
    formatTime,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    animValues, // for bars
  };
};
