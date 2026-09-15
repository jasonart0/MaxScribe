import { ScreenWrapper } from "@components";
import { Ionicons } from "@expo/vector-icons";
import { fetchPatients, fetchPatientsbySearch } from "api/patients";
import { useDebounce } from "hooks/useDebounce";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    View,
} from "react-native";
import CustomSearchBar from "../../components/CustomSearchBar";
import PatientCard from "../../components/PatientCard";

const ACCENT = "#12BDB5";
type Patient = {
  patient_id?: string | number;
  name?: string;
  patient_status?: string;
  dob?: string;
  pic?: string;
  cell_phone?: string;
  home_phone?: string;
  alternate_account?: string | number;
  [key: string]: unknown;
};

export default function HomeScreen({ navigation }: any) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const debouncedSearch = useDebounce(search.trim(), 500);

  const loadPatients = async (query: string, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const data = query
        ? await fetchPatientsbySearch(query)
        : await fetchPatients();
      setPatients(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // The debounced query drives the remote patient search.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPatients(debouncedSearch);
  }, [debouncedSearch]);

  return (
    <ScreenWrapper
      title="Patients"
      showback={false}
      backgroundColor="#F5F7FC"
      statusBarColor="#F5F7FC"
    >
      <View style={styles.container}>
        <CustomSearchBar
          value={search}
          placeholder="Search Patient"
          onChangeText={setSearch}
          onPressSearch={() => loadPatients(search.trim())}
          onPressAction={() => setSearch("")}
        />

        <FlatList
          data={patients}
          style={styles.patientList}
          keyExtractor={(item, index) =>
            String(item.patient_id ?? `patient-${index}`)
          }
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => loadPatients(debouncedSearch, true)}
          contentContainerStyle={[
            styles.listContent,
            !patients.length && styles.emptyListContent,
          ]}
          ListHeaderComponent={
            loading ? (
              <ActivityIndicator
                color={ACCENT}
                size="large"
                style={styles.loader}
              />
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="people-outline" size={30} color={ACCENT} />
                </View>
                <Text style={styles.emptyTitle}>No patients found</Text>
                <Text style={styles.emptyCopy}>
                  Try another name, ID, or patient status.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <PatientCard
              patient={item}
              onCallPress={() =>
                navigation.navigate("Voice", { patient: item, autoStart: true })
              }
              onViewPress={() => navigation.navigate("PatientDetails", item)}
            />
          )}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FC",
  },
  header: {
    height: 72,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterRow: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 7,
  },
  doctorAvatar: {
    borderWidth: 1,
    borderColor: "#B9D0D5",
    backgroundColor: "#E7F7F5",
  },
  title: {
    color: "#17213D",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  filters: {
    flexGrow: 1,
    alignItems: "center",
    gap: 7,
  },
  filterList: {
    flex: 1,
    height: 40,
    zIndex: 2,
  },
  filterPill: {
    flex: 1,
    height: 38,
    minWidth: 78,
    paddingHorizontal: 10,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EEF1F7",
  },
  filterPillSelected: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  filterLabel: {
    color: "#566176",
    fontSize: 12,
    fontWeight: "500",
  },
  filterLabelSelected: {
    color: "#FFFFFF",
  },
  filterSettings: {
    width: 40,
    height: 38,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5EAEE",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 10,
  },
  sectionTitle: {
    color: "#17213D",
    fontSize: 14,
    fontWeight: "700",
    marginHorizontal: 11,
    marginTop: 10,
    marginBottom: 2,
  },
  patientList: {
    flex: 1,
    zIndex: 1,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  loader: {
    marginVertical: 24,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7F7F5",
    marginBottom: 16,
  },
  emptyTitle: {
    color: "#172033",
    fontSize: 17,
    fontWeight: "700",
  },
  emptyCopy: {
    color: "#7B8495",
    fontSize: 13,
    marginTop: 6,
  },
});
