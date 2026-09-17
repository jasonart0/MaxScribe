import { ScreenWrapper } from "@components";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { fetchPatients, fetchPatientsbySearch } from "api/patients";
import { apiErrorMessage } from "api/response";
import { COLORS } from "constants/Colors";
import { useDebounce } from "hooks/useDebounce";
import React, { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import CustomSearchBar from "../../components/CustomSearchBar";
import PatientCard from "../../components/PatientCard";

const ACCENT = "#2177E8";

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestId = useRef(0);
  const loadingRef = useRef(false);
  const debouncedSearch = useDebounce(search.trim(), 500);

  const loadPatients = useCallback(async (query: string, isRefresh = false) => {
    if (loadingRef.current && !isRefresh) return;

    const currentRequest = ++requestId.current;
    loadingRef.current = true;
    setLoadError(null);
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const data = query
        ? await fetchPatientsbySearch(query)
        : await fetchPatients();
      if (currentRequest === requestId.current) setPatients(Array.isArray(data) ? data : []);
    } catch (error) {
      if (currentRequest === requestId.current) {
        setPatients([]);
        setLoadError(apiErrorMessage(error, "Unable to load patients. Please try again."));
      }
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
      loadingRef.current = false;
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadPatients(debouncedSearch);
    return () => { requestId.current += 1; };
  }, [debouncedSearch, loadPatients]));

  return (
    <ScreenWrapper
      title="Patients"
      showback={false}
      backgroundColor={COLORS.background}
      statusBarColor={COLORS.background}
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
                <Text style={styles.emptyTitle}>{loadError ? "Unable to load patients" : "No patients found"}</Text>
                <Text style={styles.emptyCopy}>
                  {loadError || "Try another name, ID, or patient status."}
                </Text>
                {!!loadError && <Pressable accessibilityRole="button" onPress={() => loadPatients(search.trim())}
                  style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 16 }}>
                  <Text style={{ color: COLORS.primary }}>Retry</Text>
                </Pressable>}
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <PatientCard
              patient={item}
              onCallPress={() => navigation.navigate("Voice", { patient: item, autoStart: true })}
              onViewPress={() => navigation.navigate("PatientDetails", { patient: item })}
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
    backgroundColor: "transparent",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 10,
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
    backgroundColor: "#E5F3FF",
    marginBottom: 16,
  },
  emptyTitle: {
    color: "#071A60",
    fontSize: 17,
    fontWeight: "700",
  },
  emptyCopy: {
    color: "#607BC2",
    fontSize: 13,
    marginTop: 6,
  },
});
