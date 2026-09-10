// import { localImages } from "@assets";
import { CustomButton, ScreenWrapper } from "@components";
import { Entypo } from "@expo/vector-icons";
import { faildMessage, setHeight, setWidth } from "@lib";
import { useNavigation, useRoute } from "@react-navigation/native";
import { generateChat, uploadVoiceFile } from "api/voice";
import AIProcessingLoader from "components/AnimationLoad";
import PlayRecordedAudio from "components/AudioPlayer";
import AvatarInitials from "components/Avatar";
import Icon from "components/Icon";
import MicPulse from "components/mic";
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
          {/* <Icon
            name={patient.gender_code == "F" ? "femaleIcon" : "maleIcon"}
            height={setHeight(13)}
            width={setHeight(13)}
            iconColor={COLORS.primary}
          /> */}
          <AvatarInitials name={patient.name} size={setHeight(13)} />
          <Text style={styles.nameText}>
            {patient.name || "Unknown Patient"}
          </Text>

          <View style={styles.timerWrapper}>
            <Text style={styles.timerText}>{formatTime(timer)}</Text>
            {isRecording && (
              <>
                {/* {isRecording && !isPaused ? ( */}

                <View style={styles.waveform}>
                  {animValues.map((val, index) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.bar,
                        { height: val, backgroundColor: COLORS.primary },
                      ]}
                    />
                  ))}
                </View>
              </>
            )}
            {/* ) : (
              <View style={styles.avatarImage1} />
            )} */}
            {isRecording && (
              <View style={styles.transcriptionWrapper}>
                <Text style={styles.transcriptionLine3}>{statusMessage}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.micButton}
              onPress={toggleRecording}
            >
              {isRecording && !isPaused ? (
                <MicPulse
                  size={80}
                  rippleCount={5}
                  rippleDuration={1500}
                  rippleDelay={900}
                  color={COLORS.primary} // iOS style red
                />
              ) : (
                <Icon name="Mic" height={setHeight(8)} width={setHeight(8)} />
              )}
            </TouchableOpacity>
          </View>

          {/* Show recorded file preview + Proceed */}
        </View>
        {/* Microphone pause Icon */}
        {recordedUri && (
          <View style={{ marginBottom: setHeight(20) }}>
            <PlayRecordedAudio uri={recordedUri} />
          </View>
        )}
        {/* Controls */}
        <View style={styles.bottomControls}>
          {isRecording && !isPaused && (
            <TouchableOpacity
              style={styles.pausebutton}
              onPress={pauseRecording}
            >
              <View style={styles.pausebar} />
              <View style={styles.pausebar} />
            </TouchableOpacity>
            // <TouchableOpacity
            //   style={[styles.micButton, { backgroundColor: "green" }]}
            //
            // ></TouchableOpacity>
          )}
          {isRecording && isPaused && (
            <TouchableOpacity
              style={styles.pausebutton}
              onPress={resumeRecording}
            >
              <Entypo
                name="controller-play"
                size={setHeight(5)}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          )}
          {isRecording && (
            <TouchableOpacity
              style={styles.pausebutton}
              onPress={toggleRecording}
            >
              <View style={styles.endbar} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}
export default VoiceRecordScreen;

const styles = StyleSheet.create({
 main: { flex: 1, justifyContent: "space-between" },
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
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginVertical: setHeight(5),
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
    fontSize: setHeight(3),
    fontWeight: "bold",
    color: "#999999",
    marginVertical: setHeight(4),
  },
  bottomControls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: setWidth(10),
    alignItems: "center",
    marginTop: setHeight(4),
    marginBottom: setHeight(30),
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
    height: 80,
    marginBottom: 20,
  },
  bar: {
    width: 4,
    marginHorizontal: 2,
    borderRadius: 2,
  },
});
