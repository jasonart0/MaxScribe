import { HeaderTitle, ScreenWrapper } from "@components";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { fetchPatients, fetchPatientsByFilter, fetchPatientsbySearch } from "api/patients";
import { apiErrorMessage } from "api/response";
import { COLORS } from "constants/Colors";
import { useDebounce } from "hooks/useDebounce";
import React, { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
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
  const [filterTab, setFilterTab] = useState<"ALL" | "TODAY_SCHEDULED">("ALL");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [patients, setPatients] = useState<Patient[]>(route?.params?.initialPatients ?? []);
  const [loadError, setLoadError] = useState<string | null>(route?.params?.initialError ?? null);
  const openingRef = useRef(false);
  const preparedRef = useRef(route?.params?.initialPatients !== undefined);
  const requestId = useRef(0);
  const requestController = useRef<AbortController | null>(null);
  const debouncedSearch = useDebounce(search.trim(), 500);

  const loadPatients = useCallback(async (query: string, target: "search" | "refresh" | "background" = "background", selectedFilter: "ALL" | "TODAY_SCHEDULED" = filterTab) => {
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    const currentRequest = ++requestId.current;
    setLoading(true);
    setSearching(target === "search");
    setRefreshing(target === "refresh");
    try {
      const data = selectedFilter === "TODAY_SCHEDULED"
        ? query
          ? await fetchPatientsbySearch(query, selectedFilter, controller.signal)
          : await fetchPatientsByFilter(selectedFilter, controller.signal)
        : query
          ? await fetchPatientsbySearch(query, "ALL", controller.signal)
          : await fetchPatients(controller.signal);
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
        setSearching(false);
        setRefreshing(false);
      }
    }
  }, [filterTab]);

  useFocusEffect(useCallback(() => {
    openingRef.current = false;
    if (preparedRef.current && !debouncedSearch) preparedRef.current = false;
    else void loadPatients(debouncedSearch, debouncedSearch ? "search" : "background", filterTab);
    return () => {
      requestId.current += 1;
      requestController.current?.abort();
    };
  }, [debouncedSearch, filterTab, loadPatients]));

  const openPatient = (patient: Patient) => {
    if (openingRef.current || patient.patient_id == null) return;
    requestController.current?.abort();
    requestId.current += 1;
    setLoading(false);
    setSearching(false);
    setRefreshing(false);
    openingRef.current = true;
    navigation.navigate("PatientDetails", { patient });
  };

  return (
    <ScreenWrapper
      title="Patients"
      showback={false}
      backgroundColor={COLORS.background}
      barStyle="light-content"
      statusBarColor="#2B69C1"
      headerUnScrollable={() => (
        <HeaderTitle title="Patients" showback={false}>
          <CustomSearchBar
            value={search}
            placeholder="Search Patient"
            onChangeText={setSearch}
            onPressSearch={() => loadPatients(search.trim(), "search", filterTab)}
            onPressAction={() => setSearch("")}
            isLoading={searching}
          />
        </HeaderTitle>
      )}
    >
      <View style={styles.container}>
        <View style={styles.filterTabs}>
          {[
            { key: "ALL", label: "All Patients" },
            { key: "TODAY_SCHEDULED", label: "Today Scheduled" },
          ].map((tab) => {
            const active = filterTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  if (active) return;
                  setPatients([]);
                  setLoadError(null);
                  setFilterTab(tab.key as "ALL" | "TODAY_SCHEDULED");
                }}
                style={[styles.filterTab, active && styles.filterTabActive]}
              >
                <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <FlatList
          data={patients}
          style={styles.patientList}
          keyExtractor={(item, index) =>
            String(item.patient_id ?? `patient-${index}`)
          }
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => loadPatients(debouncedSearch, "refresh", filterTab)}
          contentContainerStyle={[
            styles.listContent,
            !patients.length && styles.emptyListContent,
          ]}
          ListHeaderComponent={
            !!loadError && !!patients.length ? (
              <Text accessibilityRole="alert" style={styles.emptyCopy}>{loadError}</Text>
            ) : null
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading patients...</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="people-outline" size={30} color={ACCENT} />
                </View>
                <Text style={styles.emptyTitle}>{loadError ? "Unable to load patients" : "No patients found"}</Text>
                <Text style={styles.emptyCopy}>
                  {loadError || "Try another name, ID, or patient status."}
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <PatientCard
              patient={item}
              onCallPress={() => { if (!openingRef.current) navigation.navigate("Voice", { patient: item, autoStart: true }); }}
              onViewPress={() => openPatient(item)}
              isLoading={false}
              disabled={false}
              showAppointmentInfo={filterTab === "TODAY_SCHEDULED"}
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
  filterTabs: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    flexWrap: "wrap",
  },
  filterTab: {
    minHeight: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E3E8F5",
    backgroundColor: "#F2F5FF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterTabActive: {
    backgroundColor: "#DFF6F1",
    borderColor: "#A9E7DB",
    shadowColor: "#A9E7DB",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  filterTabText: {
    color: "#6A7AB2",
    fontSize: 11.5,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.15,
  },
  filterTabTextActive: {
    color: "#0F8F7D",
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
  loadingText: { marginTop: 12, color: COLORS.textLight, fontSize: 13 },
});
