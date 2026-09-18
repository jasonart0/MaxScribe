import { CustomButton, ScreenWrapper } from "@components";
import { faildMessage, setHeight, setWidth } from "@lib";
import { generateAINotes } from "api/voice";
import { COLORS } from "constants/Colors";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import type { ConversationMessage, ScreenProps } from "types/navigation";

export default function Transcript({ route, navigation }: ScreenProps<"Transcript">) {
  const { patient, transcription, showChat } = route.params?.data || {};
  const [loading, setLoading] = React.useState(false);
  const processingRef = React.useRef(false);
  const handleProceed = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      setLoading(true);
      const noteData = await generateAINotes(transcription, patient?.patient_id);
      if (navigation.isFocused?.() === false) return;
        navigation.navigate("Notes", {
          data: {
            patient: patient,
            transcription: transcription,
            jsonData: noteData,
          },
        });
    } catch (err) {
      faildMessage(err instanceof Error ? err.message : "Clinical note generation failed. Please try again.");
    } finally {
      processingRef.current = false;
      setLoading(false);
    }
  };
  const renderItem = ({ item }: { item: ConversationMessage }) => {
    const isDoctor = item.speaker.trim().toLowerCase() === "doctor";

    return (
      <View
        style={[
          styles.messageContainer,
          isDoctor ? styles.doctorMessage : styles.patientMessage,
        ]}
      >
        <Text style={styles.speakerText}>{item.speaker}</Text>
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
          isLoading={loading}
          style={styles.procedBtn}
          textStyle={{ fontSize: setHeight(1.8) }}
        />
      )}
    >
      {/* Back Button */}
      <FlatList
        data={showChat}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        ListEmptyComponent={() => (
          <Text style={styles.messageText}>{transcription}</Text>
        )}
        ListHeaderComponent={() => (
          <Text
            style={{
              color: "black",
              fontSize: 18,
              fontWeight: "600",
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
  procedBtn: {
    width: setWidth(90),
    borderRadius: setHeight(1),
    marginBottom: setHeight(2),
    alignSelf: "center",
  },
  messageContainer: {
    margin: 8,
    padding: 12,
    borderRadius: 8,
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
  speakerText: { fontSize: 12, fontWeight: "500", color: COLORS.textLight, marginBottom: 4 },
});
