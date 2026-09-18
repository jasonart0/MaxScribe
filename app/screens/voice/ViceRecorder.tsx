import { CustomButton, ScreenWrapper } from "@components";
import { Ionicons } from "@expo/vector-icons";
import { faildMessage } from "@lib";
import { generateChat, uploadVoiceFile } from "api/voice";
import PlayRecordedAudio from "components/AudioPlayer";
import RecordingMic, { RecordingBackdrop, RecordingWaves } from "components/RecordingVisual";
import { SAMPLE_NOTE } from "constants/dummyData";
import { useVoiceRecorder } from "hooks/useAudioRecording";
import type { ScreenProps } from "types/navigation";
import * as React from "react";
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";

type Clip = { id: number; uri: string; duration: number; transcript?: string };

export default function VoiceRecordScreen({ navigation, route }: ScreenProps<"Voice">) {
  const { height, width } = useWindowDimensions();
  const patient = route.params?.patient || {};
  const [clips, setClips] = React.useState<Clip[]>([]);
  const heroSize = Math.min(clips.length ? 160 : 220, width * 0.57, height * (clips.length ? 0.19 : 0.25));
  const clipId = React.useRef(0);
  const [loading, setLoading] = React.useState(false);
  const [loadingAction, setLoadingAction] = React.useState<"proceed" | "sample" | null>(null);
  const [processingStage, setProcessingStage] = React.useState<"transcribing" | "conversation">("transcribing");
  const [processingClip, setProcessingClip] = React.useState(1);
  const processingRef = React.useRef(false);
  const { isRecording, isPaused, isBusy, recordingError, timer, metering, formatTime,
    startRecording, pauseRecording, resumeRecording, stopRecording } = useVoiceRecorder();
  const autoStartHandled = React.useRef(false);
  const processing = loading && loadingAction === "proceed";

  React.useEffect(() => {
    if (route.params?.autoStart && !autoStartHandled.current) {
      autoStartHandled.current = true;
      void startRecording();
    }
  }, [route.params?.autoStart, startRecording]);

  const toggleRecording = async () => {
    if (isBusy || loading) return;
    if (isRecording) {
      const uri = await stopRecording();
      if (uri) {
        const clip = { id: ++clipId.current, uri, duration: timer };
        setClips((previous) => [...previous, clip]);
      }
    } else { await startRecording(); }
  };

  const cancelRecording = async () => {
    if (isBusy || loading) return;
    if (isRecording) await stopRecording();
    navigation.goBack();
  };

  const handleProceed = async () => {
    if (!clips.length || processingRef.current) return;
    processingRef.current = true;
    setLoadingAction("proceed");
    setProcessingStage("transcribing");
    setProcessingClip(1);
    try {
      setLoading(true);
      const transcripts: string[] = [];
      for (let index = 0; index < clips.length; index++) {
        const clip = clips[index];
        setProcessingClip(index + 1);
        const text = clip.transcript ?? await uploadVoiceFile(clip.uri);
        transcripts.push(text);
        setClips((previous) => previous.map((item) => item.id === clip.id ? { ...item, transcript: text } : item));
      }
      const transcription = transcripts.join("\n\n");
      setProcessingStage("conversation");
      let showChat = [];
      try { showChat = await generateChat(transcription); }
      catch (error) { faildMessage(error instanceof Error ? error.message : "Conversation generation failed. Your transcript is still available."); }
      if (navigation.isFocused?.() === false) return;
      navigation.navigate("Transcript", { data: { patient, transcription, showChat } });
    } catch (error) {
      faildMessage(error instanceof Error ? error.message : "Audio transcription failed. Please try again.");
    } finally { processingRef.current = false; setLoading(false); setLoadingAction(null); }
  };

  const handleSampleload = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setLoadingAction("sample");
    try {
      setLoading(true);
      const showChat = await generateChat(SAMPLE_NOTE);
      if (navigation.isFocused?.() === false) return;
      navigation.navigate("Transcript", { data: { patient, transcription: SAMPLE_NOTE, showChat } });
    } catch (error) { faildMessage(error instanceof Error ? error.message : "Sample processing failed. Please try again."); }
    finally { processingRef.current = false; setLoading(false); setLoadingAction(null); }
  };

  const title = processing ? "Transcribing" : isPaused ? "Paused" : isRecording ? "Recording" : clips.length ? "Recording saved" : "Ready to record";
  const status = processing ? processingStage === "transcribing" ? `Transcribing clip ${processingClip} of ${clips.length}...` : "Preparing conversation..."
    : isPaused ? "Tap resume when you're ready." : isRecording ? "Recording..." : clips.length ? "Preview your clips or record another." : "Tap the microphone to begin.";

  return <ScreenWrapper title="Patient Visit" scrollEnabled background={<RecordingBackdrop />}
    barStyle="light-content" statusBarColor="#061C55"
    headerUnScrollable={() => <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" disabled={loading || isBusy}
        hitSlop={12} onPress={cancelRecording}><Ionicons name="chevron-back" size={32} color="#FFFFFF" /></Pressable>
      <Text numberOfLines={1} style={styles.patient}>{patient.name}</Text><View style={{ width: 32 }} />
    </View>}
    footerUnScrollable={() => clips.length ? <View style={styles.footer}>
      <View style={styles.clipsHeading}><Text style={styles.clipsTitle}>Recordings · {clips.length}</Text>
        {!isRecording && <Pressable accessibilityRole="button" accessibilityLabel="Record another clip" disabled={loading || isBusy}
          onPress={toggleRecording} style={styles.recordAgain}><Ionicons name="add" size={17} color="#D9F6FF" /><Text style={styles.recordAgainText}>Record again</Text></Pressable>}
      </View>
      <ScrollView style={{ maxHeight: isRecording ? 70 : Math.min(185, height * 0.22) }} showsVerticalScrollIndicator={false}>
        {clips.map((clip, index) => <View key={clip.id} style={styles.clipCard}>
          <View style={styles.clipHeading}><Text style={styles.clipTitle}>Clip {index + 1} · {formatTime(clip.duration)}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Delete clip ${index + 1}`} disabled={loading || isBusy || isRecording}
              hitSlop={8} onPress={() => setClips((previous) => previous.filter((item) => item.id !== clip.id))}>
              <Ionicons name="trash-outline" size={18} color="#47739E" />
            </Pressable>
          </View>
          {!isRecording && !isBusy && !loading && <PlayRecordedAudio uri={clip.uri} />}
        </View>)}
      </ScrollView>
      {!isRecording && <View style={styles.actions}><CustomButton title="Proceed" onPress={handleProceed} disabled={loading || isBusy}
        style={styles.proceed} textStyle={styles.proceedText} />
        {__DEV__ && <CustomButton title="Load Sample" onPress={handleSampleload} isLoading={loading && loadingAction === "sample"}
          disabled={loading || isRecording} style={styles.sample} />}
      </View>}
    </View> : null}>
    <View style={styles.main}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{processing ? "Turning your recordings into a transcript." : "Speak clearly, we’re listening."}</Text>
      <View style={styles.mic}><RecordingMic size={heroSize} active={isRecording && !isPaused && !processing}
        processing={processing} stage={processingStage} /></View>
      <Text style={styles.timer}>{formatTime(timer)}</Text>
      <Text style={styles.status} accessibilityLiveRegion="polite">{status}</Text>
      {processing && <Text style={styles.estimate}>Estimated progress</Text>}
      {!processing && <RecordingWaves active={isRecording && !isPaused} metering={metering} />}
      {!!recordingError && <Text accessibilityRole="alert" style={styles.error}>{recordingError}</Text>}
      <View style={styles.controls}>
        {isRecording ? <>
          <View style={styles.control}><TouchableOpacity accessibilityRole="button" accessibilityLabel={isPaused ? "Resume recording" : "Pause recording"}
            disabled={isBusy || loading} style={styles.sideButton} onPress={isPaused ? resumeRecording : pauseRecording}>
            <Ionicons name={isPaused ? "play" : "pause"} size={28} color="#E8F8FF" /></TouchableOpacity>
            <Text style={styles.controlLabel}>{isPaused ? "Resume" : "Pause"}</Text></View>
          <View style={styles.control}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Stop recording" disabled={isBusy || loading}
            style={styles.stopButton} onPress={toggleRecording}><View style={styles.stopSquare} /></TouchableOpacity><Text style={styles.stopLabel}>Stop</Text></View>
          <View style={styles.control}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Cancel recording" disabled={isBusy || loading}
            style={styles.sideButton} onPress={cancelRecording}><Ionicons name="close" size={34} color="#E8F8FF" /></TouchableOpacity><Text style={styles.controlLabel}>Cancel</Text></View>
        </> : !clips.length ? <View style={styles.control}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Start recording"
          disabled={isBusy || loading} style={styles.stopButton} onPress={toggleRecording}><Ionicons name="mic-outline" size={32} color="#147BCB" /></TouchableOpacity>
          <Text style={styles.stopLabel}>{isBusy ? "Starting..." : "Start Recording"}</Text></View> : null}
      </View>
    </View>
  </ScreenWrapper>;
}

const styles = StyleSheet.create({
  header: { height: 48, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  patient: { color: "#C1E6FF", fontSize: 13, flex: 1, textAlign: "center", paddingHorizontal: 12 },
  main: { alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  title: { color: "#FFFFFF", fontSize: 32, fontWeight: "600", textAlign: "center" },
  subtitle: { color: "#B9DEFF", fontSize: 15, marginTop: 7, textAlign: "center" },
  mic: { marginTop: 16, marginBottom: 5 },
  timer: { color: "#FFFFFF", fontSize: 38, fontWeight: "300", fontVariant: ["tabular-nums"] },
  status: { color: "#BDE8FF", fontSize: 14, marginTop: 3, marginBottom: 4, textAlign: "center" },
  estimate: { color: "#BDE8FF", fontSize: 11, marginTop: 8 },
  controls: { flexDirection: "row", justifyContent: "space-evenly", width: "100%", alignItems: "center", marginTop: 12 },
  control: { alignItems: "center", gap: 8 },
  sideButton: { width: 62, height: 62, borderRadius: 31, borderWidth: 1.5, borderColor: "rgba(197,235,255,0.4)", alignItems: "center", justifyContent: "center" },
  stopButton: { width: 74, height: 74, borderRadius: 37, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#BAEDFF", shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  stopSquare: { width: 22, height: 22, borderRadius: 5, backgroundColor: "#FF5367" },
  controlLabel: { color: "#BDE8FF", fontSize: 13 },
  stopLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  error: { color: "#FFE3E7", textAlign: "center", fontSize: 13, marginTop: 8 },
  footer: { gap: 9, paddingBottom: 4 },
  clipsHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  clipsTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  recordAgain: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 36 },
  recordAgainText: { color: "#D9F6FF", fontSize: 13 },
  clipCard: { borderRadius: 14, backgroundColor: "rgba(245,252,255,0.95)", padding: 10, marginBottom: 8 },
  clipHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  clipTitle: { color: "#20557F", fontSize: 12, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 10 },
  proceed: { flex: 1, width: "auto", backgroundColor: "#EDF9FF", shadowOpacity: 0, elevation: 0 },
  proceedText: { color: "#0875BF", fontWeight: "600" },
  sample: { flex: 1, width: "auto" },
});
