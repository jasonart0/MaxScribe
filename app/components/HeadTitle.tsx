import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { setHeight } from "@lib";
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
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.actionButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={27} color={COLORS.deep} />
        </TouchableOpacity>
      ) : (
        <View style={styles.actionButton} />
      )}
      <Text style={styles.title} numberOfLines={1}>
        {title || "Patient"}
      </Text>
      {showlogout ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Log out"
          style={styles.actionButton}
          onPress={async () => {
            await AsyncStorage.setItem("token", "");
            await saveUserData("", "", "", "");
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          }}
        >
          <Ionicons name="log-out-outline" size={setHeight(2.8)} color={COLORS.deep} />
        </TouchableOpacity>
      ) : (
        <View style={styles.actionButton} />
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 64,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
  },
  actionButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    color: COLORS.deep,
    fontSize: 19,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
export default HeaderTitle;
