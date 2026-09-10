import { CustomButton, ScreenWrapper } from "@components";
import { setHeight, setWidth } from "@lib";
import { generateAINotes } from "api/voice";
import AIProcessingLoader from "components/AnimationLoad";
import { COLORS } from "constants/Colors";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

export default function Transcript({ route, navigation }) {
  const { patient, transcription, showChat } = route.params?.data || {};
  const [loading, setLoading] = React.useState(false);
  const handleProceed = async () => {
    try {
      setLoading(true);
      generateAINotes(transcription).then((noteData) => {
        setLoading(false);
        navigation.navigate("Notes", {
          data: {
            patient: patient,
            transcription: transcription,
            jsonData: noteData,
          },
        });
      });
      // Reset after upload
    } catch (err) {
      setLoading(false);
      console.error("Upload error:", err);
    }
  };
  const renderItem = ({ item }) => {
    const isDoctor = item.speaker === "Doctor";

    return (
      <View
        style={[
          styles.messageContainer,
          !isDoctor ? styles.doctorMessage : styles.patientMessage,
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  };
  return (
    <ScreenWrapper
      title={patient?.name}
      footerUnScrollable={() => (
        <CustomButton
          title={"Generate Note"}
          onPress={handleProceed}
          style={styles.procedBtn}
          textStyle={{ fontSize: setHeight(1.8) }}
        />
      )}
    >
      {/* Back Button */}
      {loading && <AIProcessingLoader visible={loading} />}
      <FlatList
        data={showChat}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        ListHeaderComponent={() => (
          <Text
            style={{
              color: "black",
              fontSize: 18,
              fontWeight: "semibold",
              marginLeft: 16,
              alignSelf: "center",
              textDecorationLine: "underline",
            }}
          >
            Transcription
          </Text>
        )}
      />
    </ScreenWrapper>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: setHeight(2),
    paddingVertical: setHeight(1),
  },
  backBtn: {
    borderRadius: 50,
    padding: 12,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    alignContent: "center",
  },
  backIcon: { width: 18, height: 18, tintColor: "#FFF" },
  scroll: {
    paddingHorizontal: setHeight(2),
    paddingBottom: setHeight(2),
  },
  cardList: {
    borderRadius: 16,
    marginTop: 12,
    overflow: "hidden",
  },
  emptyCard: { padding: 16 },
  emptyText: { color: COLORS.textLight, fontSize: 14 },
  button: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 6,
    marginHorizontal: 5,
  },
  text: {
    color: COLORS.primary,
    fontWeight: "500",
  },
  activeButton: {
    backgroundColor: COLORS.primary,
  },
  activeText: {
    color: "#fff",
  },
  procedBtn: {
    width: setWidth(90),
    borderRadius: setHeight(1),
    marginBottom: setHeight(2),
    alignSelf: "center",
  },
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  messageContainer: {
    margin: 8,
    padding: 12,
    borderRadius: 12,
    maxWidth: "80%",
  },
  doctorMessage: {
    backgroundColor: "#ffffffff",
    alignSelf: "flex-start",
  },
  patientMessage: {
    backgroundColor: COLORS.secondary,
    alignSelf: "flex-end",
  },
  messageText: { fontSize: 16, color: "#333" },
});
