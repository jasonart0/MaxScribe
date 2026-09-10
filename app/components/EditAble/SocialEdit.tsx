import React from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

interface SocialHistory {
  alcohol_use: string;
  smoking_status_code: string;
  smoking_status_description: string;
  notes?: string;
}

interface Props {
  history: SocialHistory[]; // array of histories
  setHistory: (updatedHistory: SocialHistory[]) => void; // callback style
}

export default function SocialHistoryForm({ history, setHistory }: Props) {
  console.log("Rendering SocialHistoryForm with history:", history);
  
  const handleChange = (
    index: number,
    field: keyof SocialHistory,
    value: string
  ) => {
    const updated = [...history];
    updated[index] = { ...updated[index], [field]: value };
    setHistory(updated); // send back to parent
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {history.map((item, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.label}>Alcohol Use</Text>
          <TextInput
            style={styles.input}
            value={item.alcohol_use}
            onChangeText={(text) => handleChange(index, "alcohol_use", text)}
          />

          <Text style={styles.label}>Smoking Status</Text>
          <TextInput
            style={styles.input}
            value={item.smoking_status_description}
            onChangeText={(text) =>
              handleChange(index, "smoking_status_description", text)
            }
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            multiline
            value={item.notes || ""}
            onChangeText={(text) => handleChange(index, "notes", text)}
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
  label: { fontWeight: "bold", marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
});
