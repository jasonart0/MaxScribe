// api/voice.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { baseURL } from "constants/base";
import { Platform } from "react-native";
import RNFS from "react-native-fs";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export const uploadVoiceFile = async (filePath: string, options = {}) => {
  // Always normalize to "file://"
  const normalizedPath =
    Platform.OS === "android" && !filePath.startsWith("file://")
      ? `file://${filePath}`
      : filePath;

  // RNFS needs the path without "file://"
  const cleanPath = normalizedPath.replace("file://", "");

  const fileExists = await RNFS.exists(cleanPath);
  if (!fileExists) {
    throw new Error("Recorded file does not exist.");
  }

  const stats = await RNFS.stat(cleanPath);
  const fileSize = stats.size;
  const sizeInMB = (fileSize / (1024 * 1024)).toFixed(2);
  console.log(`🎤 File size: ${sizeInMB} MB`);

  if (fileSize > MAX_FILE_SIZE) {
    throw new Error(
      "Audio file exceeds 25MB limit. Please record a shorter note."
    );
  }

  // Pass the normalized (with file://) path to sendToAPI
  return await sendToAPI(normalizedPath, options);
};

export const sendToAPI = async (uri, options = {}) => {
  const formData = new FormData();

  // Extract extension
  const fileExtension = (uri.split(".").pop() || "").toLowerCase();
  const mimeTypeMap = {
    wav: "audio/wav",
    mp3: "audio/mpeg",
    m4a: "audio/m4a",
    aac: "audio/aac",
    mp4: "audio/mp4",
    caf: "audio/m4a",
  };
  const mimeType = mimeTypeMap[fileExtension] || "audio/m4a";
  const fileName = `recording.${fileExtension}`;

  // 👇 DO NOT strip file:// here – fetch expects it!
  formData.append("audioFile", {
    uri, // full "file://..." path
    name: fileName,
    type: mimeType,
  });

  const token = await AsyncStorage.getItem("token");

  console.log("📝 Uploading file:", { uri, fileName, mimeType });

  try {
    const response = await fetch(`${baseURL}/ai-assistant/transcribeAudio`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        // ⚠️ don't set Content-Type manually, RN will add boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errText}`);
    }

    const result = await response.json();
    console.log("✅ API Response:", result);
    return result?.data?.text || "";
  } catch (err) {
    console.error("❌ Upload failed:", err);
    throw err;
  }
};

export const generateChat = async (transcript) => {
  const token = await AsyncStorage.getItem("token");

  const aiAssistantRequestModel = {
    action: "TRANSCRIPT_TO_CONVERSATION",
    data_setting: { content: transcript },
  };

  const formData = new FormData();
  formData.append("ai_request", JSON.stringify(aiAssistantRequestModel));

  try {
    const response = await fetch(`${baseURL}/ai-assistant/processRequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`generateAINotes failed: ${response.status}`);
    }
    const result = await response.json();
    const raw = result?.data?.content?.conversation || [];
    return raw;
  } catch (err) {
    console.error("❌ generateAINotes failed →", err);
    throw err;
  }
};
const safeParseJson = (val) => {
  if (!val) return {};
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    // if backend returns non-JSON string, wrap it
    return { text: String(val) };
  }
};

export const generateAINotes = async (transcript, patientId) => {
  const token = await AsyncStorage.getItem("token");

  const aiAssistantRequestModel = {
    action: "ENCOUNTER_JSON_NOTE",
    data_setting: { content: transcript },
    param_list: [{ name: "patient_id", value: patientId }],
  };

  const formData = new FormData();
  formData.append("ai_request", JSON.stringify(aiAssistantRequestModel));

  try {
    const response = await fetch(`${baseURL}/ai-assistant/processRequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`generateAINotes failed: ${response.status}`);
    }
    const result = await response.json();
    const raw = result?.data?.content;
    return safeParseJson(raw);
  } catch (err) {
    console.error("❌ generateAINotes failed →", err);
    throw err;
  }
};
