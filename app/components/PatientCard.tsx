import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { setHeight, setWidth } from "@lib";
import { COLORS } from "constants/Colors";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AvatarInitials from "./Avatar";
const PatientCard = ({ patient, onCallPress, onViewPress }) => {

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
        marginVertical: 8,
        shadowColor: "#4a4a4aff",
        shadowOpacity: 0.1,
        shadowOffset: { width: 1, height: 2 },
        shadowRadius: 5,
        elevation: 2,
      }}
    >
      <View style={styles.card}>
        {/* {patient.pic ? (
        <Image source={{ uri: "https://ehr.maximus.care/pre.prod.maximus/"+patient.pic }} style={styles.avatar} />
      ) :*/}
        <AvatarInitials name={patient.name} size={setHeight(6)} />
        {/* <Icon
          name={patient.gender_code == "F" ? "femaleIcon" : "maleIcon"}
          height={setHeight(6)}
          width={setHeight(6)}
          iconColor={COLORS.primary}
        /> */}
        <View style={{ flex: 1, marginLeft: 10, rowGap: 5 }}>
          <Text style={styles.name}>{patient.name}</Text>
          <Text style={styles.date}>{patient.dob}</Text>
          <Text style={styles.reason}>{patient.patient_status}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconBtn} onPress={onCallPress}>
          <FontAwesome name="microphone" size={setHeight(2)} color={COLORS.primary} />
          <Text style={styles.date}>Record Session</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: "#F1F5F9" }]}
          onPress={onViewPress}
        >
          <Ionicons name="eye-outline" size={setHeight(2)} color="#000000ff" />
          <Text style={styles.date}>View Summary</Text>
        </TouchableOpacity>
      </View>
      {/* <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={14} color="#666" />
        <Text style={styles.location}>{patient.address}</Text>
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
  },
  date: {
    fontSize: 12,
    color: "#666",
  },
  reason: {
    fontSize: 13,
    color: COLORS.primary,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  location: {
    fontSize: 12,
    color: "#666",
    marginLeft: 3,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  iconBtn: {
    flexDirection: "row",
    gap: setHeight(1),
    padding: setHeight(1),
    margin: setHeight(0.5),
    width: setWidth(40),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#D5FBE6",
    borderRadius: setHeight(0.8),
  },
});

export default PatientCard;
