import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Pressable,
    StyleSheet,
    TextInput,
    TextInputProps,
    View,
} from "react-native";
import LoadingOverlay from "./LoadingOverlay";

type CustomSearchBarProps = Pick<TextInputProps, "value" | "onChangeText"> & {
  placeholder?: string;
  onPressAction: () => void;
  onPressSearch: () => void;
  isLoading?: boolean;
};

const CustomSearchBar = ({
  value,
  placeholder = "Search patients",
  onChangeText,
  onPressAction,
  onPressSearch,
  isLoading = false,
}: CustomSearchBarProps) => {
  return (
    <View style={styles.container}>
      <Pressable accessibilityRole="button" accessibilityLabel="Search patients"
        accessibilityState={{ busy: isLoading, disabled: isLoading }} disabled={isLoading}
        onPress={onPressSearch} style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="search-outline" size={22} color="#5874B7" />
        {isLoading && <LoadingOverlay backgroundColor="#FFFFFF" color="#5874B7" />}
      </Pressable>
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
          <Ionicons name="close-circle" size={21} color="#7795C2" />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 48,
    marginHorizontal: 16,
    marginTop: 0,
    borderRadius: 8,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE7EF",
  },
  input: {
    flex: 1,
    height: "100%",
    marginHorizontal: 9,
    color: "#1C4062",
    fontSize: 15,
  },
  pressed: {
    opacity: 0.65,
  },
});

export default CustomSearchBar;
