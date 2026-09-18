import { CustomButton, ScreenWrapper } from "@components";
import { Ionicons } from "@expo/vector-icons";
import { faildMessage, setHeight, setWidth } from "@lib";
import { generateChat, uploadVoiceFile } from "api/voice";
import AIProcessingLoader from "components/AnimationLoad";
import PlayRecordedAudio from "components/AudioPlayer";
import RecordingWaveform from "components/RecordingWaveform";
import { COLORS } from "constants/Colors";
import { SAMPLE_NOTE } from "constants/dummyData";
import { useVoiceRecorder } from "hooks/useAudioRecording";
import type { ScreenProps } from "types/navigation";
import * as React from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
function VoiceRecordScreen({ navigation, route }: ScreenProps<"Voice">) {
  const { height, width } = useWindowDimensions();
  const heroSize = Math.min(220, width * 0.58, height * 0.24);
  const patient = route.params?.patient || {};
  const autoStart = route.params?.autoStart === true;
  const [loading, setLoading] = React.useState(false);
  const processingRef = React.useRef(false);
  const {
    isRecording,
    isPaused,
    isBusy,
    recordingError,
    statusMessage,
    timer,
    metering,
    formatTime,
    startRecording,
    pauseRecording,
    resumeRecording,
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
    if (isBusy || loading) return;
    if (isRecording) {
      const uri = await stopRecording();
      if (uri) setRecordedUri(uri); // store the file
    } else {
      setRecordedUri(null); // reset old file
      await startRecording();
    }
  };

  const handleProceed = async () => {
    if (!recordedUri || processingRef.current) return;
    processingRef.current = true;

    try {
      setLoading(true);
      const transcription = await uploadVoiceFile(recordedUri);
      let showChat = [];
      try {
        showChat = await generateChat(transcription);
      } catch (error) {
        faildMessage(error instanceof Error ? error.message : "Conversation generation failed. Your transcript is still available.");
      }
      navigation.navigate("Transcript", {
        data: { patient, transcription, showChat },
      });
      // Keep the clip available when the user returns from the transcript.
    } catch (err) {
      faildMessage(err instanceof Error ? err.message : "Audio transcription failed. Please try again.");
    } finally {
      processingRef.current = false;
      setLoading(false);
    }
  };
  const handleSampleload = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      setLoading(true);
      const data = await generateChat(SAMPLE_NOTE);
        navigation.navigate("Transcript", {
          data: {
            patient: patient,
            transcription: SAMPLE_NOTE,
            showChat: data,
          },
        });
      // Keep the recorded clip available while the sample is being processed.
    } catch (err) {
      faildMessage(err instanceof Error ? err.message : "Sample processing failed. Please try again.");
    } finally {
      processingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper
      title="Patient Visit"
      headerUnScrollable={() => (
        <View style={styles.header}>
          <Pressable accessibilityLabel="Go back" hitSlop={12} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={30} color="#181B78" />
          </Pressable>
          <Text style={styles.headerTitle}>Patient Visit</Text>
          <View style={{ width: 30 }} />
        </View>
      )}
      footerUnScrollable={() => {
        return (
          recordedUri && (
            <View style={styles.recordedFooter}>
              <View style={styles.audioPreview}>
                <PlayRecordedAudio uri={recordedUri} />
              </View>
              <View style={styles.actionRow}>
              <CustomButton
                title={"Proceed"}
                onPress={handleProceed}
                isLoading={loading}
                style={styles.footerAction}
                textStyle={styles.footerActionText}
              />
              {__DEV__ && <CustomButton
                title={"Load Sample"}
                onPress={handleSampleload}
                isLoading={loading}
                style={styles.footerAction}
                textStyle={styles.footerActionText}
              />}
              </View>
            </View>
          )
        );
      }}
    >
      {loading && <AIProcessingLoader visible={loading} />}
      <View style={styles.main}>
        <View pointerEvents="none" style={styles.backgroundCircle} />
        <View style={styles.contentWrapper}>
          <View style={[styles.hero, { width: heroSize, height: heroSize }]}>
            <View style={styles.innerHalo} />
            <View style={styles.micCircle}>
              <Ionicons name="mic" size={heroSize * 0.30} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.listeningText}>
            {isPaused ? "Paused" : isRecording ? "Listening..." : recordedUri ? "Recording Complete" : "Ready to Record"}
          </Text>
          <RecordingWaveform active={isRecording && !isPaused} metering={metering} />
            <Text style={styles.timerText}>{formatTime(timer)}</Text>

          {!isRecording && !recordedUri ? (
            <TouchableOpacity disabled={isBusy} style={styles.startButton} onPress={toggleRecording}>
              <Ionicons name="mic" size={20} color="#FFFFFF" />
              <Text style={styles.startButtonText}>{isBusy ? "Starting..." : "Start Recording"}</Text>
            </TouchableOpacity>
          ) : null}
        {isRecording ? (
          <View style={styles.bottomControls}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={isPaused ? "Resume recording" : "Pause recording"}
              style={styles.pauseButton}
              disabled={isBusy}
              onPress={isPaused ? resumeRecording : pauseRecording}
            >
              <Ionicons
                name={isPaused ? "play" : "pause"}
                size={33}
                color="#2359AC"
              />
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Stop recording"
              disabled={isBusy} style={styles.stopButton} onPress={toggleRecording}>
              <View style={styles.stopSquare} />
            </TouchableOpacity>
          </View>
        ) : null}
        </View>
        <View style={styles.transcriptionCard}>
          <View style={styles.transcriptionIcon}>
            <Ionicons name="pulse" size={33} color="#377BFA" />
          </View>
          <Text style={styles.transcriptionText}>
            {recordingError ? recordingError : isPaused ? "Recording paused. Tap resume to continue."
              : isRecording ? statusMessage || "Recording patient and provider voices..."
              : recordedUri ? "Recording saved. Preview it or proceed to generate notes."
              : "Record patient and provider voices..."}
          </Text>
        </View>
      </View>
    </ScreenWrapper>
  );
}
export default VoiceRecordScreen;

