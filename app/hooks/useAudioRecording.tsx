import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";

// All platforms use Expo's default recording preset and microphone input.
export const useVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true, // Read microphone levels for the visual waves only.
  });
  const recorderState = useAudioRecorderState(recorder, 100);
  const busyRef = useRef(false);
  const sessionRef = useRef(false);

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
      await recorder.stop();
      sessionRef.current = false;
      if (!recorder.uri) throw new Error("No recording was saved. Please record again.");
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

  const timer = Math.floor(recorderState.durationMillis / 1000);
  const formatTime = (seconds: number) => [
    Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60,
  ].map((value) => String(value).padStart(2, "0")).join(":");
  const statusMessage = isPaused ? "Paused" : isRecording ? "Recording..." : "Ready to record";

  return { isRecording, isPaused, isBusy, recordingError, statusMessage, timer,
    metering: recorderState.metering,
    formatTime, startRecording, pauseRecording, resumeRecording, stopRecording };
};
