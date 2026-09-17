import { uploadVoiceFile } from "api/voice";
import { useRef, useState } from "react";
import { useVoiceRecorder } from "./useAudioRecording";

// Note dictation follows the same default recording and backend transcription flow.
export default function useVoice() {
  const recorder = useVoiceRecorder();
  const [finalResult, setFinalResult] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false);
  const _startRecognizing = async () => {
    if (processingRef.current) return false;
    setFinalResult("");
    setError(null);
    return recorder.startRecording();
  };
  const clearResults = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setProcessing(true);
    try {
      const uri = await recorder.stopRecording();
      if (!uri) throw new Error("No recording was saved. Please try again.");
      setFinalResult(await uploadVoiceFile(uri));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Dictation failed. Please try again.");
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  };
  const _destroyRecognizer = async () => {
    if (recorder.isRecording) await recorder.stopRecording();
    setFinalResult("");
    setError(null);
  };
  return { started: recorder.isRecording, processing, results: "", finalResult,
    error: error || recorder.recordingError, _startRecognizing, clearResults, _destroyRecognizer };
}
