import { CustomButton, ScreenWrapper } from "@components";
import { Ionicons } from "@expo/vector-icons";
import { faildMessage } from "@lib";
// Babel maps this virtual module to ignored local media only in development.
// eslint-disable-next-line import/no-unresolved
import localTestAudio from "@local-test-audio";
import { generateChat, uploadVoiceFile } from "api/voice";
import PlayRecordedAudio from "components/AudioPlayer";
import RecordingMic, { RecordingBackdrop, RecordingWaves } from "components/RecordingVisual";
import { SAMPLE_NOTE } from "constants/dummyData";
import { Asset } from "expo-asset";
import { getInfoAsync } from "expo-file-system/legacy";
import { useVoiceRecorder } from "hooks/useAudioRecording";
import * as React from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import type { ScreenProps } from "types/navigation";

type Clip = { id: number; uri: string; duration: number; size?: number; transcript?: string };
type ProcessingStage = "sending" | "transcribing" | "conversation";
type RecordingBitRate = 10000 | 12000 | 16000;

const RECORDING_QUALITIES: { bitRate: RecordingBitRate; label: string; detail: string }[] = [
  { bitRate: 10000, label: "10 kbps", detail: "Low" },
  { bitRate: 12000, label: "12 kbps", detail: "Medium" },
  { bitRate: 16000, label: "16 kbps", detail: "High" },
];

async function getAudioSize(uri: string) {
  try {
    let size: number | undefined;
    if (Platform.OS === "web") {
      size = (await (await fetch(uri)).blob()).size;
    } else {
      const info = await getInfoAsync(uri);
      if (!info.exists || info.isDirectory) return undefined;
      size = info.size;
    }
    return Number.isFinite(size) && size >= 0 ? size : undefined;
  } catch {
    return undefined;
  }
}

