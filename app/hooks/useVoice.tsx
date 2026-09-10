import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useState } from "react";

function useVoice() {
  const [started, setStarted] = useState(false);
  const [results, setResults] = useState<string>("");
  const [finalResult, setFinalResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // 🔹 Event listeners from expo-speech-recognition
  useSpeechRecognitionEvent("start", () => setStarted(true));
  useSpeechRecognitionEvent("end", () => setStarted(false));
  useSpeechRecognitionEvent("error", (event) => {
    setError(event.error);
    // auto-restart if needed
    _startRecognizing();
  });
  useSpeechRecognitionEvent("result", (event) => {
    if (event.results?.length) {
      // ✅ get the latest recognized phrase only
      const latest = event.results[event.results.length - 1].transcript;
      setResults(latest);
    }
    // setResults(event.results[0]?.transcript ?? "");
  });
  useSpeechRecognitionEvent("partialResults", (event) => {
    setResults(event.results[0]?.transcript ?? "");
  });

  // 🔹 Start recognition
  const _startRecognizing = async () => {
    _clearState();
    try {
      await ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: true,
      });
    } catch (e) {
      console.log("Start error", e);
    }
  };

  // 🔹 Stop recognition
  const _stopRecognizing = async () => {
    try {
      setFinalResult(results);
      await ExpoSpeechRecognitionModule.stop();
      setFinalResult("");
      _clearState();
    } catch (e) {
      console.log("Stop error", e);
    }
  };

  // 🔹 Destroy (not strictly needed in Expo, but useful to reset)
  const _destroyRecognizer = async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
    } catch (e) {}
    _clearState();
  };

  // 🔹 Clear state only
  const _clearState = () => {
    setStarted(false);
    setResults("");
    setError(null);
  };

  // 🔹 Clear results + restart
  const clearResults = async () => {
    await _stopRecognizing();
    await _destroyRecognizer();
  };

  return {
    started,
    results,
    error,
    _startRecognizing,
    _stopRecognizing,
    _destroyRecognizer,
    clearResults,
    finalResult,
  };
}

export default useVoice;
