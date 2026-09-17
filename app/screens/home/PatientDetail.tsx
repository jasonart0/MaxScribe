import { CustomButton } from "@components";
import { Ionicons } from "@expo/vector-icons";
import { isNotEmpty, isValidJSON } from "@lib";
import { useFocusEffect } from "@react-navigation/native";
import { fetchPatientHistory } from "api/patients";
import AppBackground from "components/AppBackground";
import AvatarInitials from "components/Avatar";
import { baseURL } from "constants/base";
import { COLORS } from "constants/Colors";
import { usePatientImage } from "hooks/usePatientImage";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Visit = {
  id?: string | number;
  date_created?: string;
  provider_name?: string;
  location_name?: string;
  notes_data?: string;
  chart_id?: string | number;
  encounter_type?: string;
  visit_type?: string;
  appointment_type?: string;
  [key: string]: unknown;
};

function calculateAge(dob?: string) {
  if (!dob) return "--";
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return "--";

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  return Math.max(0, age);
}

function extractEncounters(response: any): Visit[] {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];

  const candidates = [
    response.data,
    response.records,
    response.encounters,
    response.results,
    response.data?.records,
    response.data?.encounters,
    response.data?.results,
    response.data?.data,
    response.data?.data?.records,
    response.data?.data?.encounters,
  ];

  return candidates.find(Array.isArray) || [];
}

