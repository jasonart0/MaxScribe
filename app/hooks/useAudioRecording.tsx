import {
    RecordingPresets,
    requestRecordingPermissionsAsync,
    setAudioModeAsync,
    useAudioRecorder,
    useAudioRecorderState,
} from "expo-audio";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useCallback, useEffect, useRef, useState } from "react";

const RECORDING_KEEP_AWAKE_TAG = "MaxScribeVoiceRecording";

// 12 kbps mono audio is about 1.8 MB for a 20-minute visit. iOS records Opus
// in a CAF container and browsers use WebM/Opus. Expo Audio does not expose
// Android's native Opus encoder, so Android retains an upload-compatible AAC
// fallback at the same speech-oriented sample rate and target bitrate.
const compressedSpeechPreset = {
  ...RecordingPresets.LOW_QUALITY,
  extension: ".caf",
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 12000,
  android: {
    ...RecordingPresets.LOW_QUALITY.android,
    extension: ".m4a",
    outputFormat: "mpeg4" as const,
    audioEncoder: "aac" as const,
  },
  ios: {
    audioQuality: 0x60,
    extension: ".caf",
    outputFormat: "opus",
    sampleRate: 16000,
  },
  web: {
    ...RecordingPresets.LOW_QUALITY.web,
    mimeType: "audio/webm;codecs=opus",
    bitsPerSecond: 12000,
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

  useEffect(() => {
    if (!isRecording) return;

    void activateKeepAwakeAsync(RECORDING_KEEP_AWAKE_TAG).catch(() => {});
    return () => {
      void deactivateKeepAwake(RECORDING_KEEP_AWAKE_TAG).catch(() => {});
    };
  }, [isRecording]);

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
