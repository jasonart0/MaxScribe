import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveUserData } from "lib/authdata";
import axios from "./axiosInstance";

export const loginUser = async (username, password) => {
  try {
    const response = await axios.post("/auth/token", {
      app: "EHR",
      client_time_stamp: new Date().toISOString(),
      username,
      password,
    });
    const token = response.data?.data?.access_token;
    const id = response.data?.data?.id;
    if (!token || typeof token !== "string") {
      console.error("❌ Missing token in response:", response.data);
      return {
        success: false,
        message: "Login failed: no valid token received.",
      };
    }

    await AsyncStorage.setItem("token", token);
    let data = await getUserPracticeID(token);
    console.log("id from token", data?.practice_id);
    const practice_id = data?.practice_id;
    await saveUserData(username, id, password, practice_id);
    return { success: true, token }; // return token for immediate use
  } catch (error) {
    // console.error("❌ Login error:", error?.response?.data || error.message);
    return {
      success: false,
      message:
        error?.response?.data?.message || "Login failed. Check credentials.",
    };
  }
};

export const getUserPracticeID = async (token) => {
  try {
    const formdata = new FormData();
    formdata.append("token", token);
    const response = await axios.post("/auth/parseToken", formdata);

    const practiceID = response.data;
    return practiceID;
  } catch (error) {
    console.log(error);

    // console.error("❌ Login error:", error?.response?.data || error.message);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        "get Practice id  failed. Check credentials.",
    };
  }
};
