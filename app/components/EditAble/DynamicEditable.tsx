import React from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

type DynamicEditorProps<T> = {
  data: T[];
  setData: (newData: T[]) => void;
  title?: string;
  excludedKeys?: string[];
  multilineKeys?: string[];
};

export default function DynamicEditor<T extends string | Record<string, any>>({
  data,
  setData,
  title,
  excludedKeys = [],
  multilineKeys = [],
}: DynamicEditorProps<T>) {
  const handleChange = (index: number, key: string | null, value: string) => {
    const updated = [...data];

    if (typeof updated[index] === "string") {
      // case: array of strings
      updated[index] = value as any;
    } else {
      // case: array of objects
      updated[index] = {
        ...(updated[index] as Record<string, any>),
        ...(key ? { [key]: value } : {}),
      } as T;
    }

    setData(updated);
  };

  const formatLabel = (key: string) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {data.map((item, index) => (
        <View key={index} style={styles.card}>
          {title && (
            <Text style={styles.heading}>
              {title} {index + 1}
            </Text>
          )}

          {typeof item === "string" ? (
            <TextInput
              editable={false}
              style={styles.input}
              value={item}
              onChangeText={(text) => handleChange(index, null, text)}
              placeholder={`${title || "Item"} ${index + 1}`}
            />
          ) : (
            Object.entries(item)
              .filter(([key]) => !excludedKeys.includes(key))
              .map(([key, value]) => (
                <View key={key} style={styles.field}>
                  <Text style={styles.label}>{formatLabel(key)}</Text>
                  <TextInput
                    editable={false}
                    style={[
                      styles.input,
                      multilineKeys.includes(key)
                        ? { height: 80, textAlignVertical: "top" }
                        : null,
                    ]}
                    multiline={multilineKeys.includes(key)}
                    value={String(value ?? "")}
                    placeholder={formatLabel(key)}
                    onChangeText={(text) => handleChange(index, key, text)}
                  />
                </View>
              ))
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#fff",
    padding: 12,
    marginVertical: 8,
    borderRadius: 10,
    elevation: 2,
  },
  heading: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
  },
});
