import { Ionicons } from "@expo/vector-icons";
import { baseURL } from "constants/base";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AvatarInitials from "./Avatar";

const TEAL = "#12BDB5";

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
  onCallPress: () => void;
  onViewPress: () => void;
};

const PatientCard = ({
  patient,
  onCallPress,
  onViewPress,
}: PatientCardProps) => {
  const safePatient = patient || {};
  const status = safePatient.patient_status || "Patient";
  const dateOfBirth = safePatient.dob || "--";
  const phone = safePatient.cell_phone || safePatient.home_phone || "No phone";
  const account = safePatient.alternate_account || safePatient.patient_id || "--";
  const imageUri = typeof safePatient.pic === "string" && safePatient.pic
    ? safePatient.pic.startsWith("http")
      ? safePatient.pic
      : `${baseURL}/${safePatient.pic.replace(/^\//, "")}`
    : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${safePatient.name || "patient"}`}
      onPress={onViewPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <AvatarInitials
        name={safePatient.name}
        imageUri={imageUri}
        size={62}
        rounded={false}
        color={TEAL}
        style={styles.avatar}
      />

      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={1}>
          {safePatient.name || "Unknown patient"}
        </Text>
        <Text style={styles.status} numberOfLines={1}>
          {status}
        </Text>
        <Text style={styles.type} numberOfLines={1}>
          DOB: {dateOfBirth}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Record patient session"
        hitSlop={8}
        onPress={(event) => {
          event.stopPropagation();
          onCallPress();
        }}
        style={({ pressed }) => [styles.recordButton, pressed && styles.recordPressed]}
      >
        <Ionicons name="mic" size={19} color="#12BDB5" />
      </Pressable>

      <View style={styles.meta}>
        <View style={[styles.metaRow, styles.phoneMetaRow]}>
          <Ionicons name="call-outline" size={15} color="#718096" />
          <Text style={styles.metaText} numberOfLines={1}>{phone}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="id-card-outline" size={15} color="#718096" />
          <Text style={styles.metaText} numberOfLines={1}>ID {account}</Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    minHeight: 100,
    padding: 14,
    paddingBottom: 0,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C9DDE0",
    shadowColor: "#7A9195",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  pressed: {
    opacity: 0.84,
  },
  avatar: {
    borderRadius: 10,
    backgroundColor: "#E7F7F5",
  },
  details: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 12,
    paddingRight: 8,
    paddingTop: 4,
  },
  name: {
    color: "#17213D",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  status: {
    fontSize: 12,
    fontWeight: "400",
    marginTop: 4,
    color: "#52636B",
  },
  type: {
    fontSize: 11,
    marginTop: 4,
    color: "#52636B",
  },
  meta: {
    width: "100%",
    minHeight: 42,
    marginTop: 12,
    paddingHorizontal: 0,
    paddingBottom: 0,
    borderTopWidth: 1,
    borderTopColor: "#d9e9eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5,
    flex: 1,
  },
  phoneMetaRow: {
    justifyContent: "flex-start",
  },
  metaText: {
    color: "#52636B",
    fontSize: 11,
    textAlign: "right",
  },
  recordButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7F7F5",
  },
  recordPressed: {
    opacity: 0.7,
  },
});

export default PatientCard;
