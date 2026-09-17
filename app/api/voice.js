// Recorded audio is transcribed by the backend, never by device speech recognition.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { baseURL } from "constants/base";
import { Platform } from "react-native";
import { assertApiSuccess, unwrapData } from "./response";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const safeParseJson = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const requestAssistant = async (endpoint, formData) => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("Your session has expired. Please sign in again.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);
  let response;
  let result;
  try {
    response = await fetch(`${baseURL}/ai-assistant/${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        // Let fetch add the multipart boundary on both native and web.
      },
      body: formData,
      signal: controller.signal,
    });
    result = safeParseJson(await response.text());
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("AI processing timed out. Please try again.");
    throw new Error("Unable to reach the AI service. Check your connection and try again.");
  } finally { clearTimeout(timeout); }
  if (!response.ok || result?.success === false) {
    if (response.status === 401) throw new Error("Your session has expired. Please sign in again.");
    const message = result?.message || result?.error?.message;
    throw new Error(
      typeof message === "string"
        ? message
        : `${endpoint === "transcribeAudio" ? "Audio transcription" : "AI processing"} failed (${response.status}). Please try again.`
    );
  }
  assertApiSuccess(result);
  return result;
};

export const uploadVoiceFile = async (filePath, options = {}) => {
  if (typeof filePath !== "string" || !filePath.trim()) {
    throw new Error("No recording found. Please record your audio again.");
  }
  if (Platform.OS === "web") {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error("Recorded file could not be read.");
    return sendToAPI(filePath, { ...options, blob: await response.blob() });
  }
  // Preserve content:// URIs as well as file:// URIs on Android.
  const uri = /^[a-z][a-z\d+.-]*:/i.test(filePath)
    ? filePath
    : `file://${filePath}`;
  return sendToAPI(uri, options);
};

export const sendToAPI = async (uri, options = {}) => {
  const formData = new FormData();
  const blob = Platform.OS === "web"
    ? options.blob || (await (await fetch(uri)).blob())
    : null;
  if (blob && !blob.size) throw new Error("The recording is empty. Please record again.");
  if (blob?.size > MAX_FILE_SIZE) {
    throw new Error("Audio file exceeds 25MB limit. Please record a shorter note.");
  }
  // MediaRecorder MIME types can include codecs (audio/webm;codecs=opus).
  const blobMime = blob?.type?.split(";")[0].toLowerCase();
  const mimeExtensions = {
    "audio/webm": "webm",
    "video/webm": "webm",
    "audio/ogg": "ogg",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/aac": "aac",
  };
  const fileExtension = blob
    ? mimeExtensions[blobMime] || "webm"
    : uri.split(/[?#]/)[0].match(/\.([a-z\d]+)$/i)?.[1]?.toLowerCase() || "m4a";
  const mimeTypes = {
    wav: "audio/wav", mp3: "audio/mpeg", m4a: "audio/mp4",
    aac: "audio/aac", mp4: "audio/mp4", caf: "audio/x-caf",
    webm: "audio/webm", ogg: "audio/ogg", "3gp": "audio/3gpp",
  };
  const name = `recording.${fileExtension}`;
  if (blob) {
    formData.append("audioFile", blob, name);
  } else {
    formData.append("audioFile", { uri, name, type: mimeTypes[fileExtension] || "audio/mp4" });
  }
  const result = await requestAssistant("transcribeAudio", formData);
  const data = safeParseJson(result?.data ?? result);
  const content = safeParseJson(data?.content);
  const transcript = typeof data === "string" ? data
    : data?.text ?? data?.transcription ?? data?.transcript
      ?? content?.text ?? content?.transcription ?? content?.transcript
      ?? (typeof content === "string" ? content : "");
  if (typeof transcript !== "string" || !transcript.trim()) {
    throw new Error("No transcript was returned. Please record clear audio and try again.");
  }
  return transcript.trim();
};

const processRequest = async (model) => {
  const formData = new FormData();
  formData.append("ai_request", JSON.stringify(model));
  return requestAssistant("processRequest", formData);
};

export const generateChat = async (transcript) => {
  if (typeof transcript !== "string" || !transcript.trim()) throw new Error("No transcript is available to process.");
  const result = await processRequest({
    action: "TRANSCRIPT_TO_CONVERSATION",
    data_setting: { content: transcript },
  });
  const content = safeParseJson(unwrapData(result)?.content);
  const conversation = safeParseJson(content?.conversation ?? content);
  if (!Array.isArray(conversation) || !conversation.length || conversation.some((item) => typeof item?.speaker !== "string" || typeof item?.text !== "string")) {
    throw new Error("The conversation could not be generated. Your transcript is still available.");
  }
  return conversation;
};

export const generateAINotes = async (transcript, patientId) => {
  if (typeof transcript !== "string" || !transcript.trim()) throw new Error("No transcript is available to process.");
  if (patientId == null || String(patientId).trim() === "") throw new Error("No patient was selected. Please select a patient again.");
  const result = await processRequest({
    action: "ENCOUNTER_JSON_NOTE",
    data_setting: { content: transcript },
    param_list: [{ name: "patient_id", value: patientId }],
  });
  const content = safeParseJson(unwrapData(result)?.content);
  if (!content || Array.isArray(content) || (typeof content === "object" && !Object.keys(content).length)) throw new Error("No clinical notes were returned. Please try again.");
  return typeof content === "string" ? { text: content } : content;
};
