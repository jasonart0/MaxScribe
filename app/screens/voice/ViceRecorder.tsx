// import { localImages } from "@assets";
import { CustomButton, ScreenWrapper } from "@components";
import { Ionicons } from "@expo/vector-icons";
import { faildMessage, setHeight, setWidth } from "@lib";
import { useNavigation, useRoute } from "@react-navigation/native";
import { generateChat, uploadVoiceFile } from "api/voice";
import AIProcessingLoader from "components/AnimationLoad";
import PlayRecordedAudio from "components/AudioPlayer";
import { COLORS } from "constants/Colors";
import { SAMPLE_NOTE } from "constants/dummyData";
import { useVoiceRecorder } from "hooks/useAudioRecording";
import * as React from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
function VoiceRecordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const patient = route.params?.patient || {};
  const autoStart = route.params?.autoStart === true;
  const [loading, setLoading] = React.useState(false);
  const {
    isRecording,
    isPaused,
    statusMessage,
    timer,
    setTimer,
    formatTime,
    startRecording,
    pauseRecording,
    resumeRecording,
    animValues,
    stopRecording,
  } = useVoiceRecorder();

  const [recordedUri, setRecordedUri] = React.useState<string | null>(null);
  const autoStartHandled = React.useRef(false);

  React.useEffect(() => {
    if (autoStart && !autoStartHandled.current) {
      autoStartHandled.current = true;
      void startRecording();
    }
  }, [autoStart, startRecording]);

  const toggleRecording = async () => {
    if (isRecording) {
      const uri = await stopRecording();
      if (uri) setRecordedUri(uri); // store the file
    } else {
      setRecordedUri(null); // reset old file
      startRecording();
    }
  };

  const handleProceed = async () => {
    if (!recordedUri) return;

    try {
      setLoading(true);
      uploadVoiceFile(recordedUri)
        .then((d) => {
          generateChat(d)
            .then((data) => {

              setLoading(false);
              setRecordedUri(null);
              setTimer(0);
              navigation.navigate("Transcript", {
                data: {
                  patient: patient,
                  transcription: d,
                  showChat: data,
                },
              });
            })
            .catch(() => {
              setLoading(false);
              faildMessage("Something went wrong. Please try again later.");
            });
        })
        .catch(() => {
          setLoading(false);
          faildMessage("Something went wrong. Please try again later.");
        });
      // Reset after upload
    } catch (err) {
      setLoading(false);
      console.error("Upload error:", err);
    }
  };
  const handleSampleload = async () => {
    try {
      setLoading(true);
      generateChat(SAMPLE_NOTE).then((data) => {
        setLoading(false);
        navigation.navigate("Transcript", {
          data: {
            patient: patient,
            transcription: SAMPLE_NOTE,
            showChat: data,
          },
        });
      });
      // Reset after upload
      setRecordedUri(null);
      setTimer(0);
    } catch (err) {
      setLoading(false);
      console.error("Upload error:", err);
    }
  };

  return (
    <ScreenWrapper
      title="Recording"
      footerUnScrollable={() => {
        return (
          recordedUri && (
            <>
              <CustomButton
                title={"Proceed"}
                onPress={handleProceed}
                style={styles.procedBtn}
              />
              <CustomButton
                title={"Load Sample"}
                onPress={handleSampleload}
                style={styles.procedBtn}
              />
            </>
          )
        );
      }}
    >
      {loading && <AIProcessingLoader visible={loading} />}
      <View style={styles.main}>
        <View style={styles.contentWrapper}>
          <View style={styles.recordingCard}>
            <View style={styles.recordingBadge}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingBadgeText}>
                {isRecording ? "RECORDING" : "READY TO RECORD"}
              </Text>
            </View>

            <View style={styles.waveform}>
              {animValues.map((val, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.bar,
                    {
                      height: isRecording ? val : 4,
                      backgroundColor: COLORS.primary,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.timerText}>{formatTime(timer)}</Text>
            <Text style={styles.patientLabel} numberOfLines={1}>
              {patient.name || "Unknown Patient"}
            </Text>
          </View>

          <View style={styles.transcriptionCard}>
            <View style={styles.transcriptionHeader}>
              <Ionicons name="sparkles" size={15} color={COLORS.primary} />
              <Text style={styles.transcriptionTitle}>LIVE TRANSCRIPTION</Text>
            </View>
            <Text style={styles.transcriptionText}>
              {isRecording ? statusMessage : "Start recording to transcribe the visit."}
            </Text>
          </View>

          {!isRecording && !recordedUri ? (
            <TouchableOpacity style={styles.startButton} onPress={toggleRecording}>
              <Ionicons name="mic" size={20} color="#FFFFFF" />
              <Text style={styles.startButtonText}>Start Recording</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {recordedUri && (
          <View style={styles.audioPreview}>
            <PlayRecordedAudio uri={recordedUri} />
          </View>
        )}
        {isRecording ? (
          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={styles.pauseButton}
              onPress={isPaused ? resumeRecording : pauseRecording}
            >
              <Ionicons
                name={isPaused ? "play" : "pause"}
                size={17}
                color={COLORS.deep}
              />
              <Text style={styles.pauseText}>{isPaused ? "Resume" : "Pause"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stopButton} onPress={toggleRecording}>
              <View style={styles.stopSquare} />
              <Text style={styles.stopText}>Stop</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </ScreenWrapper>
  );
}
export default VoiceRecordScreen;

const styles = StyleSheet.create({
  main: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-start",
    padding: 16,
    marginTop: 15,
  },
  backBtn: { borderRadius: 50, padding: 12 },
  backIcon: { width: 18, height: 18, tintColor: "#fff" },
  backIcon1: { width: 100, height: 100 },
  contentWrapper: {
    width: "100%",
    gap: 14,
  },
  recordingCard: {
    minHeight: 270,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recordingBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
  },
  recordingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: COLORS.primary,
  },
  recordingBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  patientLabel: {
    color: COLORS.textLight,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  transcriptionCard: {
    minHeight: 220,
    borderRadius: 18,
    padding: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  transcriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  transcriptionTitle: {
    color: COLORS.textLight,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  transcriptionText: {
    color: COLORS.deep,
    fontSize: 14,
    marginTop: 14,
  },
  startButton: {
    height: 52,
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  avatarImage: {
    width: setHeight(20),
    height: setHeight(20),
    borderRadius: setHeight(10),
    resizeMode: "contain",
  },
  avatarImage1: {
    width: setHeight(30),
    height: setHeight(10),
    resizeMode: "contain",
  },
  avatarCircle: {
    width: 150,
    height: 150,
    borderRadius: 40,
    backgroundColor: "green",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "black", fontWeight: "bold", fontSize: 30 },
  nameText: {
    fontSize: setHeight(2.5),
    fontWeight: "600",
    marginTop: 12,
    color: COLORS.primary,
    alignSelf: "center",
    textAlign: "center",
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 6,
  },
  statusText: { color: "#fff", fontSize: 12, fontWeight: "500" },
  transcriptionWrapper: { marginVertical: setHeight(2), alignItems: "center" },
  transcriptionLine3: {
    fontSize: 16,
    color: "black",
    fontWeight: "600",
    textAlign: "center",
  },
  timerWrapper: { alignItems: "center" },
  timerText: {
    fontSize: 38,
    fontWeight: "700",
    color: COLORS.deep,
    marginTop: 8,
    letterSpacing: 1,
  },
  bottomControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 18,
  },
  pauseButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pauseText: {
    color: COLORS.deep,
    fontSize: 14,
    fontWeight: "600",
  },
  stopButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.deep,
  },
  stopSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },
  stopText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  audioPreview: {
    marginTop: 12,
    marginBottom: 8,
  },
  micButton: {
    width: setHeight(15),
    height: setHeight(15),
    borderRadius: setHeight(10),
    padding: setHeight(1),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EEEEEE",
    borderWidth: 1,
    borderColor: "lightgrey",
  },
  bottomMicIcon: { width: 36, height: 36, tintColor: "#fff" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  modalContent: {
    backgroundColor: "#fff",
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: { fontSize: 16, color: "black", marginTop: 10 },
  pausebutton: {
    backgroundColor: "#EEEEEE",
    borderRadius: setHeight(10),
    width: setHeight(7),
    height: setHeight(7),
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: setHeight(1),
    borderWidth: 1,
    borderColor: "lightgrey",
  },
  pausebar: {
    backgroundColor: COLORS.primary,
    width: setHeight(0.7),
    height: setHeight(3),
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  endbar: {
    backgroundColor: COLORS.primary,
    width: setHeight(2.5),
    height: setHeight(2.5),
    borderRadius: setHeight(0.3),
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  procedBtn: {
    marginTop: setHeight(1),
    width: setWidth(90),
    borderRadius: setHeight(1),
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 84,
    marginTop: 18,
  },
  bar: {
    width: 3,
    marginHorizontal: 2.5,
    borderRadius: 4,
  },
});