const styles = StyleSheet.create({
  recordedFooter: { paddingBottom: 8, flexShrink: 0,
    backgroundColor: COLORS.background },
  actionRow: { width: setWidth(90), alignSelf: "center", flexDirection: "row",
    alignItems: "center", gap: 12, marginTop: 10, marginBottom: setHeight(2) },
  footerAction: { flex: 1, width: "auto", borderRadius: setHeight(1),
    marginVertical: 0, paddingVertical: 12 },
  footerActionText: { fontSize: setHeight(1.8), fontWeight: "500" },
  header: { height: 62, paddingHorizontal: 20, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between", backgroundColor: COLORS.background },
  headerTitle: { color: "#181B78", fontSize: 22, fontWeight: "700" },
  backgroundCircle: { position: "absolute", width: 120, height: 120, borderRadius: 60,
    left: -90, top: 220, backgroundColor: "#E8F4FF" },
  hero: { alignSelf: "center", borderRadius: 999, backgroundColor: "#F0F6FC",
    alignItems: "center", justifyContent: "center" },
  innerHalo: { position: "absolute", width: "78%", height: "78%",
    borderRadius: 999, backgroundColor: "#E8F1FA" },
  micCircle: { width: "61%", height: "61%", alignItems: "center", justifyContent: "center",
    borderRadius: 999, overflow: "hidden", backgroundColor: COLORS.primary },
  listeningText: { color: "#181B78", fontSize: 22, fontWeight: "700",
    textAlign: "center", marginTop: 8 },
  transcriptionIcon: { width: 54, height: 54, borderRadius: 27,
    backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  main: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 20,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  contentWrapper: {
    width: "100%",
    gap: 4,
  },
  transcriptionCard: {
    minHeight: 86,
    borderRadius: 8,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#F0F6FC",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  transcriptionText: {
    flex: 1,
    color: "#2458AE",
    fontSize: 16,
    lineHeight: 23,
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
  timerText: {
    fontSize: 30,
    fontWeight: "700",
    color: "#181B78",
    marginTop: 0,
    textAlign: "center",
    letterSpacing: 1,
  },
  bottomControls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 65,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 12,
  },
  pauseButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#D8EDFF",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  stopButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FF5D5E",
  },
  stopSquare: {
    width: 25,
    height: 25,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  audioPreview: {
    marginTop: 12,
    marginBottom: 8,
  },
});
