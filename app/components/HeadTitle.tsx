import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { faildMessage } from "@lib";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "constants/Colors";
import { getUserData } from "lib/authdata";
import AvatarInitials from "./Avatar";

const HeaderTitle = ({ title = "", showback = true, showlogout = true }) => {
  const navigation = useNavigation();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    let mounted = true;

    getUserData()
      .then((user) => {
        if (mounted) setUserName(user?.username ?? "");
      })
      .catch(() => { /* ignore */ });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={styles.topBar}>
      {showback ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.actionButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.avatarWrap}>
          <AvatarInitials
            name={userName || "User"}
            size={36}
            fontSize={13}
            color="#FFFFFF"
            style={styles.avatarBlue}
          />
        </View>
      )}

      <Text style={styles.title} numberOfLines={1}>
        {title || "Patient"}
      </Text>

      {showlogout ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Log out"
          style={styles.actionButtonRight}
          onPress={async () => {
            try {
              await AsyncStorage.multiRemove(["token", "userdata"]);
              navigation.reset({ index: 0, routes: [{ name: "Login" }] });
            } catch {
              faildMessage("Unable to log out. Please try again.");
            }
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.actionButtonRight} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 72,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "transparent",
  },
  actionButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 1,
    borderColor: "rgba(29,115,188,0.18)",
  },
  actionButtonRight: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 1,
    borderColor: "rgba(29,115,188,0.18)",
  },
  avatarWrap: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBlue: {
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
  },
  title: {
    flex: 1,
    color: COLORS.deep,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
});

export default HeaderTitle;
