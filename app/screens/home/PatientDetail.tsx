import { CustomButton, HeaderTitle } from "@components";
import { Ionicons } from "@expo/vector-icons";
import { isNotEmpty, isValidJSON } from "@lib";
import { useFocusEffect } from "@react-navigation/native";
import { fetchPatientHistory } from "api/patients";
import AppBackground from "components/AppBackground";
import AvatarInitials from "components/Avatar";
import GradientStatusBar from "components/GradientStatusBar";
import { baseURL } from "constants/base";
import { COLORS } from "constants/Colors";
import { usePatientImage } from "hooks/usePatientImage";
import { extractEncounters } from "lib/preload";
import { getPatientAge } from "lib/patientAge";
import React, { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
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

function formatVisitDate(value?: string) {
  if (!value) return { day: "--", month: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { day: "--", month: "" };
  }
  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: date.toLocaleString("en-US", { month: "short" }).toUpperCase(),
  };
}

const getStatusStyle = (status?: string) => {
  const normalized = (status || "Patient").toLowerCase();

  if (["active", "new", "in treatment", "open", "checked in"].includes(normalized)) {
    return { pill: styles.statusPillActive, text: styles.statusTextActive };
  }

  if (["inactive", "discharged", "closed", "completed", "archived"].includes(normalized)) {
    return { pill: styles.statusPillMuted, text: styles.statusTextMuted };
  }

  if (["pending", "follow up", "waiting", "review"].includes(normalized)) {
    return { pill: styles.statusPillWarning, text: styles.statusTextWarning };
  }

  if (["urgent", "critical", "high risk"].includes(normalized)) {
    return { pill: styles.statusPillDanger, text: styles.statusTextDanger };
  }

  return { pill: styles.statusPillInfo, text: styles.statusTextInfo };
};

