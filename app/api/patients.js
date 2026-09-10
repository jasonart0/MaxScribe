import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserData } from "lib/authdata";
import axios from "./axiosInstance";

export const fetchPatients = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    const user = await getUserData(); // Retrieve username and id
    const response = await axios.post(
      "search/patient",
      {
        param_list: [{ name: "user_name", value: user.username }],
        criteria: "",
        option: "LATEST_OPENED",
        pageIndex: 0,
        pageSize: 0,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // ✅ Return the actual patient array directly
    return Array.isArray(response.data)
      ? response.data
      : response.data?.data || [];
  } catch (error) {
    console.error(
      "❌ Fetch patients error:",
      error?.response?.data || error.message
    );
    return [];
  }
};
export const fetchPatientsbySearch = async (text) => {
  try {
    const token = await AsyncStorage.getItem("token");
    const user = await getUserData(); // Retrieve username and id
    const response = await axios.post(
      "/search/patient",
      {
        param_list: [{ name: user.username || "criteria", value: text }],
        pageIndex: 0,
        pageSize: 0,
        option: "DEFAULT",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    // ✅ Return the actual patient array directly
    return Array.isArray(response.data)
      ? response.data
      : response.data?.data || [];
  } catch (error) {
    console.error(
      "❌ Fetch patients error:",
      error?.response?.data || error.message
    );
    return [];
  }
};
export const fetchPatientHistory = async (id) => {
  try {
    const response = await axios.get(
      `encounter/getPatientScribeData?patient_id=${id}`
    );

    return response.data;
  } catch (error) {
    console.error("Error saving scribe data:", error);
    throw error;
  }
};
