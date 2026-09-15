// PatientDetailsScreen.tsx
import { CustomButton, ScreenWrapper } from "@components";
import { Ionicons } from "@expo/vector-icons";
import { isNotEmpty, isValidJSON } from "@lib";
import { fetchPatientHistory } from "api/patients";
import AvatarInitials from "components/Avatar";
import { COLORS } from "constants/Colors";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
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
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (patient?.patient_id) detailHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

        <Pressable
          style={styles.historyAction}
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
        </Pressable>
      </View>
    );
  };
  return (
    <ScreenWrapper
      title="Patient Details"
      footerUnScrollable={() => (
        <CustomButton
          title={"Start Recording"}
          style={styles.button}
          onPress={() => navigation.navigate("Voice", { patient })}
        />
      )}
    >
      <View style={styles.container}>
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <AvatarInitials
              name={patient?.name || "Unknown"}
              size={68}
              rounded={false}
              color={COLORS.primary}
              style={styles.avatar}
            />
            <View style={styles.profileCopy}>
              <Text style={styles.name} numberOfLines={2}>
                {patient?.name || "Unknown Patient"}
              </Text>
              <Text style={styles.specialty}>
                {patient?.patient_status || "Patient"}
              </Text>
            </View>
          </View>

          <View style={styles.profileDivider} />
          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={17} color={COLORS.primary} />
              <View>
                <Text style={styles.detailLabel}>Date of birth</Text>
                <Text style={styles.detailValue}>{patient?.dob || "--"}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="id-card-outline" size={17} color={COLORS.primary} />
              <View>
                <Text style={styles.detailLabel}>Patient ID</Text>
                <Text style={styles.detailValue}>
                  {patient?.alternate_account || patient?.patient_id || "--"}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={17} color={COLORS.primary} />
            <Text style={styles.contactText}>
              {patient?.cell_phone || patient?.home_phone || "No phone number"}
            </Text>
          </View>
          {patient?.email ? (
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={17} color={COLORS.primary} />
              <Text style={styles.contactText}>{patient.email}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.sectionTitle}>Encounter History</Text>
        <FlatList
          data={visits}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.historyList}
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
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5ECEA",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileCopy: {
    flex: 1,
    marginLeft: 13,
    marginRight: 8,
  },
  name: {
    fontSize: 19,
    fontWeight: "700",
    color: COLORS.deep,
  },
  avatar: { backgroundColor: COLORS.secondary },
  specialty: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  profileDivider: { height: 1, backgroundColor: "#EDF1F0", marginVertical: 16 },
  detailGrid: { flexDirection: "row", gap: 12 },
  detailItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  detailLabel: { color: COLORS.textLight, fontSize: 11 },
  detailValue: { color: COLORS.deep, fontSize: 13, fontWeight: "600", marginTop: 3 },
  contactRow: { flexDirection: "row", alignItems: "center", marginTop: 14, gap: 8 },
  contactText: { color: COLORS.text, fontSize: 13, flex: 1 },
  sectionTitle: { color: COLORS.deep, fontSize: 17, fontWeight: "700", marginTop: 24, marginBottom: 4 },
  historyList: { paddingBottom: 14 },
  button: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },
  card1: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 14,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5ECEA",
  },
  infoContainer: {
    flex: 1,
  },
  date1: {
    color: COLORS.deep,
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  historyAction: {
    padding: 8,
  },
});
