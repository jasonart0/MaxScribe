import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { saveUserData } from "lib/authdata";
import axios from "./axiosInstance";
import { apiErrorMessage, assertApiSuccess, unwrapData } from "./response";

export const getUserPracticeID = async (token) => {
  const formData = new FormData();
  formData.append("token", token);
  const isBrowser = typeof document !== "undefined";
  const response = await axios.post("/auth/token/parse", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      // Browsers must generate the multipart boundary themselves.
      ...(!isBrowser ? { "Content-Type": "multipart/form-data" } : {}),
    },
  });
  assertApiSuccess(response.data);
  const data = unwrapData(response.data);
  if (data?.practice_id == null || String(data.practice_id).trim() === "") {
    throw new Error("No practice is assigned to this account. Please contact your administrator.");
  }
  return data;
};

export const loginUser = async (username, password) => {
  let tokenStored = false;
  try {
    const response = await axios.post("/auth/token", {
      app: "EHR",
      client_time_stamp: dayjs().format("YYYY-MM-DD HH:mm:ss.SSS"),
      username,
      password,
    });
    assertApiSuccess(response.data);
    const data = unwrapData(response.data);
    if (typeof data?.access_token !== "string" || !data.access_token.trim()) {
      throw new Error("Login failed: no valid token received.");
    }
    await AsyncStorage.setItem("token", data.access_token);
    tokenStored = true;
    const practice = await getUserPracticeID(data.access_token);
    await saveUserData(username, practice.user_id ?? data.id, undefined, practice.practice_id);
    return { success: true, token: data.access_token };
  } catch (error) {
    if (tokenStored) await AsyncStorage.multiRemove(["token", "userdata"]).catch(() => {});
    const status = error?.response?.status;
    const message = status === 401 && !tokenStored
      ? "Incorrect email or password."
      : apiErrorMessage(error, "Login failed. Check your credentials and connection.");
    return { success: false, status, message };
  }
};
