import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SavedLogin { email: string; password: string }
interface BrowserPassword extends Credential { password: string }
type PasswordConstructor = new (data: { id: string; password: string }) => BrowserPassword;
const PasswordCredential = typeof window !== "undefined"
  ? (window as Window & { PasswordCredential?: PasswordConstructor }).PasswordCredential
  : undefined;
const KEY = "maxscribe.saved-login-email";
export const supportsSavedPassword = !!PasswordCredential && typeof navigator !== "undefined"
  && !!navigator.credentials && window.isSecureContext;

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
  await navigator.credentials.store(new PasswordCredential({ id: email, password }));
  // Persist only the email and preference; the browser manages the password.
  await AsyncStorage.setItem(KEY, email);
}

export async function clearSavedLogin() {
  await AsyncStorage.removeItem(KEY);
  if (supportsSavedPassword) await navigator.credentials.preventSilentAccess();
}
