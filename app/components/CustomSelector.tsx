import { COLORS } from "constants/Colors";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from "react-native";
import BlueGradient from "./BlueGradient";
const CustomSelector = ({ options, selected, onSelect,containerStyle }: { options: string[]; selected?: string; onSelect: (option: string) => void; containerStyle?: StyleProp<ViewStyle> }) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[
            styles.button,
            selected === opt && styles.activeButton
          ]}
          onPress={() => onSelect(opt)}
        >
          {selected === opt && <BlueGradient />}
          <Text style={[styles.text, selected === opt && styles.activeText]}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",

  },
  button: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  text: {
    color: COLORS.primary,
    fontWeight: "500",
  },
  activeButton: {
    backgroundColor: "#2B69C1",
  },
  activeText: {
    color: "#fff",
  },
});

export default CustomSelector;
