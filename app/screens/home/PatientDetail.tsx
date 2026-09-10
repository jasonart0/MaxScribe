// PatientDetailsScreen.tsx
import { CustomButton, ScreenWrapper } from "@components";
import { Ionicons } from "@expo/vector-icons"; // works in Expo & CLI
import Entypo from "@expo/vector-icons/Entypo";
import { isNotEmpty, isValidJSON, setHeight } from "@lib";
import { fetchPatientHistory } from "api/patients";
import AvatarInitials from "components/Avatar";
import { COLORS } from "constants/Colors";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ContentLoader from "react-native-easy-content-loader";

const PatientDetailsScreen = ({ route, navigation }) => {
  const patient = route?.params || {};
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);

  const detailHistory = async () => {
    try {
      setLoading(true);
      const a = await fetchPatientHistory(patient?.patient_id);
      if (isNotEmpty(a)) {
        setVisits(a);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patient?.patient_id) detailHistory();
  }, [patient?.patient_id]);

  const renderItem = ({ item }) => {
    const visitDate = new Date(item.date_created).toLocaleDateString(); // format date

    return (
      <View style={styles.card1}>
        <View style={styles.infoContainer}>
          <Text style={styles.date1}>{visitDate}</Text>
          <Text style={styles.text}>Provider: {item.provider_name}</Text>
          <Text style={styles.text}>Location: {item.location_name}</Text>
        </View>

        <TouchableOpacity
          style={{ padding: 10 }}
          disabled={!isValidJSON(item.notes_data)}
          onPress={() => {
            navigation.navigate("Notes", {
              data: {
                patient: patient,
                transcription: "",
                jsonData: JSON.parse(item.notes_data),
                editAble: isNotEmpty(item.chart_id) ? false : true,
                id: item.id,
                aData:item
              },
            });
          }}
        >
          <Ionicons
            name="chevron-forward-circle"
            size={28}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>
    );
  };
  return (
    <ScreenWrapper
      title="Find Your Patients"
      footerUnScrollable={() => (
        <CustomButton
          title={"Start Recording"}
          style={styles.button}
          onPress={() => navigation.navigate("Voice", { patient })}
        />
      )}
    >
      <View style={styles.container}>
        <View style={styles.card}>
          {/* --- Header Section --- */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: setHeight(3),
              marginBottom: setHeight(2),
            }}
          >
            {/* Avatar */}
            <AvatarInitials
              name={patient?.name || "Unknown"}
              size={setHeight(8)}
            />

            {/* Name & DOB */}
            <View>
              {patient?.name ? (
                <Text style={styles.name}>{patient.name}</Text>
              ) : null}

              {patient?.dob ? (
                <Text style={styles.date}>DOB: {patient.dob}</Text>
              ) : null}
            </View>
          </View>

          {/* --- Appointment Info Section --- */}
          <View style={styles.info}>
            {patient?.patient_status ? (
              <Text style={styles.label}>
                Patient Status: {patient.patient_status}
              </Text>
            ) : null}

            {/* Optional: Phone Numbers */}
            {patient?.cell_phone ? (
              <Text style={styles.phone}>Cell: {patient.cell_phone}</Text>
            ) : null}

            {patient?.home_phone ? (
              <Text style={styles.phone}>Home: {patient.home_phone}</Text>
            ) : null}

            {/* Optional: Email */}
            {patient?.email ? (
              <Text style={styles.email}>Email: {patient.email}</Text>
            ) : null}

            {/* Optional: Alternate Account */}
            {patient?.alternate_account ? (
              <Text style={styles.account}>
                Account #: {patient.alternate_account}
              </Text>
            ) : null}

            {patient?.address ? (
              <View style={styles.row}>
                <Entypo name="location-pin" size={18} color="#555" />
                <Text style={styles.address}>{patient.address}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <FlatList
          data={visits}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 10 }}
          ListHeaderComponent={
            (loading && <ActivityIndicator color={COLORS.primary} />) || <></>
          }
          ListEmptyComponent={
            loading && (
              <ContentLoader
                active
                pRows={3}
                tHeight={20}
                pWidth={[120, 50, 200]}
                listSize={6}
              />
            )
          }
        />
      </View>
    </ScreenWrapper>
  );
};

export default PatientDetailsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerTitle: { fontSize: 16, fontWeight: "600" },
  name: {
    fontSize: 18,
    fontWeight: "700",
    marginVertical: 8,
    width: setHeight(28),
  },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    margin: setHeight(1),
  },
  avatar: { width: 60, height: 60, borderRadius: 30, marginBottom: 10 },
  info: { marginBottom: 10 },
  date: { fontSize: 14, fontWeight: "500", marginBottom: 4 },
  label: { fontSize: 14, color: "#666", marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", marginTop: setHeight(1.5) },
  address: { marginLeft: 5, fontSize: 14, color: "#333", flexShrink: 1 },
  divider: { height: 1, backgroundColor: "#ddd", marginVertical: 10 },
  quickHistory: { fontSize: 15, fontWeight: "600", marginBottom: 6 },
  detail: { fontSize: 14, color: "#444", marginBottom: 2 },
  button: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: setHeight(1),
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  card1: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 6,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoContainer: {
    flex: 1,
  },
  date1: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    color: "#555",
  },
  phone: {
    fontSize: setHeight(1.5),
    color: "#444",
    marginTop: setHeight(0.4),
  },

  email: {
    fontSize: setHeight(1.5),
    color: "#0066CC",
    marginTop: setHeight(0.4),
  },

  account: {
    fontSize: setHeight(1.5),
    color: "#333",
    marginTop: setHeight(0.4),
  },
});