function formatAudioSize(bytes?: number) {
  if (bytes == null) return "Size unavailable";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VoiceRecordScreen({ navigation, route }: ScreenProps<"Voice">) {
  const { height, width } = useWindowDimensions();
  const patient = route.params?.patient || {};
  const encounterDefaults = route.params?.encounterDefaults;
  const [clips, setClips] = React.useState<Clip[]>([]);
  const heroSize = Math.min(clips.length ? 160 : 220, width * 0.57, height * (clips.length ? 0.19 : 0.25));
  const clipId = React.useRef(0);
  const [loading, setLoading] = React.useState(false);
  const [loadingAction, setLoadingAction] = React.useState<"proceed" | "sample" | "local-audio" | null>(null);
  const [processingStage, setProcessingStage] = React.useState<ProcessingStage>("sending");
  const [processedClips, setProcessedClips] = React.useState(0);
  const [uploadPercent, setUploadPercent] = React.useState(0);
  const [estimatedProgress, setEstimatedProgress] = React.useState(0);
  const processingRef = React.useRef(false);
  const [recordingBitRate, setRecordingBitRate] = React.useState<RecordingBitRate>(12000);
  const [qualityMenuOpen, setQualityMenuOpen] = React.useState(false);
  const { isRecording, isPaused, isBusy, recordingError, timer, metering, formatTime,
    startRecording, pauseRecording, resumeRecording, stopRecording } = useVoiceRecorder(recordingBitRate);
  const [discardDialogVisible, setDiscardDialogVisible] = React.useState(false);
  const [discarding, setDiscarding] = React.useState(false);
  const allowNavigationRef = React.useRef(false);
  const pendingNavigationActionRef = React.useRef<Parameters<typeof navigation.dispatch>[0] | null>(null);
  const processing = loading && loadingAction === "proceed";
  const localTestAvailable = __DEV__ && localTestAudio != null;

  React.useEffect(() => {
    if (!processing) return;
    const cap = processingStage === "sending" ? 68 : processingStage === "transcribing" ? 90 : 98;
    const interval = setInterval(() => {
      setEstimatedProgress((current) => Math.min(cap, current + 1));
    }, 900);
    return () => clearInterval(interval);
  }, [processing, processingStage]);

  React.useEffect(() => {
    const removeListener = navigation.addListener?.("beforeRemove", (event: any) => {
      if (allowNavigationRef.current || (!isRecording && !clips.length)) return;
      event.preventDefault();
      // Processing cannot be safely cancelled halfway through an upload. The
      // visible back control is disabled in the same state, so system back is
      // ignored until the request finishes as well.
      if (loading || isBusy) return;
      pendingNavigationActionRef.current = event.data?.action ?? null;
      setDiscardDialogVisible(true);
    });
    return removeListener;
  }, [clips.length, isBusy, isRecording, loading, navigation]);

  const toggleRecording = async () => {
    if (isBusy || loading) return;
    if (isRecording) {
      const uri = await stopRecording();
      if (uri) {
        const clip = { id: ++clipId.current, uri, duration: timer, size: await getAudioSize(uri) };
        setClips((previous) => [...previous, clip]);
      }
    } else {
      setQualityMenuOpen(false);
      await startRecording();
    }
  };

  const discardAndLeave = React.useCallback(async () => {
    if (discarding) return;
    setDiscarding(true);
    try {
      if (isRecording) await stopRecording();
      setClips([]);
      setDiscardDialogVisible(false);
      allowNavigationRef.current = true;
      const pendingAction = pendingNavigationActionRef.current;
      pendingNavigationActionRef.current = null;
      if (pendingAction && navigation.dispatch) navigation.dispatch(pendingAction);
      else navigation.goBack();
    } finally {
      setDiscarding(false);
    }
  }, [discarding, isRecording, navigation, stopRecording]);

  const confirmDiscard = React.useCallback(() => {
    setDiscardDialogVisible(true);
  }, []);

  const cancelRecording = React.useCallback(() => {
    if (isBusy || loading) return;
    if (!isRecording && !clips.length) {
      navigation.goBack();
      return;
    }
    confirmDiscard();
  }, [clips.length, confirmDiscard, isBusy, isRecording, loading, navigation]);

  const handleProceed = async () => {
    if (!clips.length || processingRef.current) return;
    processingRef.current = true;
    setLoadingAction("proceed");
    setProcessingStage("sending");
    setProcessedClips(0);
    setUploadPercent(0);
    setEstimatedProgress(2);
    try {
      setLoading(true);
      const transcripts = new Array<string>(clips.length);
      const clipUploadProgress: number[] = clips.map((clip) => clip.transcript ? 100 : 0);
      const updateUploadProgress = (index: number, percent: number) => {
        clipUploadProgress[index] = Math.max(clipUploadProgress[index], percent);
        const overall = Math.round(clipUploadProgress.reduce((sum, value) => sum + value, 0) / clips.length);
        setUploadPercent(overall);
        setEstimatedProgress((current) => Math.max(current, Math.round(overall * 0.68)));
        if (overall >= 100) {
          setProcessingStage("transcribing");
          setEstimatedProgress((current) => Math.max(current, 70));
        }
      };
      let nextClipIndex = 0;
      const transcribeNext = async () => {
        while (nextClipIndex < clips.length) {
          const index = nextClipIndex++;
          const clip = clips[index];
          const text = clip.transcript ?? await uploadVoiceFile(clip.uri, {
            onUploadProgress: (percent: number) => updateUploadProgress(index, percent),
          });
          updateUploadProgress(index, 100);
          transcripts[index] = text;
          setProcessedClips((count) => {
            const completed = count + 1;
            setEstimatedProgress((current) => Math.max(current, 70 + Math.round((completed / clips.length) * 20)));
            return completed;
          });
          setClips((previous) => previous.map((item) => item.id === clip.id ? { ...item, transcript: text } : item));
        }
      };
      const transcriptionJobs = await Promise.allSettled(
        Array.from({ length: Math.min(2, clips.length) }, transcribeNext),
      );
      const failedJob = transcriptionJobs.find((job) => job.status === "rejected");
      if (failedJob?.status === "rejected") throw failedJob.reason;
      const transcription = transcripts.join("\n\n");
      setProcessingStage("conversation");
      setEstimatedProgress((current) => Math.max(current, 92));
      let showChat = [];
      try { showChat = await generateChat(transcription); }
      catch (error) { faildMessage(error instanceof Error ? error.message : "Conversation generation failed. Your transcript is still available."); }
      if (navigation.isFocused?.() === false) return;
      // The transcript owns the completed result. Clearing local clips keeps a
      // later stack reset from being mistaken for an attempt to discard audio.
      setClips([]);
      navigation.navigate("Transcript", { data: { patient, transcription, showChat, ...(encounterDefaults ? { encounterDefaults } : {}) } });
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
      navigation.navigate("Transcript", { data: { patient, transcription: SAMPLE_NOTE, showChat, ...(encounterDefaults ? { encounterDefaults } : {}) } });
    } catch (error) { faildMessage(error instanceof Error ? error.message : "Sample processing failed. Please try again."); }
    finally { processingRef.current = false; setLoading(false); setLoadingAction(null); }
  };

  const handleLocalTestAudio = async () => {
    if (!__DEV__ || localTestAudio == null || processingRef.current || isRecording) return;
    processingRef.current = true;
    setLoadingAction("local-audio");
    setLoading(true);
    try {
      const asset = Asset.fromModule(localTestAudio);
      await asset.downloadAsync();
      const uri = asset.localUri || asset.uri;
      if (!uri) throw new Error("Local test audio could not be loaded.");
      setClips([{ id: ++clipId.current, uri, duration: 0, size: await getAudioSize(uri) }]);
    } catch (error) {
      faildMessage(error instanceof Error ? error.message : "Local test audio could not be loaded.");
    } finally {
      processingRef.current = false;
      setLoading(false);
      setLoadingAction(null);
    }
  };

  const processingProgress = Math.max(1, Math.min(99, estimatedProgress));
  const selectedQuality = RECORDING_QUALITIES.find((quality) => quality.bitRate === recordingBitRate) ?? RECORDING_QUALITIES[1];
  const title = processing ? processingStage === "sending" ? "Sending audio" : processingStage === "transcribing" ? "Transcribing" : "Preparing transcript"
    : isPaused ? "Paused" : isRecording ? "Recording" : clips.length ? "Recording saved" : "Ready to record";
  const status = processing ? processingStage === "sending" ? `Uploading recordings · ${uploadPercent}%`
    : processingStage === "transcribing" ? `Transcribing audio · ${processedClips} of ${clips.length} complete`
      : "Preparing conversation..."
    : isPaused ? "Tap resume when you're ready." : isRecording ? "Recording..." : clips.length ? "Preview your clips or record another." : "Tap the microphone to begin.";
  const progressLabel = processing ? `${processingProgress}%` : formatTime(timer);

  return <>
  <ScreenWrapper title="Patient Visit" scrollEnabled background={<RecordingBackdrop />}
    loading={loading && loadingAction !== "proceed"}
    loadingMessage="Loading recording..."
    barStyle="light-content" statusBarColor="#2B69C1"
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
      <ScrollView style={{ maxHeight: isRecording ? 60 : Math.min(135, height * 0.17) }} showsVerticalScrollIndicator={false}>
        {clips.map((clip, index) => <View key={clip.id} style={styles.clipCard}>
          <View style={styles.clipHeading}><Text style={styles.clipTitle}>Clip {index + 1} · {formatTime(clip.duration)} · {formatAudioSize(clip.size)}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Delete clip ${index + 1}`} disabled={loading || isBusy || isRecording}
              hitSlop={8} onPress={() => setClips((previous) => previous.filter((item) => item.id !== clip.id))}>
              <Ionicons name="trash-outline" size={16} color="#A0FFF3" />
            </Pressable>
          </View>
          {!isRecording && !isBusy && !loading && <PlayRecordedAudio uri={clip.uri} compact neon />}
        </View>)}
      </ScrollView>
      {!isRecording && <View style={styles.actions}><CustomButton title="Proceed" variant="neon" onPress={handleProceed} disabled={loading || isBusy}
        style={styles.proceed} textStyle={styles.proceedText} />
        {__DEV__ && <CustomButton title="Load Sample" variant="neon" onPress={handleSampleload}
          disabled={loading || isRecording} style={styles.sample} />}
      </View>}
    </View> : null}>
    <View style={styles.main}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{processing ? "Turning your recordings into a transcript." : "Speak clearly, we’re listening."}</Text>
      <View style={styles.mic}><RecordingMic size={heroSize} active={isRecording && !isPaused && !processing}
        processing={processing} stage={processingStage} progress={processingProgress} /></View>
      <Text style={styles.timer}>{progressLabel}</Text>
      <Text style={styles.status} accessibilityLiveRegion="polite">{status}</Text>
      {processing && <Text style={styles.estimate}>Estimated overall progress</Text>}
      {!processing && <RecordingWaves active={isRecording && !isPaused} metering={metering} />}
      {!!recordingError && <Text accessibilityRole="alert" style={styles.error}>{recordingError}</Text>}
      {!isRecording && !processing && !clips.length && <View style={styles.qualitySection}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Recording quality dropdown"
          accessibilityState={{ expanded: qualityMenuOpen, disabled: isBusy || loading }}
          disabled={isBusy || loading}
          onPress={() => setQualityMenuOpen((open) => !open)}
          style={[styles.qualityDropdown, qualityMenuOpen && styles.qualityDropdownOpen]}
        >
          <View>
            <Text style={styles.qualityValue}>{selectedQuality.detail}</Text>
            <Text style={styles.qualityBitRate}>{selectedQuality.label}</Text>
          </View>
          <Ionicons name={qualityMenuOpen ? "chevron-down" : "chevron-up"} size={20} color="#A0FFF3" />
        </Pressable>
        {qualityMenuOpen && <View accessibilityRole="menu" style={styles.qualityMenu}>
          {RECORDING_QUALITIES.map((quality) => {
            const selected = recordingBitRate === quality.bitRate;
            return <Pressable
              key={quality.bitRate}
              accessibilityRole="menuitem"
              accessibilityLabel={`${quality.detail}, ${quality.label}`}
              onPress={() => {
                setRecordingBitRate(quality.bitRate);
                setQualityMenuOpen(false);
              }}
              style={[styles.qualityMenuItem, selected && styles.qualityMenuItemSelected]}
            >
              <View>
                <Text style={[styles.qualityValue, selected && styles.qualityValueSelected]}>{quality.detail}</Text>
                <Text style={styles.qualityBitRate}>{quality.label}</Text>
              </View>
              {selected && <Ionicons name="checkmark" size={20} color="#A0FFF3" />}
            </Pressable>;
          })}
        </View>}
      </View>}
      <View style={styles.bottomControls}>
        {isRecording ? <>
          <View style={styles.control}><TouchableOpacity accessibilityRole="button" accessibilityLabel={isPaused ? "Resume recording" : "Pause recording"}
            disabled={isBusy || loading} style={styles.sideButton} onPress={isPaused ? resumeRecording : pauseRecording}>
            <Ionicons name={isPaused ? "play" : "pause"} size={28} color="#E8F8FF" /></TouchableOpacity>
            <Text style={styles.controlLabel}>{isPaused ? "Resume" : "Pause"}</Text></View>
          <View style={styles.control}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Stop recording" disabled={isBusy || loading}
            style={styles.stopButton} onPress={toggleRecording}><View style={styles.stopSquare} /></TouchableOpacity><Text style={styles.stopLabel}>Stop</Text></View>
          <View style={styles.control}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Cancel recording" disabled={isBusy || loading}
            style={styles.sideButton} onPress={cancelRecording}><Ionicons name="close" size={34} color="#E8F8FF" /></TouchableOpacity><Text style={styles.controlLabel}>Cancel</Text></View>
        </> : !clips.length ? <>
          {localTestAvailable && <View style={styles.control}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Use local test audio"
            disabled={isBusy || loading} style={styles.testButton} onPress={() => { void handleLocalTestAudio(); }}>
            <Ionicons name="flask-outline" size={29} color="#E8F8FF" /></TouchableOpacity>
            <Text style={styles.stopLabel}>{loadingAction === "local-audio" ? "Loading..." : "Test Recording"}</Text></View>}
          <View style={styles.control}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Start recording"
            disabled={isBusy || loading} style={styles.stopButton} onPress={toggleRecording}><Ionicons name="mic-outline" size={32} color="#147BCB" /></TouchableOpacity>
            <Text style={styles.stopLabel}>{isBusy ? "Starting..." : "Start Recording"}</Text></View>
        </> : null}
      </View>
      {localTestAvailable && !isRecording && clips.length > 0 && <Pressable
        accessibilityRole="button" accessibilityLabel="Use local test audio"
        disabled={loading || isBusy} onPress={() => { void handleLocalTestAudio(); }}
        style={styles.localAudioButton}>
        <Ionicons name="flask-outline" size={17} color="#D9F6FF" />
        <Text style={styles.localAudioText}>{loadingAction === "local-audio" ? "Loading test audio..." : "Test Recording"}</Text>
      </Pressable>}
    </View>
  </ScreenWrapper>
  <Modal
    animationType="fade"
    transparent
    visible={discardDialogVisible}
    onRequestClose={() => {
      if (discarding) return;
      setDiscardDialogVisible(false);
    }}
  >
    <View style={styles.dialogOverlay}>
      <View accessibilityRole="alert" style={styles.dialogCard}>
        <View style={styles.dialogIcon}>
          <Ionicons name="trash-outline" size={24} color="#FF5367" />
        </View>
        <Text style={styles.dialogTitle}>Discard recording?</Text>
        <Text style={styles.dialogText}>
          {isRecording
            ? clips.length
              ? "The current recording and all saved clips will be permanently discarded."
              : "The current recording will be permanently discarded."
            : "All saved clips will be permanently discarded."}
        </Text>
        <View style={styles.dialogActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Keep recording"
            disabled={discarding}
            onPress={() => {
              pendingNavigationActionRef.current = null;
              setDiscardDialogVisible(false);
            }}
            style={styles.keepButton}
          >
            <Text style={styles.keepButtonText}>Keep Recording</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Discard recording"
            disabled={discarding}
            onPress={() => { void discardAndLeave(); }}
            style={[styles.discardButton, discarding && styles.dialogButtonDisabled]}
          >
            <Text style={styles.discardButtonText}>{discarding ? "Discarding..." : "Discard"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
  </>;
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
  localAudioButton: { minHeight: 40, marginTop: 12, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1,
    borderColor: "rgba(217,246,255,0.45)", flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center" },
  localAudioText: { color: "#D9F6FF", fontSize: 13, fontWeight: "600" },
  bottomControls: { flexDirection: "row", justifyContent: "space-evenly", width: "100%", alignItems: "flex-end", marginTop: "auto", paddingTop: 16, paddingBottom: 4 },
  controls: { flexDirection: "row", justifyContent: "space-evenly", width: "100%", alignItems: "center", marginTop: 12 },
  control: { alignItems: "center", gap: 8 },
  sideButton: { width: 62, height: 62, borderRadius: 31, borderWidth: 1.5, borderColor: "rgba(197,235,255,0.4)", alignItems: "center", justifyContent: "center" },
  testButton: { width: 74, height: 74, borderRadius: 37, borderWidth: 1.5, borderColor: "rgba(217,246,255,0.65)", backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  stopButton: { width: 74, height: 74, borderRadius: 37, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#BAEDFF", shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  stopSquare: { width: 22, height: 22, borderRadius: 5, backgroundColor: "#FF5367" },
  controlLabel: { color: "#BDE8FF", fontSize: 13 },
  stopLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  error: { color: "#FFE3E7", textAlign: "center", fontSize: 13, marginTop: 8 },
  qualitySection: { width: "100%", maxWidth: 320, marginTop: 12, zIndex: 5, elevation: 5 },
  qualityDropdown: { minHeight: 58, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 14, borderWidth: 1,
    borderColor: "rgba(217,246,255,0.38)", backgroundColor: "rgba(255,255,255,0.09)", flexDirection: "row",
    alignItems: "center", justifyContent: "space-between" },
  qualityDropdownOpen: { borderColor: "#A0FFF3", borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  qualityMenu: { position: "absolute", left: 0, right: 0, bottom: 64, zIndex: 6, elevation: 8, overflow: "hidden",
    borderRadius: 14, borderWidth: 1, borderColor: "rgba(160,255,243,0.55)", backgroundColor: "rgba(25,104,171,0.98)" },
  qualityMenuItem: { minHeight: 54, paddingHorizontal: 16, paddingVertical: 8, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "rgba(217,246,255,0.14)" },
  qualityMenuItemSelected: { backgroundColor: "rgba(160,255,243,0.12)" },
  qualityValue: { color: "#E8F8FF", fontSize: 14, fontWeight: "600" },
  qualityValueSelected: { color: "#FFFFFF" },
  qualityBitRate: { color: "#BDE8FF", fontSize: 11, marginTop: 2 },
  footer: { gap: 9, paddingBottom: 4 },
  clipsHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  clipsTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  recordAgain: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 36 },
  recordAgainText: { color: "#D9F6FF", fontSize: 13 },
  clipCard: { borderRadius: 12, backgroundColor: "transparent", borderWidth: 1, borderColor: "rgba(2,219,196,0.65)",
    paddingHorizontal: 10, paddingVertical: 8, marginHorizontal: 2, marginBottom: 8,
    minHeight: 64,
    shadowColor: "#02DBC4", shadowOpacity: 0.25, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
  clipHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 20, marginBottom: 4 },
  clipTitle: { color: "#C6FFF6", fontSize: 11, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 10 },
  proceed: { flex: 1, width: "auto", minHeight: 46, paddingVertical: 8 },
  proceedText: { color: "#A0FFF3", fontWeight: "600" },
  sample: { flex: 1, width: "auto", minHeight: 46, paddingVertical: 8 },
  dialogOverlay: { flex: 1, backgroundColor: "rgba(5, 24, 52, 0.72)", alignItems: "center", justifyContent: "center", padding: 24 },
  dialogCard: { width: "100%", maxWidth: 360, borderRadius: 22, backgroundColor: "#FFFFFF", padding: 24, alignItems: "center", shadowColor: "#071D3D", shadowOpacity: 0.28, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  dialogIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#FFF0F2", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  dialogTitle: { color: "#15345B", fontSize: 20, lineHeight: 26, fontWeight: "700", textAlign: "center" },
  dialogText: { color: "#60758F", fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 8 },
  dialogActions: { flexDirection: "row", gap: 10, width: "100%", marginTop: 22 },
  keepButton: { flex: 1, minHeight: 46, borderRadius: 13, borderWidth: 1, borderColor: "#D6E1ED", alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  keepButtonText: { color: "#355574", fontSize: 14, fontWeight: "600" },
  discardButton: { flex: 1, minHeight: 46, borderRadius: 13, backgroundColor: "#E7475B", alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  discardButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  dialogButtonDisabled: { opacity: 0.65 },
});
