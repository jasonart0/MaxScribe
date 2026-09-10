import React from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export default function MedicationEditor({ medications, setMedications }) {
  const handleChange = (index: number, key: string, value: string) => {
    const updated = [...medications];
    updated[index][key] = value;
    setMedications(updated);
  };

  const addMedication = () => {
    setMedications((prev) => [...prev, { description: "", rxnorm: "" }]);
  };

  const removeMedication = (index: number) => {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const saveData = () => {
    console.log("Updated Medications:", medications);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {medications.map((med, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.heading}>Medication {index + 1}</Text>

          <TextInput
            style={styles.input}
            value={med.description}
            placeholder="Medication Description"
            onChangeText={(text) => handleChange(index, "description", text)}
          />

          <TextInput
            style={styles.input}
            value={med.rxnorm}
            placeholder="RxNorm Code"
            onChangeText={(text) => handleChange(index, "rxnorm", text)}
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
