import React from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

interface Allergy {
  description: string;
  reaction: string;
  reaction_snomed_code: string;
  severity: string;
  severity_snomed_code: string;
  snomed_ct: string;
  type: string;
  type_snomed_code: string;
}

interface Props {
  allergy: Allergy[]; // array of allergies
  setAllergy: (updatedAllergies: Allergy[]) => void; // callback instead of useState setter
}

export default function AllergyEditor({ allergy, setAllergy }: Props) {
  const handleChange = (index: number, key: keyof Allergy, value: string) => {
    const updated = [...allergy]; // copy from props
    updated[index] = { ...updated[index], [key]: value };
    setAllergy(updated); // directly pass new array
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {allergy.map((item, index) => (
        <View key={index} style={styles.card}>
          {Object.entries(item).map(([key, value]) => (
            <View key={key} style={styles.field}>
              <Text style={styles.label}>{key.replace(/_/g, " ")}:</Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={(text) =>
                  handleChange(index, key as keyof Allergy, text)
                }
              />
            </View>
          ))}
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
  field: { marginBottom: 12 },
  label: { fontWeight: "bold", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
  },
});
