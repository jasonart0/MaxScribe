import { Ionicons } from "@expo/vector-icons";
import { baseURL } from "constants/base";
import { COLORS } from "constants/Colors";
import { usePatientImage } from "hooks/usePatientImage";
import { getPatientAge } from "lib/patientAge";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AvatarInitials from "./Avatar";
import LoadingOverlay from "./LoadingOverlay";

type Patient = {
  name?: string;
  patient_status?: string;
  dob?: string;
  age?: number | string | null;
  pic?: string;
  cell_phone?: string;
  home_phone?: string;
  alternate_account?: string | number;
  patient_id?: string | number;
  appointment_date?: string | number | Date | null;
  appointmentDate?: string | number | Date | null;
  scheduled_date?: string | number | Date | null;
  scheduledDate?: string | number | Date | null;
  next_appointment?: string | number | Date | null;
  nextAppointment?: string | number | Date | null;
  appointment?: {
    date?: string | number | Date | null;
    start?: string | number | Date | null;
    scheduled_date?: string | number | Date | null;
    appointment_date?: string | number | Date | null;
    appointment_time?: string | null;
    start_time?: string | null;
    time?: string | null;
    status?: string | null;
    app_status?: string | null;
    appointment_status?: string | null;
    datetime?: string | number | Date | null;
    date_time?: string | number | Date | null;
    scheduledAt?: string | number | Date | null;
  } | null;
  schedule?: {
    date?: string | number | Date | null;
    start?: string | number | Date | null;
    time?: string | number | Date | null;
    start_time?: string | null;
  } | null;
  appointment_time?: string | null;
  start_time?: string | null;
  time?: string | null;
  app_status?: string | null;
  appointment_status?: string | null;
  visit_date?: string | number | Date | null;
  visitDate?: string | number | Date | null;
  appointmentStatus?: string | null;
  [key: string]: unknown;
};

type PatientCardProps = {
  patient: Patient;
  onViewPress: () => void;
  onCallPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  showAppointmentInfo?: boolean;
};

const formatAppointmentDate = (value: string | number | Date | null | undefined) => {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const formatAppointmentTime = (value: string | number | Date | null | undefined) => {
  if (value == null || value === "") return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)/i);
    if (match) return match[1].replace(/\s+/g, " ");
    if (trimmed.includes("T")) {
      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) {
        return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(parsed);
      }
    }
    return trimmed;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
};

const getPatientAppointmentDate = (patient: Patient) => {
  const dateCandidates = [
    patient.appointment_date,
    patient.appointmentDate,
    patient.scheduled_date,
    patient.scheduledDate,
    patient.next_appointment,
    patient.nextAppointment,
    patient.appointment?.date,
    patient.appointment?.start,
    patient.appointment?.scheduled_date,
    patient.appointment?.appointment_date,
    patient.appointment?.datetime,
    patient.appointment?.date_time,
    patient.appointment?.scheduledAt,
    patient.schedule?.date,
    patient.schedule?.start,
    patient.visit_date,
    patient.visitDate,
  ];

  const timeCandidates = [
    patient.appointment_time,
    patient.start_time,
    patient.time,
    patient.appointment?.appointment_time,
    patient.appointment?.start_time,
    patient.appointment?.time,
    patient.appointment?.datetime,
    patient.appointment?.date_time,
    patient.schedule?.time,
    patient.schedule?.start_time,
  ];

  for (const candidate of dateCandidates) {
    const formattedDate = formatAppointmentDate(candidate);
    if (formattedDate) {
      const timeSource = timeCandidates.find((item) => item != null && item !== "") ?? candidate;
      const formattedTime = formatAppointmentTime(timeSource);
      return formattedTime ? `${formattedDate} • ${formattedTime}` : formattedDate;
    }
  }

  return null;
};

const getAppointmentStatus = (patient: Patient) => {
  const values = [
    patient.appointment?.status,
    patient.appointment?.app_status,
    patient.appointment?.appointment_status,
    patient.app_status,
    patient.appointment_status,
    patient.appointmentStatus,
    patient.status,
  ];

  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return null;
};

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

