import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Pressable,
    StyleSheet,
    TextInput,
    TextInputProps,
    View,
} from "react-native";

type CustomSearchBarProps = Pick<TextInputProps, "value" | "onChangeText"> & {
  placeholder?: string;
  onPressAction: () => void;
  onPressSearch: () => void;
};

const CustomSearchBar = ({
  value,
  placeholder = "Search patients",
  onChangeText,
  onPressAction,
  onPressSearch,
}: CustomSearchBarProps) => {
  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={22} color="#425466" />
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholderTextColor="#657587"
        returnKeyType="search"
        onSubmitEditing={onPressSearch}
        blurOnSubmit
      />
      {!!value?.trim() && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={10}
          onPress={onPressAction}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Ionicons name="close-circle" size={21} color="#718096" />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 52,
    marginHorizontal: 16,
    marginTop: 2,
    borderRadius: 13,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#B9D0D5",
    shadowColor: "#667085",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  input: {
    flex: 1,
    height: "100%",
    marginHorizontal: 9,
    color: "#17213D",
    fontSize: 14,
  },
  pressed: {
    opacity: 0.65,
  },
});

export default CustomSearchBar;
