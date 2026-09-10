import { Entypo, Ionicons } from "@expo/vector-icons"; // For CLI: react-native-vector-icons
import { isNotEmpty, setHeight } from "@lib";
import { COLORS } from "constants/Colors";
import React from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
const CustomSearchBar = ({
  value,
  onChangeText,
  onPressAction,
  onPressSearch,
}: any) => {
  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={20} color="#555" />
      <TextInput
        placeholder="Search patient"
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholderTextColor="#888"
        returnKeyType="search" // changes keyboard button text (Search/Go/Done etc.)
        onSubmitEditing={onPressSearch} // called when Enter/Return key is pressed
        blurOnSubmit={true}
      />
      {isNotEmpty(value) && (
        <>
          <TouchableOpacity
            onPress={onPressAction}
          >
            <Entypo name="cross" size={setHeight(2)} color={COLORS.primary} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: setHeight(1),
    paddingHorizontal: 12,
    height: setHeight(4),
    marginVertical: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    color: "#333",
  },
  actionText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});

export default CustomSearchBar;
