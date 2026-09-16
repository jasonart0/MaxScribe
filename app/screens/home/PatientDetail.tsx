import { CustomButton } from "@components";
import { Ionicons } from "@expo/vector-icons";
import { isNotEmpty, isValidJSON } from "@lib";
import { fetchPatientHistory } from "api/patients";
import AppBackground from "components/AppBackground";
import AvatarInitials from "components/Avatar";
import { baseURL } from "constants/base";
import { COLORS } from "constants/Colors";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";

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
  ];

  return candidates.find(Array.isArray) || [];
}

export default function PatientDetailsScreen({ route, navigation }: any) {
  const patient = route?.params || {};
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyError, setHistoryError] = useState(false);

  useEffect(() => {
    if (!patient?.patient_id) return;

    const loadHistory = async () => {
      setLoading(true);
      setHistoryError(false);
      try {
        const response = await fetchPatientHistory(patient.patient_id);
        setVisits(extractEncounters(response));
      } catch {
        setHistoryError(true);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [patient?.patient_id]);

  const imageUri =
    typeof patient.pic === "string" && patient.pic
      ? patient.pic.startsWith("http")
        ? patient.pic
        : `${baseURL}/${patient.pic.replace(/^\//, "")}`
      : null;
  const age = patient.age ?? calculateAge(patient.dob);
  const gender = patient.gender || patient.sex || "Patient";
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
          <Ionicons name="document-text-outline" size={29} color="#287BE4" />
        </View>
        <View style={styles.visitCopy}>
          {!!item.location_name && <Text numberOfLines={1} style={styles.visitLocation}>
            {item.location_name}
          </Text>}
          {!!item.location_name && (
            <Text numberOfLines={1} style={styles.providerName}>
              {item.provider_name || "Provider unavailable"}
            </Text>
          )}
          {!item.location_name && !!item.provider_name && (
            <Text numberOfLines={1} style={styles.visitLocation}>
              {item.provider_name}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={24} color="#164FD1" />
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
          <Text style={styles.headerTitle}>Patient Details</Text>
          <View style={styles.headerButton} />
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
              </View>
            )
          }
          renderItem={renderVisit}
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
  circleTop: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    right: -75,
    top: -92,
    backgroundColor: "rgba(218, 239, 255, 0.62)",
  },
  circleRight: {
    position: "absolute",
    width: 115,
    height: 115,
    borderRadius: 58,
    right: -50,
    top: 112,
    backgroundColor: "rgba(218, 239, 255, 0.62)",
  },
  header: {
    minHeight: 56,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 2,
  },
  headerButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#10107A", fontSize: 22, fontWeight: "700" },
  listContent: { paddingHorizontal: 16, paddingBottom: 28 },
  profileSection: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8 },
  avatar: { borderWidth: 2, borderColor: "#B9DFFF", backgroundColor: "#E5F3FF" },
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
  contactCard: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CEE8FC",
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
    minHeight: 76,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E1EFFB",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    elevation: 0,
  },
  documentIcon: {
    width: 56,
    height: 56,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F7FC",
  },
  visitCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  visitLocation: { color: COLORS.deep, fontSize: 13, fontWeight: "700" },
  providerName: { marginTop: 3, color: COLORS.primary, fontSize: 11, fontWeight: "600" },
  loader: { marginTop: 28 },
  emptyState: { alignItems: "center", paddingVertical: 36 },
  emptyText: { marginTop: 10, color: "#607BC2", fontSize: 14 },
  pressed: { opacity: 0.72 },
});
