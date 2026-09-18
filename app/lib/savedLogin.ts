import * as SecureStore from "expo-secure-store";

const KEY = "maxscribe.saved-login";
export const supportsSavedPassword = true;
export interface SavedLogin { email: string; password: string }

export async function getSavedLogin(): Promise<SavedLogin | null> {
  const value = await SecureStore.getItemAsync(KEY);
  if (!value) return null;
  try {
    const data = JSON.parse(value);
    return typeof data.email === "string" && typeof data.password === "string" ? data : null;
  } catch { return null; }
}

export async function saveLoginCredentials(email: string, password: string) {
  await SecureStore.setItemAsync(KEY, JSON.stringify({ email, password }), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return true;
}

export async function clearSavedLogin() {
  await SecureStore.deleteItemAsync(KEY);
}
