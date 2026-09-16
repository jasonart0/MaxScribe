import { CustomButton, ScreenWrapper } from "@components";
import { Ionicons } from "@expo/vector-icons";
import {
    faildMessage,
    isNotEmpty,
    setHeight,
    setWidth,
    successMessage,
} from "@lib";
import { savePatientScribeData } from "api/Encounter";
import ConfirmationModal from "components/confirmationModal";
import CustomDropdown from "components/CustomDropDown";
import { COLORS } from "constants/Colors";
import { usePracticeData } from "hooks/usePracticeData";
import { getUserData } from "lib/authdata";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";

export default function AddEncounter({ route, navigation }) {
  const { patient, jsonData } = route.params || {};

  const { posList, providerList, locationList, loading, error } =
    usePracticeData(patient?.patient_id || null);
  useEffect(() => {
    if (!loading && isNotEmpty(error)) {
      faildMessage("Something went wrong. Please try again later.");
      navigation.goBack();
    }
  }, [loading]);

  const posSheetRef = useRef(null);
  const providerSheetRef = useRef(null);
  const locationSheetRef = useRef(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const [provider, setProvider] = useState(null);
  const [location, setLocation] = useState(null);
  const [pos, setPos] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Validation state
  const [errors, setErrors] = useState({
    date: false,
    provider: false,
    location: false,
    pos: false,
  });

  const handleConfirm = async () => {
    setShowConfirm(false);
    await handleSaveEncounter();
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  const handleConfirmDate = (date) => {
    setSelectedDate(date);
    setErrors((prev) => ({ ...prev, date: false }));
    setDatePickerVisible(false);
  };

  const validateFields = () => {
    const newErrors = {
      date: !selectedDate,
      provider: !provider,
      location: !location,
      pos: !pos,
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some((e) => e);
  };

  const handleSaveEncounter = async () => {
    try {
      
      const text = JSON.stringify(jsonData);
      const user = await getUserData();
      const scribeData = {
        patient_id: patient?.patient_id,
        practice_id: user?.practice_id,
        notes_data: text,
        chart_id: "",
        created_user: user.username,
        deleted: false,
        provider_id: provider?.value?.id?.toString(),
        location_id: location?.value?.id?.toString(),
        pos_id: pos?.value?.id?.toString(),
        date_created: new Date().toISOString(),
      };
      const scribeResponse = await savePatientScribeData(scribeData);
      successMessage("✅ Synced", "Encounter note synced to EHR system.");
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
      // setShowConfirm(true);
    } catch (err) {
      console.error("Error saving encounter:", err);
    }
  };

  const handleSave = () => {
    if (!validateFields()) {
      return;
    }
    setShowConfirm(true);
    // handleSaveEncounter();
  };

  return (
    <ScreenWrapper
      title={patient?.name}
      footerUnScrollable={() => (
        <CustomButton
          title={"Save"}
          onPress={handleSave}
          style={styles.buttonRow}
        />
      )}
    >
      <View style={styles.container}>
        <View style={styles.modalOverlay}>
          <View style={styles.formCard}>
            {/* Location */}
            <TouchableOpacity
              onPress={() => locationSheetRef.current?.expand()}
              style={[
                styles.selectorRow,
                errors.location && styles.errorRow,
              ]}
            >
              <View style={styles.selectorIcon}>
                <Ionicons name="location-outline" size={21} color={COLORS.primary} />
              </View>
              <View style={styles.selectorCopy}>
                <Text style={styles.selectorTitle}>Location</Text>
                <Text style={styles.selectorSubtitle} numberOfLines={1}>
                  {location ? location.label : "Select location"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            {errors.location && <Text style={styles.errorText}>Required *</Text>}

            {/* Provider */}
            <TouchableOpacity
              onPress={() => providerSheetRef.current?.expand()}
              style={[
                styles.selectorRow,
                errors.provider && styles.errorRow,
              ]}
            >
              <View style={styles.selectorIcon}>
                <Ionicons name="person-outline" size={21} color={COLORS.primary} />
              </View>
              <View style={styles.selectorCopy}>
                <Text style={styles.selectorTitle}>Care provider</Text>
                <Text style={styles.selectorSubtitle} numberOfLines={1}>
                  {provider ? provider.label : "Select provider first"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={provider ? COLORS.primary : COLORS.border} />
            </TouchableOpacity>
            {errors.provider && (
              <Text style={styles.errorText}>Required *</Text>
            )}

            {/* Preferred date */}
            <TouchableOpacity
              onPress={() => setDatePickerVisible(true)}
              style={[
                styles.selectorRow,
                errors.date && styles.errorRow,
              ]}
            >
              <View style={styles.selectorIcon}>
                <Ionicons name="calendar-outline" size={21} color={COLORS.primary} />
              </View>
              <View style={styles.selectorCopy}>
                <Text style={styles.selectorTitle}>Preferred date</Text>
                <Text style={styles.selectorSubtitle}>
                  {selectedDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            {errors.date && <Text style={styles.errorText}>Required *</Text>}

            {/* Place of service */}
            <TouchableOpacity
              onPress={() => posSheetRef.current?.expand()}
              style={[
                styles.selectorRow,
                errors.pos && styles.errorRow,
              ]}
            >
              <View style={styles.selectorIcon}>
                <Ionicons name="business-outline" size={21} color={COLORS.primary} />
              </View>
              <View style={styles.selectorCopy}>
                <Text style={styles.selectorTitle}>Place of service</Text>
                <Text style={styles.selectorSubtitle} numberOfLines={1}>
                  {pos ? pos.label : "Select place of service"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={pos ? COLORS.primary : COLORS.border} />
            </TouchableOpacity>
            {errors.pos && <Text style={styles.errorText}>Required *</Text>}
          </View>
        </View>

        {/* Date Picker */}
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="datetime"
          onConfirm={handleConfirmDate}
          onCancel={() => setDatePickerVisible(false)}
        />
      </View>

      {/* Dropdowns */}
      <CustomDropdown
        data={providerList}
        selectedValue={provider}
        onSelect={(val) => {
          setProvider(val);
          setErrors((prev) => ({ ...prev, provider: false }));
        }}
        bottomSheetRef={providerSheetRef}
      />
      <CustomDropdown
        data={locationList}
        selectedValue={location}
        onSelect={(val) => {
          setLocation(val);
          setErrors((prev) => ({ ...prev, location: false }));
        }}
        bottomSheetRef={locationSheetRef}
      />
      <CustomDropdown
        data={posList}
        selectedValue={pos}
        onSelect={(val) => {
          setPos(val);
          setErrors((prev) => ({ ...prev, pos: false }));
        }}
        bottomSheetRef={posSheetRef}
      />

      {/* Loading Modal */}
      <Modal animationType="fade" transparent={true} visible={loading}>
        <View style={styles.backdrop}>
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.text}>Loading</Text>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={showConfirm}
        message="Are you sure you want to sync this encounter note to the EHR system?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  modalOverlay: { paddingHorizontal: 16, paddingTop: 8 },
  formCard: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D6E2EA",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.88)",
  },
  headerText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 16,
  },
  selectorRow: {
    minHeight: 74,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E1EAF0",
  },
  selectorIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDF7F8",
  },
  selectorCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  selectorTitle: { color: COLORS.deep, fontSize: 15, fontWeight: "600" },
  selectorSubtitle: { marginTop: 4, color: COLORS.textLight, fontSize: 12 },
  errorRow: { backgroundColor: "#FFF7F7", borderBottomColor: COLORS.danger },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
    color: COLORS.primary,
  },
  buttonRow: {
    marginTop: 20,
    borderRadius: setHeight(1),
  },
  saveButton: {
    width: setWidth(90),
    backgroundColor: COLORS.primary,
    borderRadius: setHeight(1),
    padding: 12,
    alignSelf: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginLeft: 5,
    marginBottom: 5,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: setHeight(2),
    paddingVertical: setHeight(1),
  },
  backBtn: { borderRadius: 50, padding: 12 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    minWidth: 120,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
});
