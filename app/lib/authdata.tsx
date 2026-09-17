import AsyncStorage from "@react-native-async-storage/async-storage";

export type UserData = { username: string; id?: string | number; practice_id?: string | number };
const saveUserData = async (username: string, id?: string | number, _password?: string, practice_id?: string | number) => {
  const userData: UserData = { username, id, practice_id };
  await AsyncStorage.setItem("userdata", JSON.stringify(userData));
};
const getUserData = async (): Promise<UserData | null> => {
  try {
    const value = await AsyncStorage.getItem("userdata");
    if (value !== null) {
      const userData = JSON.parse(value);
      if (!userData || typeof userData !== "object" || typeof userData.username !== "string") return null;
      if (Object.prototype.hasOwnProperty.call(userData, "password")) {
        delete userData.password;
        await AsyncStorage.setItem("userdata", JSON.stringify(userData));
      }
      return userData;
    }
  } catch { return null; }
  return null;
};
export { getUserData, saveUserData };
