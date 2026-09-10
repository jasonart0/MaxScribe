import React from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

interface Props {
  complaints: string[]; // array of complaints (strings)
  setComplaints: (updated: string[]) => void; // callback to update parent
}

export default function ChiefComplaintEdit({ complaints, setComplaints }: Props) {
  const handleChange = (index: number, value: string) => {
    const updated = [...complaints];
    updated[index] = value;
    setComplaints(updated);
  };


  return (
    <ScrollView contentContainerStyle={styles.container}>
      {complaints.map((item, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.label}>Complaint {index + 1}</Text>
          <TextInput
            style={styles.input}
            value={item}
            onChangeText={(text) => handleChange(index, text)}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: {
    marginBottom: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },
  label: { fontWeight: "bold", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
  },
  removeButton: {
    marginTop: 8,
    backgroundColor: "#fdd",
    padding: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  removeText: { color: "#900", fontWeight: "bold" },
  addButton: {
    backgroundColor: "#e6f0ff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addText: { color: "#007AFF", fontWeight: "bold" },
});
