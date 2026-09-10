import React from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export default function FollowUpEditor({ followUps, setFollowUps }) {
  const handleChange = (index: number, key: string, value: string) => {
    const updated = [...followUps];
    updated[index][key] = value;
    setFollowUps(updated);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {followUps.map((item, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.heading}>Follow-up {index + 1}</Text>

          <TextInput
            style={styles.input}
            value={item.follow_up_date}
            placeholder="Follow-up Date (MM/DD/YYYY)"
            onChangeText={(text) => handleChange(index, "follow_up_date", text)}
          />

          <TextInput
            style={styles.input}
            value={item.when}
            placeholder="When (e.g. 2)"
            keyboardType="numeric"
            onChangeText={(text) => handleChange(index, "when", text)}
          />
          <TextInput
            style={styles.input}
            value={item.period}
            placeholder="When (e.g. 2)"
            keyboardType="numeric"
            onChangeText={(text) => handleChange(index, "period", text)}
          />

          {/* <Picker
            selectedValue={item.period}
            onValueChange={(val) => handleChange(index, "period", val)}
            style={styles.picker}
          >
            <Picker.Item label="Days" value="days" />
            <Picker.Item label="Weeks" value="weeks" />
            <Picker.Item label="Months" value="months" />
          </Picker> */}

          <TextInput
            style={[styles.input, { height: 80 }]}
            value={item.text}
            placeholder="Follow-up Notes"
            multiline
            onChangeText={(text) => handleChange(index, "text", text)}
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
  picker: { marginBottom: 10 },
});
