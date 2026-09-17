import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "constants/Colors";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function MedicationCard({ items = [] }: { items?: string[] }) {
  if (items.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Medication</Text>
      {items.map((txt, idx) => (
        <View key={idx} style={styles.item}>
          <MaterialIcons name="check-circle" size={18} color={COLORS.success} />
          <Text style={styles.itemText}>{txt}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  item: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  itemText: { marginLeft: 8, fontSize: 14, color: COLORS.text },
});
