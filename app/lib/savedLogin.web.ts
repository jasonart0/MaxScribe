import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SavedLogin { email: string; password: string }
interface BrowserPassword extends Credential { password: string }
type PasswordConstructor = new (data: { id: string; password: string }) => BrowserPassword;
const PasswordCredential = typeof window !== "undefined"
  ? (window as Window & { PasswordCredential?: PasswordConstructor }).PasswordCredential
  : undefined;
const KEY = "maxscribe.saved-login-email";
export const supportsSavedPassword = !!PasswordCredential && typeof navigator !== "undefined"
  && typeof navigator.credentials?.store === "function"
  && typeof navigator.credentials?.get === "function" && window.isSecureContext
  && window.self === window.top;

export async function getSavedLogin(): Promise<SavedLogin | null> {
  const email = await AsyncStorage.getItem(KEY);
  if (!email) return null;
  if (!supportsSavedPassword) return { email, password: "" };
  try {
    const credential = await navigator.credentials.get({ password: true, mediation: "silent" } as CredentialRequestOptions);
    if (credential?.type === "password" && credential.id === email) {
      return { email, password: (credential as BrowserPassword).password };
    }
  } catch { /* Autofill still works if the browser declines silent retrieval. */ }
  return { email, password: "" };
}

export async function saveLoginCredentials(email: string, password: string) {
  if (!supportsSavedPassword || !PasswordCredential) throw new Error("Use your browser's password manager to save this password.");
  try {
    await navigator.credentials.store(new PasswordCredential({ id: email, password }));
  } catch (error) {
    // Browsers may expose this API but deny it in embedded or restricted pages.
    if (error instanceof Error && ["NotAllowedError", "SecurityError", "NotSupportedError"].includes(error.name)) return false;
    throw error;
  }
  // Persist only the email and preference; the browser manages the password.
  await AsyncStorage.setItem(KEY, email);
  return true;
}

export async function clearSavedLogin() {
  await AsyncStorage.removeItem(KEY);
  // The app no longer retrieves credentials once its saved email is removed.
  // Browser mediation is best effort and does not control the app preference.
  if (supportsSavedPassword && typeof navigator.credentials.preventSilentAccess === "function") {
    await navigator.credentials.preventSilentAccess().catch(() => {});
  }
}
