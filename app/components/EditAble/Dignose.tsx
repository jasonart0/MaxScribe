import React from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export default function DiagnosisEditor({ diagnoses, setDiagnoses }) {
  const handleChange = (index: number, key: string, value: string) => {
    const updated = [...diagnoses];
    updated[index][key] = value;
    setDiagnoses(updated);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {diagnoses.map((dx, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.heading}>Diagnosis {index + 1}</Text>

          <TextInput
            style={styles.input}
            value={dx.description}
            placeholder="Description"
            onChangeText={(text) => handleChange(index, "description", text)}
          />

          <TextInput
            style={styles.input}
            value={dx.icd_10}
            placeholder="ICD-10 Code"
            onChangeText={(text) => handleChange(index, "icd_10", text)}
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