export default function PatientDetailsScreen({ route, navigation }: any) {
  const patient = route?.params?.patient || route?.params || {};
  const [visits, setVisits] = useState<Visit[]>(route?.params?.initialVisits ?? []);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [historyAttempt, setHistoryAttempt] = useState(0);
  const preparedRef = useRef(route?.params?.initialVisits !== undefined);

  useFocusEffect(useCallback(() => {
    if (!patient?.patient_id) return;
    let cancelled = false;
    if (preparedRef.current) {
      preparedRef.current = false;
      return;
    }

    const loadHistory = async () => {
      setLoading(true);
      try {
        const response = await fetchPatientHistory(patient.patient_id);
        if (!cancelled) {
          setVisits(extractEncounters(response));
          setHistoryError(false);
        }
      } catch {
        if (!cancelled) setHistoryError(true);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
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
  const statusStyle = getStatusStyle(patient.patient_status);
  const age = getPatientAge(patient);
  const genderCode = patient.gender_code?.toUpperCase();
  const gender = patient.gender || patient.sex || (genderCode === "M" ? "Male" : genderCode === "F" ? "Female" : "Patient");
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
    const { day, month } = formatVisitDate(item.date_created);
    const title = item.provider_name || item.encounter_type || item.visit_type || item.appointment_type || "Provider unavailable";

    return (
      <Pressable
        disabled={!isValidJSON(item.notes_data)}
        onPress={() => openVisit(item)}
        style={({ pressed }) => [styles.visitCard, pressed && styles.pressed]}
      >
        <View style={styles.dateBadge}>
          <Text style={styles.dateDay}>{day}</Text>
          {!!month && <Text style={styles.dateMonth}>{month}</Text>}
        </View>
        <View style={styles.visitCopy}>
          <Text numberOfLines={1} style={styles.visitTitle}>
            {title}
          </Text>
          {!!item.location_name && (
            <Text numberOfLines={1} style={styles.visitLocation}>
              {item.location_name}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
      </Pressable>
    );
  };

  return (
    <AppBackground>
      <GradientStatusBar />
      <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <HeaderTitle
          titleContent={(
            <View style={styles.headerPatient}>
              <AvatarInitials
                color="#FFFFFF"
                imageUri={imageUri}
                name={patient.name || "Unknown"}
                size={38}
                style={styles.headerAvatar}
              />
              <View style={styles.headerPatientCopy}>
                <View style={styles.headerPatientNameRow}>
                  <Text numberOfLines={1} style={styles.headerPatientName}>
                    {patient.name || "Unknown Patient"}
                  </Text>
                  <View style={[styles.statusPill, statusStyle.pill]}>
                    <Text numberOfLines={1} style={[styles.statusText, statusStyle.text]}>
                      {patient.patient_status || "Patient"}
                    </Text>
                  </View>
                </View>
                <Text numberOfLines={1} style={styles.headerPatientMeta}>
                  {age} yrs • {gender}
                </Text>
              </View>
            </View>
          )}
        />

        <FlatList
          contentContainerStyle={styles.listContent}
          data={visits}
          keyExtractor={(item, index) => String(item.id ?? `visit-${index}`)}
          ListHeaderComponent={
            <>
              <Text style={styles.historyTitle}>Visit history</Text>
              {historyError && !!visits.length && <Text accessibilityRole="alert" style={styles.emptyText}>Unable to load encounters. Please try again.</Text>}
              {historyError && <CustomButton title="Retry" variant="secondary" isLoading={loading && !refreshing}
                onPress={() => { setRefreshing(false); setHistoryAttempt((attempt) => attempt + 1); }} />}
            </>
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.emptyText}>Loading visit history...</Text>
              </View>
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
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); setHistoryAttempt((attempt) => attempt + 1); }}
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
  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28 },
  headerPatient: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 3 },
  headerAvatar: { borderWidth: 1, borderColor: "rgba(255,255,255,0.72)", backgroundColor: "rgba(255,255,255,0.18)" },
  headerPatientCopy: { flex: 1, minWidth: 0 },
  headerPatientNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerPatientName: { flexShrink: 1, color: "#FFFFFF", fontSize: 14, lineHeight: 18, fontWeight: "700" },
  headerPatientMeta: { marginTop: 1, color: "rgba(255,255,255,0.82)", fontSize: 11, lineHeight: 15 },
  statusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusPillActive: { backgroundColor: "#DFF5F1" },
  statusPillMuted: { backgroundColor: "#E7EDF8" },
  statusPillWarning: { backgroundColor: "#FFF2D8" },
  statusPillDanger: { backgroundColor: "#FFE1E1" },
  statusPillInfo: { backgroundColor: "#E5F3FF" },
  statusText: { fontSize: 10, textTransform: "uppercase", fontWeight: "700" },
  statusTextActive: { color: "#189C9A" },
  statusTextMuted: { color: "#5A6C8D" },
  statusTextWarning: { color: "#A56500" },
  statusTextDanger: { color: "#C63B3B" },
  statusTextInfo: { color: "#1A73D8" },
  historyTitle: { marginBottom: 4, fontSize: 16, fontWeight: "600", color: COLORS.deep },
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
  dateBadge: {
    width: 44,
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.mutedSurface,
    paddingVertical: 6,
  },
  dateDay: { color: COLORS.primary, fontSize: 15, lineHeight: 18, fontWeight: "700" },
  dateMonth: { color: COLORS.primary, fontSize: 9, lineHeight: 11, fontWeight: "600", letterSpacing: 0.5 },
  visitCopy: { flex: 1, minWidth: 0, marginLeft: 12, marginRight: 8 },
  visitTitle: { color: COLORS.deep, fontSize: 14, lineHeight: 20, fontWeight: "600" },
  visitLocation: { marginTop: 4, color: COLORS.textLight, fontSize: 12, lineHeight: 18, fontWeight: "400" },
  loader: { marginTop: 28 },
  emptyState: { alignItems: "center", paddingVertical: 36 },
  emptyText: { marginTop: 10, color: "#607BC2", fontSize: 14 },
  pressed: { opacity: 0.72 },
});