export default function PatientDetailsScreen({ route, navigation }: any) {
  const patient = route?.params?.patient || route?.params || {};
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [historyAttempt, setHistoryAttempt] = useState(0);

  useFocusEffect(useCallback(() => {
    if (!patient?.patient_id) return;
    let cancelled = false;

    const loadHistory = async () => {
      setLoading(true);
      setHistoryError(false);
      try {
        const response = await fetchPatientHistory(patient.patient_id);
        if (!cancelled) setVisits(extractEncounters(response));
      } catch {
        if (!cancelled) setHistoryError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadHistory();
    return () => { cancelled = true; };
  // Pull-to-refresh changes the callback to reload the focused screen.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.patient_id, historyAttempt]));

  const fallbackImageUri =
    typeof patient.pic === "string" && patient.pic
      ? patient.pic.startsWith("http")
        ? patient.pic
        : `${baseURL}/${patient.pic.replace(/^\//, "")}`
      : null;
  const imageUri = usePatientImage(patient.patient_id, fallbackImageUri);
  const age = patient.age ?? calculateAge(patient.dob);
  const genderCode = patient.gender_code?.toUpperCase();
  const gender = patient.gender || patient.sex || (genderCode === "M" ? "Male" : genderCode === "F" ? "Female" : "Patient");
  const contactDetails = [
    { label: "Date of birth", value: patient.dob, icon: "calendar-outline" },
    { label: "Mobile phone", value: patient.cell_phone, icon: "call-outline" },
    { label: "Home phone", value: patient.home_phone, icon: "home-outline" },
    { label: "Patient ID", value: patient.alternate_account ?? patient.patient_id, icon: "person-outline" },
  ] as const;
  const openVisit = (item: Visit) => {
    if (!isValidJSON(item.notes_data)) return;
    navigation.navigate("Notes", {
      data: {
        patient,
        transcription: "",
        jsonData: JSON.parse(item.notes_data as string),
        editAble: !isNotEmpty(item.chart_id),
        id: item.id,
        aData: item,
      },
    });
  };

  const renderVisit = ({ item }: { item: Visit }) => {
    return (
      <Pressable
        disabled={!isValidJSON(item.notes_data)}
        onPress={() => openVisit(item)}
        style={({ pressed }) => [styles.visitCard, pressed && styles.pressed]}
      >
        <View style={styles.documentIcon}>
          <Ionicons name="document-text-outline" size={22} color={COLORS.primary} />
        </View>
        <View style={styles.visitCopy}>
          <Text style={styles.visitTitle}>
            {item.encounter_type || item.visit_type || item.appointment_type || "Patient encounter"}
          </Text>
          {!!item.date_created && <Text style={styles.visitDate}>{item.date_created}</Text>}
          {!!item.location_name && <Text numberOfLines={1} style={styles.visitLocation}>
            {item.location_name}
          </Text>}
          {!!item.location_name && (
            <Text numberOfLines={1} style={styles.providerName}>
              {item.provider_name || "Provider unavailable"}
            </Text>
          )}
          {!item.location_name && !!item.provider_name && (
            <Text numberOfLines={1} style={styles.providerName}>
              {item.provider_name}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
      </Pressable>
    );
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          >
            <Ionicons name="chevron-back" size={32} color="#164FD1" />
          </Pressable>
        </View>

        <FlatList
          contentContainerStyle={styles.listContent}
          data={visits}
          keyExtractor={(item, index) => String(item.id ?? `visit-${index}`)}
          ListHeaderComponent={
            <>
              <View style={styles.profileSection}>
                <AvatarInitials
                  color="#1358C8"
                  imageUri={imageUri}
                  name={patient.name || "Unknown"}
                  size={72}
                  style={styles.avatar}
                />
                <View style={styles.profileCopy}>
                  <Text numberOfLines={2} style={styles.patientName}>
                    {patient.name || "Unknown Patient"}
                  </Text>
                  <Text style={styles.demographics}>
                    {age} yrs <Text style={styles.dot}>•</Text> {gender}
                  </Text>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusText}>
                      {patient.patient_status || "Patient"}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.contactCard}>
                {contactDetails.map(({ label, value, icon }) => (
                  <View key={label} style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <Ionicons name={icon} size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.infoCopy}>
                      <Text style={styles.infoLabel}>{label}</Text>
                      <Text selectable style={styles.infoText}>
                        {value == null || value === "" ? "--" : String(value)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
              <Text style={styles.historyTitle}>Visit history</Text>
            </>
          }
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={COLORS.primary} size="large" style={styles.loader} />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={32} color="#7EA5DA" />
                <Text style={styles.emptyText}>
                  {historyError ? "Unable to load encounters. Please try again." : "No encounters available"}
                </Text>
                {historyError && (
                  <Pressable accessibilityRole="button" onPress={() => setHistoryAttempt((attempt) => attempt + 1)}
                    style={styles.retryButton}>
                    <Text style={styles.retryText}>Retry</Text>
                  </Pressable>
                )}
              </View>
            )
          }
          renderItem={renderVisit}
          refreshing={loading}
          onRefresh={() => setHistoryAttempt((attempt) => attempt + 1)}
          showsVerticalScrollIndicator={false}
        />
        <View style={styles.recordingFooter}>
          <CustomButton
            title="Start Recording"
            onPress={() => navigation.navigate("Voice", { patient, autoStart: true })}
          />
        </View>
      </View>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "transparent" },
  container: { flex: 1, overflow: "hidden", backgroundColor: "transparent" },
  header: {
    minHeight: 56,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 2,
  },
  headerButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  listContent: { paddingHorizontal: 16, paddingBottom: 28 },
  profileSection: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8 },
  avatar: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: "#F0F6FC" },
  profileCopy: { flex: 1, marginLeft: 16 },
  patientName: { color: COLORS.deep, fontSize: 18, lineHeight: 22, fontWeight: "700" },
  demographics: { color: COLORS.primary, fontSize: 14, marginTop: 2 },
  dot: { color: "#287BE4" },
  statusPill: {
    alignSelf: "flex-start",
    marginTop: 7,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#E5F3FF",
  },
  statusText: { color: COLORS.primary, fontSize: 12 },
  historyTitle: { marginTop: 20, marginBottom: 4, fontSize: 16, fontWeight: "600", color: COLORS.deep },
  retryButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 16, marginTop: 8 },
  retryText: { color: COLORS.primary, fontWeight: "600" },
  contactCard: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(255,255,255,0.88)",
    elevation: 0,
  },
  infoRow: { minHeight: 48, flexDirection: "row", alignItems: "center" },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF8FF",
  },
  infoCopy: { flex: 1, marginLeft: 12, paddingVertical: 6 },
  infoLabel: { color: "#7285A8", fontSize: 12, marginBottom: 3 },
  infoText: { color: "#102D85", fontSize: 15, lineHeight: 21 },
  recordingFooter: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: "rgba(249,252,255,0.94)",
  },
  visitCard: {
    minHeight: 68,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    elevation: 0,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.mutedSurface,
  },
  visitCopy: { flex: 1, minWidth: 0, marginLeft: 12, marginRight: 8 },
  visitTitle: { color: COLORS.deep, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  visitDate: { marginTop: 4, color: COLORS.textLight, fontSize: 12, lineHeight: 18, fontWeight: "400" },
  visitLocation: { marginTop: 4, color: COLORS.text, fontSize: 13, lineHeight: 19, fontWeight: "400" },
  providerName: { marginTop: 3, color: COLORS.textLight, fontSize: 13, lineHeight: 19, fontWeight: "400" },
  loader: { marginTop: 28 },
  emptyState: { alignItems: "center", paddingVertical: 36 },
  emptyText: { marginTop: 10, color: "#607BC2", fontSize: 14 },
  pressed: { opacity: 0.72 },
});
