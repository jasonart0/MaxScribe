import React, { type ReactNode, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { faildMessage } from "@lib";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { getUserData } from "lib/authdata";
import { clearPatientImageCache } from "hooks/usePatientImage";
import AvatarInitials from "./Avatar";
import BlueGradient from "./BlueGradient";

const HeaderTitle = ({ title = "", titleContent, showback = true, showlogout = true, children }: {
  title?: string;
  titleContent?: ReactNode;
  showback?: boolean;
  showlogout?: boolean;
  children?: ReactNode;
}) => {
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
    <View style={styles.header}>
      <BlueGradient />
      <View style={styles.topBar}>
        {showback ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={0.55}
            hitSlop={8}
            style={styles.actionButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={27} color="#FFFFFF" />
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

        {titleContent ? (
          <View style={styles.titleContent}>{titleContent}</View>
        ) : (
          <Text style={styles.title} numberOfLines={1}>
            {title || "Patient"}
          </Text>
        )}

        {showlogout ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Log out"
            activeOpacity={0.55}
            hitSlop={8}
            style={styles.actionButtonRight}
            onPress={async () => {
              try {
                await AsyncStorage.multiRemove(["token", "userdata"]);
                clearPatientImageCache();
                navigation.reset({ index: 0, routes: [{ name: "Login" }] });
              } catch {
                faildMessage("Unable to log out. Please try again.");
              }
            }}
          >
            <Ionicons name="log-out-outline" size={23} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.actionButtonRight} />
        )}
      </View>
      {children ? <View style={styles.headerContent}>{children}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    overflow: "hidden",
    backgroundColor: "#2B69C1",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 72,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerContent: { paddingBottom: 14 },
  actionButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonRight: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrap: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBlue: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
  },
  title: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  titleContent: { flex: 1, minWidth: 0 },
});

export default HeaderTitle;
