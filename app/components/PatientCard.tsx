import { Ionicons } from "@expo/vector-icons";
import { baseURL } from "constants/base";
import { COLORS } from "constants/Colors";
import { usePatientImage } from "hooks/usePatientImage";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AvatarInitials from "./Avatar";

type Patient = {
  name?: string;
  patient_status?: string;
  dob?: string;
  pic?: string;
  cell_phone?: string;
  home_phone?: string;
  alternate_account?: string | number;
  patient_id?: string | number;
};

type PatientCardProps = {
  patient: Patient;
  onViewPress: () => void;
  onCallPress: () => void;
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

export default function PatientCard({ patient, onViewPress, onCallPress }: PatientCardProps) {
  const fallbackImageUri = patient.pic
    ? patient.pic.startsWith("http") ? patient.pic : `${baseURL}/${patient.pic.replace(/^\//, "")}`
    : null;
  const imageUri = usePatientImage(patient.patient_id, fallbackImageUri);
  const statusStyle = getStatusStyle(patient.patient_status);

  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityLabel={`View ${patient.name || "patient"}`}
        onPress={onViewPress} style={({ pressed }) => pressed && styles.pressed}>
      <View style={styles.topRow}>
        {imageUri ? (
          <AvatarInitials imageUri={imageUri} name={patient.name} size={46} />
        ) : (
          <View style={styles.avatar}><Ionicons name="person" size={24} color="#4C9BF5" /></View>
        )}
        <View style={styles.copy}>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={styles.name}>{patient.name || "Unknown Patient"}</Text>
            <View style={[styles.statusPill, statusStyle.pill]}>
              <Text style={[styles.status, statusStyle.text]}>{patient.patient_status || "Patient"}</Text>
            </View>
          </View>
          <Text style={styles.dob}>DOB: {patient.dob || "--"}</Text>
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
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Record patient session"
        hitSlop={8} onPress={onCallPress}
        style={({ pressed }) => [styles.micButton, pressed && styles.pressed]}>
        <Ionicons name="mic-outline" size={27} color="#3777FA" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
  micButton: { position: "absolute", right: 12, top: 17, width: 44, height: 44, borderRadius: 22, alignItems: "center",
    justifyContent: "center", backgroundColor: "#E7F3FF" },
  footer: { marginTop: 9, minHeight: 36, borderTopWidth: 1, borderTopColor: "#E7EFFA",
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  meta: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 8 },
  idMeta: { maxWidth: "45%", flexDirection: "row", alignItems: "center", gap: 8 },
  metaText: { flexShrink: 1, color: "#7285A8", fontSize: 12 },
  pressed: { opacity: 0.75 },
});
