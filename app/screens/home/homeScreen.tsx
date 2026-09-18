import { CustomButton, ScreenWrapper } from "@components";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { fetchPatients, fetchPatientsbySearch } from "api/patients";
import { apiErrorMessage } from "api/response";
import { COLORS } from "constants/Colors";
import { useDebounce } from "hooks/useDebounce";
import { preloadPatientHistory } from "lib/preload";
import { faildMessage } from "@lib";
import React, { useCallback, useRef, useState } from "react";
import {
    FlatList,
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

export default function HomeScreen({ navigation, route }: any) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingTarget, setLoadingTarget] = useState<"search" | "retry" | "refresh">("search");
  const [patients, setPatients] = useState<Patient[]>(route?.params?.initialPatients ?? []);
  const [loadError, setLoadError] = useState<string | null>(route?.params?.initialError ?? null);
  const [openingPatient, setOpeningPatient] = useState<string | number | null>(null);
  const openingRef = useRef(false);
  const preparedRef = useRef(route?.params?.initialPatients !== undefined);
  const requestId = useRef(0);
  const debouncedSearch = useDebounce(search.trim(), 500);

  const loadPatients = useCallback(async (query: string, target: "search" | "retry" | "refresh" = "search") => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setLoadingTarget(target);
    setRefreshing(target === "refresh");
    try {
      const data = query
        ? await fetchPatientsbySearch(query)
        : await fetchPatients();
      if (currentRequest === requestId.current) {
        setPatients(Array.isArray(data) ? data : []);
        setLoadError(null);
      }
    } catch (error) {
      if (currentRequest === requestId.current) {
        setLoadError(apiErrorMessage(error, "Unable to load patients. Please try again."));
      }
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    if (preparedRef.current && !debouncedSearch) preparedRef.current = false;
    else void loadPatients(debouncedSearch);
    return () => { requestId.current += 1; };
  }, [debouncedSearch, loadPatients]));

  const openPatient = async (patient: Patient) => {
    if (openingRef.current || patient.patient_id == null) return;
    openingRef.current = true;
    setOpeningPatient(patient.patient_id);
    try {
      const initialVisits = await preloadPatientHistory(patient.patient_id);
      if (navigation.isFocused?.() === false) return;
      navigation.navigate("PatientDetails", { patient, initialVisits });
    } catch (error) {
      faildMessage(apiErrorMessage(error, "Unable to load patient history. Please try again."));
    } finally {
      openingRef.current = false;
      setOpeningPatient(null);
    }
  };

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
          isLoading={loading && loadingTarget === "search"}
        />

        <FlatList
          data={patients}
          style={styles.patientList}
          keyExtractor={(item, index) =>
            String(item.patient_id ?? `patient-${index}`)
          }
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => loadPatients(debouncedSearch, "refresh")}
          contentContainerStyle={[
            styles.listContent,
            !patients.length && styles.emptyListContent,
          ]}
          ListHeaderComponent={<View>
            {!!loadError && !!patients.length && <Text accessibilityRole="alert" style={styles.emptyCopy}>{loadError}</Text>}
            {!!loadError && <CustomButton title="Retry" variant="secondary"
              isLoading={loading && loadingTarget === "retry"} onPress={() => loadPatients(search.trim(), "retry")} />}
          </View>}
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
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <PatientCard
              patient={item}
              onCallPress={() => { if (!openingRef.current) navigation.navigate("Voice", { patient: item, autoStart: true }); }}
              onViewPress={() => openPatient(item)}
              isLoading={openingPatient === item.patient_id}
              disabled={openingPatient !== null}
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
