import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import { setHeight } from "@lib";
import { COLORS } from "constants/Colors";
import React, { useCallback, useMemo, useState } from "react";
import {
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

interface DropdownItem {
  label: string;
  value: any;
}

interface CustomDropdownProps {
  data: DropdownItem[];
  selectedValue: DropdownItem | null;
  onSelect: (item: DropdownItem) => void;
  placeholder?: string;
  bottomSheetRef?:BottomSheet
}

const CustomDropdown = ({
  data,
  selectedValue,
  onSelect,
  placeholder = "Search...",
  bottomSheetRef
}: CustomDropdownProps) => {
  const [search, setSearch] = useState("");

  const snapPoints = useMemo(() => [setHeight(50)], []);

  // search filter
  const filteredData = useMemo(() => {
    if (!search) return data;
    return data.filter((item) =>
      item.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} pressBehavior="close"
     disappearsOnIndex={-1}
      appearsOnIndex={0}
      onPress={() => {
         Keyboard.dismiss();   
        props?.onPress?.();       // still close sheet
      }}
    />,
    []
  );

  const handleSelect = (item: DropdownItem) => {
    onSelect(item);
    bottomSheetRef.current?.close();
  };

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
      >
        <View style={styles.container}>
          {/* Search input */}
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder}
            value={search}
            onChangeText={setSearch}
          />

          {/* FlatList replaced with BottomSheetFlatList ✅ */}
          <BottomSheetFlatList
            data={filteredData}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => {
              const isSelected = selectedValue?.value === item.value;
              return (
                <TouchableOpacity
                  style={[styles.row, isSelected && styles.selectedRow]}
                  onPress={() => handleSelect(item)}
                >
                  <Text
                    style={[
                      styles.label,
                      isSelected && styles.selectedLabel,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </BottomSheet>
    </>
  );
};

export default CustomDropdown;

const styles = StyleSheet.create({
  openButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    margin: 10,
  },
  openButtonText: {
    fontSize: 16,
    color: COLORS.text,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  row: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    borderRadius: 8,
  },
  selectedRow: {
    backgroundColor: COLORS.secondary,
  },
  label: {
    fontSize: 16,
    color: "#333",
  },
  selectedLabel: {
    fontWeight: "bold",
    color:COLORS.primary,
  },
});
