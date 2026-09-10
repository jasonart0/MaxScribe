import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { baseURL } from "constants/base";

const instance = axios.create({
  baseURL: baseURL,
  timeout: 10000,
   
});

// Attach token dynamically
instance.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
