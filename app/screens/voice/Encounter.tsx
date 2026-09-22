import { CustomButton, ScreenWrapper } from "@components";
import { Ionicons } from "@expo/vector-icons";
import type BottomSheet from "@gorhom/bottom-sheet";
import {
    faildMessage,
    isNotEmpty,
    setHeight,
    successMessage,
} from "@lib";
import { savePatientScribeData } from "api/Encounter";
import { apiErrorMessage } from "api/response";
import ConfirmationModal from "components/confirmationModal";
import CustomDropdown, { type DropdownItem } from "components/CustomDropDown";
import { COLORS } from "constants/Colors";
import { usePracticeData } from "hooks/usePracticeData";
import { getUserData } from "lib/authdata";
import React, { useEffect, useRef, useState } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import type { ScreenProps } from "types/navigation";

export default function AddEncounter({ route, navigation }: ScreenProps<"AddEncounter">) {
  const { patient, jsonData, practiceLookups } = route.params || {};

  const { posList, providerList, locationList, loading, error, retry } = usePracticeData(practiceLookups);
  useEffect(() => {
    if (!loading && isNotEmpty(error)) {
      faildMessage(error || "Unable to load encounter options.");
    }
  }, [loading, error]);

  const posSheetRef = useRef<BottomSheet>(null);
  const providerSheetRef = useRef<BottomSheet>(null);
  const locationSheetRef = useRef<BottomSheet>(null);
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);

  const [provider, setProvider] = useState<DropdownItem | null>(null);
  const [location, setLocation] = useState<DropdownItem | null>(null);
  const [pos, setPos] = useState<DropdownItem | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const canSelectProvider = Boolean(providerList?.length);
  const canSelectPos = Boolean(posList?.length);

  // Validation state
  const [errors, setErrors] = useState({
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

  const validateFields = () => {
    const newErrors = {
      provider: !provider,
      location: !location,
      pos: !pos,
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some((e) => e);
  };

  const handleSaveEncounter = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const text = JSON.stringify(jsonData);
      const user = await getUserData();
      if (!user?.username) throw new Error("Your session has expired. Please sign in again.");
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
      await savePatientScribeData(scribeData);
      successMessage("✅ Synced", "Encounter note synced to EHR system.");
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch (err) {
      faildMessage(apiErrorMessage(err, "Unable to save the encounter. Please try again."));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (saving || loading || error) return;
    if (!validateFields()) {
      return;
    }
    setShowConfirm(true);
  };

  return (
    <ScreenWrapper
      title={patient?.name}
      footerUnScrollable={() => (
        <CustomButton
          title={"Save"}
          onPress={handleSave}
          isLoading={saving || loading}
          disabled={loading || !!error}
          style={styles.buttonRow}
        />
      )}
    >
      <View style={styles.container}>
        {!!error && <View style={{ padding: 16 }}>
          <Text style={styles.errorText}>{error}</Text>
          <CustomButton title="Retry" onPress={retry} />
        </View>}
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
              onPress={() => {
                if (!canSelectProvider) return;
                providerSheetRef.current?.expand();
              }}
              disabled={!canSelectProvider}
              style={[
                styles.selectorRow,
                errors.provider && styles.errorRow,
                !canSelectProvider && styles.disabledRow,
              ]}
            >
              <View style={styles.selectorIcon}>
                <Ionicons name="person-outline" size={21} color={canSelectProvider ? COLORS.primary : COLORS.border} />
              </View>
              <View style={styles.selectorCopy}>
                <Text style={styles.selectorTitle}>Care provider</Text>
                <Text style={styles.selectorSubtitle} numberOfLines={1}>
                  {provider ? provider.label : "Select provider first"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={canSelectProvider ? COLORS.primary : COLORS.border} />
            </TouchableOpacity>
            {errors.provider && (
              <Text style={styles.errorText}>Required *</Text>
            )}

            {/* Place of service */}
            <TouchableOpacity
              onPress={() => {
                if (!canSelectPos) return;
                posSheetRef.current?.expand();
              }}
              disabled={!canSelectPos}
              style={[
                styles.selectorRow,
                errors.pos && styles.errorRow,
                !canSelectPos && styles.disabledRow,
              ]}
            >
              <View style={styles.selectorIcon}>
                <Ionicons name="business-outline" size={21} color={canSelectPos ? COLORS.primary : COLORS.border} />
              </View>
              <View style={styles.selectorCopy}>
                <Text style={styles.selectorTitle}>Place of service</Text>
                <Text style={styles.selectorSubtitle} numberOfLines={1}>
                  {pos ? pos.label : "Select place of service"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={canSelectPos ? COLORS.primary : COLORS.border} />
            </TouchableOpacity>
            {errors.pos && <Text style={styles.errorText}>Required *</Text>}
          </View>
        </View>

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
  modalOverlay: { paddingHorizontal: 12, paddingTop: 12 },
  formCard: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DDE9F2",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.96)",
    shadowColor: "#0D2D5F",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  selectorRow: {
    minHeight: 68,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EAEFF5",
    backgroundColor: "#FFFFFF",
  },
  selectorIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF6FF",
  },
  selectorCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  selectorTitle: { color: COLORS.deep, fontSize: 15, fontWeight: "700" },
  selectorSubtitle: { marginTop: 4, color: COLORS.textLight, fontSize: 12, lineHeight: 18 },
  disabledRow: { opacity: 0.55 },
  errorRow: { backgroundColor: "#FFF7F7", borderBottomColor: COLORS.danger },
  buttonRow: {
    marginTop: 20,
    borderRadius: setHeight(1),
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginLeft: 5,
    marginBottom: 5,
  },
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
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
});
