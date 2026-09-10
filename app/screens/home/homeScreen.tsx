import { ScreenWrapper } from "@components";
import { isNotEmpty, setHeight, setWidth } from "@lib";
import { fetchPatients, fetchPatientsbySearch } from "api/patients";
import { COLORS } from "constants/Colors";
import { useDebounce } from "hooks/useDebounce";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FacebookLoader } from "react-native-easy-content-loader";
import CustomSearchBar from "../../components/CustomSearchBar";
import PatientCard from "../../components/PatientCard";

export default function HomeScreen({ navigation }: any) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("Yesterday");
  const [patients, setPatients] = useState([]);
  const debouncedSearch = useDebounce(search, 800);

  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true);
      if (!debouncedSearch) {
        const data = await fetchPatients();
        setPatients(data || []);
      } else {
        const data = await fetchPatientsbySearch(debouncedSearch);
        setPatients(data || []);
      }
      setLoading(false);
    };

    loadPatients();
  }, [debouncedSearch]);
  // useEffect(() => {
  //   if (isNotEmpty(search)) {
  //     return;
  //   }
  //   fetchPatients().then((data) => setPatients(data || []));
  // }, []);
  const handleSearch = () => {
    if (!isNotEmpty(search)) {
      fetchPatients().then((data) => setPatients(data || []));
      return;
    }
    try {
      setLoading(true);
      fetchPatientsbySearch(search).then((data) => {
        setPatients(data || []);
        setLoading(false);
      });
    } catch (error) {
      setLoading(true);
    }
  };

  return (
    <ScreenWrapper title="Find Your Patients" showback={false}>
      <View style={styles.container}>
        <CustomSearchBar
          value={search}
          onChangeText={setSearch}
          onPressSearch={handleSearch}
          onPressAction={() => {
            setSearch("");
            handleSearch("");
          }}
        />

        {/* Selector */}
        {/* <CustomSelector
          options={["Today", "Yesterday", "This Week", "All"]}
          selected={filter}
          onSelect={setFilter}
          containerStyle={{
            justifyContent: "space-around",
            marginVertical: 10,
          }}
        /> */}

        <FlatList
          data={patients}
          keyExtractor={(item) => item?.patient_id.toString()}
          ListHeaderComponent={
            loading ? <ActivityIndicator color={COLORS.primary} /> : null
          }
          ListEmptyComponent={
            !loading ? (
              <Text style={{ textAlign: "center", marginTop: setHeight(5) }}>
                No patients found.
              </Text>
            ) : (
              <FacebookLoader
                active
                tHeight={10}
                tWidth={setWidth(70)}
                pRows={1}
                pHeight={15}
                listSize={8}
              />
            )
          }
          renderItem={({ item }) => (
            <PatientCard
              patient={item}
              onCallPress={() =>
                navigation.navigate("Voice", { patient: item })
              }
              onViewPress={() => {
                navigation.navigate("PatientDetails", item);
              }}
            />
          )}
          contentContainerStyle={{ paddingBottom: 50 }}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 10,
    color: "#002B45",
  },
});
