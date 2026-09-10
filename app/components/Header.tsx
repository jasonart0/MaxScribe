import { COLORS } from "constants/Colors";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Header({ name, initials }) {
  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.chip}>
          <Text style={styles.chipText}>Emergency</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.deep,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFF", fontSize: 18, fontWeight: "600" },
  details: { marginLeft: 12 },
  name: { fontSize: 18, fontWeight: "600", color: COLORS.text },
  chip: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#FFE5E5",
  },
  chipText: { color: COLORS.danger, fontSize: 12, fontWeight: "500" },
});
