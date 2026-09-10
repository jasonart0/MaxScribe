import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function EditableSections({ sections }) {
  const [sectionsData, setSectionsData] = useState(sections);

  const handleChange = (index, key, newVal) => {
    const updated = [...sectionsData];
    updated[index][key] = newVal;
    setSectionsData(updated);
  };

  const renderEditableField = (value, onChange) => {
    if (typeof value === "string") {
      return (
        <TextInput
          style={styles.input}
          value={value}
          multiline
          onChangeText={onChange}
        />
      );
    }

    if (Array.isArray(value)) {
      return value.map((item, idx) => (
        <View key={idx} style={styles.arrayItem}>
          {renderEditableField(item, (newVal) => {
            const newArr = [...value];
            newArr[idx] = newVal;
            onChange(newArr);
          })}
        </View>
      ));
    }

    if (typeof value === "object" && value !== null) {
      return Object.entries(value).map(([k, v]) => (
        <View key={k} style={styles.objectRow}>
          <Text style={styles.label}>{k.replace(/_/g, " ")}:</Text>
          {renderEditableField(v, (newVal) => {
            const newObj = { ...value, [k]: newVal };
            onChange(newObj);
          })}
        </View>
      ));
    }

    return <Text>{String(value)}</Text>;
  };

  return (
    <ScrollView style={styles.container}>
      {sectionsData.map((item, idx) => (
        <View key={idx} style={styles.card}>
          <Text style={styles.title}>Allergy #{idx + 1}</Text>
          {Object.entries(item).map(([k, v]) => (
            <View key={k} style={styles.objectRow}>
              <Text style={styles.label}>{k.replace(/_/g, " ")}:</Text>
              {renderEditableField(v, (newVal) => handleChange(idx, k, newVal))}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  card: {
    marginBottom: 20,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    elevation: 2,
  },
  title: { fontWeight: "bold", fontSize: 16, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  label: { fontWeight: "600", marginBottom: 4, color: "#333" },
  objectRow: { marginBottom: 12 },
  arrayItem: { marginLeft: 10, marginBottom: 8 },
});
