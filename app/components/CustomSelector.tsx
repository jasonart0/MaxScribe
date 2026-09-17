import { COLORS } from "constants/Colors";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from "react-native";
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
    backgroundColor: COLORS.primary,
  },
  activeText: {
    color: "#fff",
  },
});

export default CustomSelector;
