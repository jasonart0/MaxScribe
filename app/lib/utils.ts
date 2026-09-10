import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat"; // Import custom parse format plugin
import utc from "dayjs/plugin/utc"; // Use custom parse format plugin
import * as Crypto from "expo-crypto";
import { Dimensions } from "react-native";
import { showMessage } from "react-native-flash-message";

import * as SecureStore from "expo-secure-store";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen"; // Import UTC plugin
dayjs.extend(utc); // Use UTC plugin
dayjs.extend(customParseFormat);
export const setWidth = (width: number) => {
  return wp(width);
};
export const setHeight = (height: number) => {
  return hp(height);
};
export const setFontSize = (font: number) => {
  let fullHeight = Dimensions.get("window").height;
  if (font >= 100) return fullHeight;
  else if (font <= 0) return 0;
  else return fullHeight * (font / 100);
};
export const successMessage = (message = "success", description = "") => {
  showMessage({
    message: message,
    description: description,
    floating: true,
    type: "success",
    duration: 2000,
  });
};

export const faildMessage = (message = "Error", description = "") => {
  showMessage({
    message: message,
    description: description,
    floating: true,
    type: "danger",
    duration: 2000,
  });
};

export function isNotEmpty(value: any): boolean {
  if (value === null || value === undefined) return false; // Handles null & undefined
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (
      trimmed === "" ||
      trimmed.toLowerCase() === "null" ||
      trimmed.toLowerCase() === "undefined"
    ) {
      return false;
    }
  }
  if (Array.isArray(value) && value.length === 0) return false; // Handles empty array
  if (typeof value === "object" && Object.keys(value || {}).length === 0)
    return false; // Handles empty object
  return true;
}

export async function saveAuthdata(key, value) {
  await SecureStore.setItemAsync(key, value);
}

export async function getValueofAuth(key) {
  let result = await SecureStore.getItemAsync(key);
  if (result) {
    // alert("🔐 Here's your value 🔐 \n" + result);
    return result;
  }
  return null;
}
export const getInitials = (name: string): string => {
  if (!name) return "";

  // Remove content inside parentheses and special characters
  const cleanedName = name
    .replace(/\([^)]*\)/g, "") // remove text in ()
    .replace(/[^a-zA-Z\s]/g, "") // remove non-letter characters
    .trim();

  const words = cleanedName.split(/\s+/);
  const firstInitial = words[0]?.[0] || "";
  const lastInitial = words.length > 1 ? words[words.length - 1][0] : "";

  return (firstInitial + lastInitial).toUpperCase();
};
export function isValidJSON(text) {
  try {
    JSON.parse(text); // Try parsing
    return true; // It's valid JSON
  } catch (error) {
    return false; // Invalid JSON
  }
}
export const loadedImageCache = new Map<string, boolean>();

export const getMD5Hash = async (text: string) => {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.MD5,
    text
  );
  console.log("MD5 Hash:", hash);
  return hash;
};