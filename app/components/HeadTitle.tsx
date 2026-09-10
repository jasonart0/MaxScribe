import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { setHeight, setWidth } from "@lib";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "constants/Colors";
import { saveUserData } from "lib/authdata";
const HeaderTitle = ({ title = "", showback = true, showlogout = true }) => {
  const navigation = useNavigation();
  return (
    <View style={styles.topBar}>
      {showback ? (
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back-ios" size={24} color="black" />
        </TouchableOpacity>
      ) : (
        <View />
      )}
      <Text
        style={{
          color: COLORS.primary,
          fontSize: setHeight(2),
          fontWeight: "600",
          marginLeft: 16,
          alignSelf: "center",
          width:setWidth(64),
        }}
      >
        {title || "Patient"}
      </Text>
      {showlogout ? (
        <TouchableOpacity
          style={styles.backBtn}
          onPress={async () => {
            await AsyncStorage.setItem("token", "");
            await saveUserData("", "", "", "");
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          }}
        >
          <MaterialIcons name="logout" size={setHeight(2.5)} color="black" />
        </TouchableOpacity>
      ) : (
        <View />
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: setHeight(2),
    paddingVertical: setHeight(1),
    backgroundColor: COLORS.background,
  },
  backBtn: {
    borderRadius: 50,
    padding: 12,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    alignContent: "center",
  },
  backIcon: { width: 18, height: 18, tintColor: "#FFF" },
});
export default HeaderTitle;