export default function PatientCard({ patient, onViewPress, onCallPress, isLoading = false, disabled = false, showAppointmentInfo = false }: PatientCardProps) {
  const fallbackImageUri = patient.pic
    ? patient.pic.startsWith("http") ? patient.pic : `${baseURL}/${patient.pic.replace(/^\//, "")}`
    : null;
  const imageUri = usePatientImage(patient.patient_id, fallbackImageUri);
  const statusStyle = getStatusStyle(patient.patient_status);
  const appointmentDate = getPatientAppointmentDate(patient);
  const appointmentStatus = getAppointmentStatus(patient);
  const visibleStatus = showAppointmentInfo ? (appointmentStatus || patient.patient_status) : patient.patient_status;
  const visibleStatusStyle = showAppointmentInfo ? getStatusStyle(appointmentStatus || patient.patient_status) : statusStyle;

  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityLabel={`View ${patient.name || "patient"}`}
        accessibilityState={{ busy: isLoading, disabled }} disabled={disabled}
        onPress={onViewPress} style={({ pressed }) => [styles.viewButton, pressed && styles.pressed]}>
      <View style={styles.topRow}>
        {imageUri ? (
          <AvatarInitials imageUri={imageUri} name={patient.name} size={46} />
        ) : (
          <View style={styles.avatar}><Ionicons name="person" size={24} color="#4C9BF5" /></View>
        )}
        <View style={styles.copy}>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={styles.name}>{patient.name || "Unknown Patient"}</Text>
            {!!visibleStatus && (
              <View style={[styles.statusPill, visibleStatusStyle.pill]}>
                <Text style={[styles.status, visibleStatusStyle.text]}>{visibleStatus}</Text>
              </View>
            )}
          </View>
          <Text style={styles.dob}>DOB: {patient.dob || "--"}</Text>
          <Text style={styles.dob}>Age: {getPatientAge(patient)} yrs</Text>
          {!!showAppointmentInfo && !!appointmentDate && (
            <Text style={styles.appointmentDate}>Appt: {appointmentDate}</Text>
          )}
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.meta}>
          <Ionicons name="call-outline" size={18} color="#647EAF" />
          <Text numberOfLines={1} style={styles.metaText}>
            {patient.cell_phone || patient.home_phone || "No phone"}
          </Text>
        </View>
        <View style={styles.idMeta}>
          <Ionicons name="phone-portrait-outline" size={18} color="#647EAF" />
          <Text numberOfLines={1} style={styles.metaText}>
            ID {patient.alternate_account || patient.patient_id || "--"}
          </Text>
        </View>
      </View>
      {isLoading && <LoadingOverlay backgroundColor={COLORS.card} color={COLORS.primary} />}
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Record patient session"
        disabled={disabled}
        hitSlop={8} onPress={onCallPress}
        style={({ pressed }) => [styles.micButton, pressed && styles.pressed]}>
        <Ionicons name="mic-outline" size={27} color="#3777FA" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  viewButton: { overflow: "hidden", borderRadius: 8 },
  card: { paddingHorizontal: 12, paddingTop: 10, borderRadius: 8, backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border },
  topRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center",
    justifyContent: "center", backgroundColor: "#E7F3FF" },
  copy: { flex: 1, minWidth: 0, marginLeft: 12, marginRight: 52 },
  nameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  name: { color: COLORS.deep, fontSize: 15, fontWeight: "700", flexShrink: 1 },
  statusPill: { marginLeft: 8, alignSelf: "flex-start", borderRadius: 12, paddingHorizontal: 8,
    paddingVertical: 2 },
  statusPillActive: { backgroundColor: "#DFF5F1" },
  statusPillMuted: { backgroundColor: "#E7EDF8" },
  statusPillWarning: { backgroundColor: "#FFF2D8" },
  statusPillDanger: { backgroundColor: "#FFE1E1" },
  statusPillInfo: { backgroundColor: "#E5F3FF" },
  status: { fontSize: 10, textTransform: "uppercase" },
  statusTextActive: { color: "#189C9A" },
  statusTextMuted: { color: "#5A6C8D" },
  statusTextWarning: { color: "#A56500" },
  statusTextDanger: { color: "#C63B3B" },
  statusTextInfo: { color: "#1A73D8" },
  dob: { marginTop: 4, color: "#7285A8", fontSize: 12 },
  appointmentDate: { marginTop: 4, color: "#0B7D6A", fontSize: 11, fontWeight: "700" },
  micButton: { position: "absolute", right: 12, top: 17, width: 44, height: 44, borderRadius: 22, alignItems: "center",
    justifyContent: "center", backgroundColor: "#E7F3FF" },
  footer: { marginTop: 9, minHeight: 36, borderTopWidth: 1, borderTopColor: "#E7EFFA",
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  meta: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 8 },
  idMeta: { maxWidth: "45%", flexDirection: "row", alignItems: "center", gap: 8 },
  metaText: { flexShrink: 1, color: "#7285A8", fontSize: 12 },
  pressed: { opacity: 0.75 },
});
