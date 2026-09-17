import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "axios";
import { baseURL } from "constants/base";

const instance = create({
  baseURL,
  timeout: 30000,
});

// Attach token dynamically
instance.interceptors.request.use(async (config) => {
  const requestPath = config.url?.replace(/^\//, "");
  const isLoginRequest = requestPath === "auth/token";

  // Login must never wait for local storage or carry an expired bearer token.
  if (isLoginRequest) {
    delete config.headers.Authorization;
    return config;
  }

  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
