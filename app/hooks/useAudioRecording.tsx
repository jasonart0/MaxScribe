import {
    RecordingPresets,
    requestRecordingPermissionsAsync,
    setAudioModeAsync,
    useAudioRecorder,
    useAudioRecorderState,
} from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";

// Speech-optimized AAC stays widely compatible with transcription services while
// using substantially less bandwidth than Expo's 128 kbps stereo default.
const compressedSpeechPreset = {
  ...RecordingPresets.LOW_QUALITY,
  extension: ".m4a",
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 48000,
  android: {
    ...RecordingPresets.LOW_QUALITY.android,
    extension: ".m4a",
    outputFormat: "mpeg4" as const,
    audioEncoder: "aac" as const,
  },
  web: {
    ...RecordingPresets.LOW_QUALITY.web,
    bitsPerSecond: 48000,
  },
};

export const useVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [completedDuration, setCompletedDuration] = useState(0);
  const busyRef = useRef(false);
  const sessionRef = useRef(false);
  const recorder = useAudioRecorder({
    ...compressedSpeechPreset,
    isMeteringEnabled: true, // Read microphone levels for the visual waves only.
  }, (status) => {
    if (status.hasError || status.mediaServicesDidReset) {
      sessionRef.current = false;
      setIsRecording(false);
      setIsPaused(false);
      setRecordingError(status.error || "Recording was interrupted. Please record again.");
    }
  });
  const recorderState = useAudioRecorderState(recorder, 100);

  const startRecording = useCallback(async () => {
    if (busyRef.current || sessionRef.current) return false;
    busyRef.current = true;
    setIsBusy(true);
    setRecordingError(null);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) throw new Error("Allow microphone access to record audio.");
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      setCompletedDuration(0);
      sessionRef.current = true;
      recorder.record();
      setIsRecording(true);
      setIsPaused(false);
      return true;
    } catch (error) {
      if (sessionRef.current) await recorder.stop().catch(() => {});
      sessionRef.current = false;
      setRecordingError(error instanceof Error ? error.message : "Unable to start recording.");
      return false;
    } finally {
      busyRef.current = false;
      setIsBusy(false);
    }
  }, [recorder]);

  const pauseRecording = async () => {
    if (busyRef.current || !sessionRef.current) return;
    setRecordingError(null);
    try {
      recorder.pause();
      setIsPaused(true);
    } catch (error) {
      setRecordingError(error instanceof Error ? error.message : "Unable to pause recording.");
    }
  };

  const resumeRecording = async () => {
    if (busyRef.current || !sessionRef.current) return;
    setRecordingError(null);
    try {
      recorder.record();
      setIsPaused(false);
    } catch (error) {
      setRecordingError(error instanceof Error ? error.message : "Unable to resume recording.");
    }
  };

  const stopRecording = async () => {
    if (busyRef.current || !sessionRef.current) return null;
    busyRef.current = true;
    setIsBusy(true);
    setRecordingError(null);
    try {
      // iOS resets Expo's duration counter when stop() finishes.
      const duration = recorder.getStatus().durationMillis;
      await recorder.stop();
      sessionRef.current = false;
      if (!recorder.uri) throw new Error("No recording was saved. Please record again.");
      setCompletedDuration(duration);
      return recorder.uri;
    } catch (error) {
      await recorder.stop().catch(() => {});
      setRecordingError(error instanceof Error ? error.message : "Unable to save recording.");
      return null;
    } finally {
      sessionRef.current = false;
      setIsRecording(false);
      setIsPaused(false);
      busyRef.current = false;
      setIsBusy(false);
    }
  };

  useEffect(() => () => {
    if (sessionRef.current) void recorder.stop().catch(() => {});
    sessionRef.current = false;
  }, [recorder]);

  const timer = Math.floor((isRecording ? recorderState.durationMillis : completedDuration) / 1000);
  const formatTime = (seconds: number) => [
    Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60,
  ].map((value) => String(value).padStart(2, "0")).join(":");
  const statusMessage = isPaused ? "Paused" : isRecording ? "Recording..." : "Ready to record";

  return { isRecording, isPaused, isBusy, recordingError, statusMessage, timer,
    metering: recorderState.metering,
    formatTime, startRecording, pauseRecording, resumeRecording, stopRecording };
};
