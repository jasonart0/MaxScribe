import AsyncStorage from "@react-native-async-storage/async-storage";

const saveUserData = async (username, id, password, practice_id) => {
  try {
    const userData = { username, id, password, practice_id };
    await AsyncStorage.setItem("userdata", JSON.stringify(userData));
  } catch (error) {
    console.log("Error saving data", error);
  }
};
const getUserData = async () => {
  try {
    const value = await AsyncStorage.getItem("userdata");
    if (value !== null) {
      const userData = JSON.parse(value);
      return userData;
    }
  } catch (error) {
    console.log("Error reading data", error);
  }
};
export { getUserData, saveUserData };
