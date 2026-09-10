import React from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";

export default function FamilyHistoryEditor({
  familyHistory,
  setFamilyHistory,
}) {
  const handleChange = (index: number, key: string, value: string) => {
    const updated = [...familyHistory];
    updated[index][key] = value;
    setFamilyHistory(updated);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {familyHistory.map((entry, index) => (
        <View key={index} style={styles.card}>

          <TextInput
            style={styles.input}
            value={entry.code}
            placeholder="Code (e.g. J44.9)"
            onChangeText={(text) => handleChange(index, "code", text)}
          />
          <TextInput
            style={styles.input}
            multiline
            value={entry.code_description}
            placeholder="Code Description"
            onChangeText={(text) =>
              handleChange(index, "code_description", text)
            }
          />
          <TextInput
            style={styles.input}
            value={entry.relationship}
            placeholder="Relationship"
            onChangeText={(text) => handleChange(index, "relationship", text)}
          />
          <TextInput
            style={styles.input}
            value={entry.relationship_code}
            placeholder="Relationship Code (e.g. FTH, MTH)"
            onChangeText={(text) =>
              handleChange(index, "relationship_code", text)
            }
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  heading: { fontWeight: "bold", marginBottom: 8, fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
    fontSize: 14,
  },
});
