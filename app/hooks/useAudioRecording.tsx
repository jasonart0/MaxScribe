import {
    AudioModule,
    RecordingPresets,
    setAudioModeAsync,
    useAudioRecorder,
    useAudioRecorderState,
} from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, Platform } from "react-native";

const MIN_BAR = 2; // px
const MAX_BAR = 80; // px
const BARS = 30;

export const useVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Start speaking...");
  const [timer, setTimer] = useState(0);

  const [animValues] = useState(() =>
    new Array(BARS).fill(0).map(() => new Animated.Value(MIN_BAR))
  );
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const recorderState = useAudioRecorderState(recorder, 100);

  // keep SEPARATE refs for intervals
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  const updateWaveform = useCallback((newValue: number) => {
    // newValue expected 0..1
    animValues.forEach((value, index) => {
      const variation = Math.max(0, Math.min(1, newValue * (0.65 + (index % 5) * 0.08)));
      Animated.timing(value, {
        toValue: MIN_BAR + (MAX_BAR - MIN_BAR) * variation,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    });
  }, [animValues]);

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

  useEffect(() => {
    if (Platform.OS === "web" || !recorderState.isRecording || recorderState.metering == null) return;
    const clamped = Math.max(-60, Math.min(0, recorderState.metering));
    updateWaveform((clamped + 40) / 40);
  }, [recorderState.isRecording, recorderState.metering, updateWaveform]);

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

  const startRecording = useCallback(async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;

    try {
      const { status } = await AudioModule.requestRecordingPermissionsAsync();
      if (status !== "granted") {
        setStatusMessage("Microphone permission is required.");
        Alert.alert("Permission Denied", "Microphone permission is required.");
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();

      // state
      setStatusMessage("Listening...");
      setIsRecording(true);
      setIsPaused(false);
      setTimer(0);

      // run loops
      startTimer();
    } catch (e) {
      setStatusMessage("Unable to start recording.");
      console.error("Start recording error:", e);
    } finally {
      isStartingRef.current = false;
    }
  }, [recorder]);

  const pauseRecording = async () => {
    try {
      recorder.pause();
      stopTimer();
      setIsPaused(true);
      setStatusMessage("Paused");
      collapseBars(); // visually collapse like WhatsApp
    } catch (e) {
      console.error("Pause error:", e);
    }
  };

  const resumeRecording = async () => {
    try {
      recorder.record();
      setIsPaused(false);
      setStatusMessage("Resumed");
      startTimer();
    } catch (e) {
      console.error("Resume error:", e);
    }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();
      const uri = recorder.uri;

      stopTimer();
      setIsRecording(false);
      setIsPaused(false);
      setStatusMessage("Stopped");
      collapseBars();

      return uri ?? null;
    } catch (e) {
      console.error("Stop error:", e);
      return null;
    }
  };

  useEffect(() => {
    return () => {
      stopTimer();
      if (recorder.isRecording) recorder.stop().catch(() => {});
    };
  }, [recorder]);

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
