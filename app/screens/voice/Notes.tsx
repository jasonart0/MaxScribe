import { CustomButton, ScreenWrapper } from "@components";
import { Ionicons } from "@expo/vector-icons";
import {
  isNotEmpty,
  sectionConfig,
  sectionsToApiResponse,
  setHeight,
  setWidth,
  successMessage,
} from "@lib";
import { savePatientScribeData } from "api/Encounter";
import DynamicEditor from "components/EditAble/DynamicEditable";
import EditableNote from "components/EditAble/Richtext";
import MicPulse from "components/mic";
import CollapsibleSection from "components/Section";
import { COLORS } from "constants/Colors";
import useVoice from "hooks/useVoice";
import { getUserData } from "lib/authdata";
import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
export default function Notes({ route, navigation }) {
  const { patient, transcription, jsonData, editAble, aData } =
    route.params?.data || {};

  const [sections, setSections] = useState([]);
  const [editData, setEditData] = useState<any>(null);
  const [editable, setEditable] = useState<any>(true);
  const [openEditModal, setOpenEditModal] = useState(false);
  useEffect(() => {
    if (jsonData) {
      setSections(sectionConfig(jsonData) || []);
    }
    if (editAble !== undefined) {
      setEditable(editAble);
    }
  }, [jsonData]);

  const updateSectionData = (title, newData) => {
    setSections((prevSections) =>
      prevSections.map((section) => {
        if (section.title === title) {
          if (Array.isArray(section.data)) {
            // Case: section.data is an array
            if (Array.isArray(newData)) return { ...section, data: newData };
            console.warn(`❌ "${title}" expected array, got ${typeof newData}`);
            return section;
          } else if (
            typeof section.data === "object" &&
            section.data !== null &&
            !Array.isArray(section.data)
          ) {
            // Case: section.data is an object
            if (
              typeof newData === "object" &&
              newData !== null &&
              !Array.isArray(newData)
            ) {
              return { ...section, data: newData };
            } else if (Array.isArray(newData)) {
              // ✅ Special case: previous is object, newData is array
              return { ...section, data: newData[0] ?? {} };
            }
            console.warn(
              `❌ "${title}" expected object, got ${typeof newData}`
            );
            return section;
          } else if (typeof section.data === "string") {
            // Case: section.data is string
            if (typeof newData === "string")
              return { ...section, data: newData };
            console.warn(
              `❌ "${title}" expected string, got ${typeof newData}`
            );
            return section;
          }
        }
        return section;
      })
    );
  };

  const [islistning, setIsListening] = useState(false);
  const { _startRecognizing, results, finalResult, clearResults } = useVoice();

  const handleNewData = (newData: any) => {
    setEditData((prev: any) => ({ ...prev, data: newData }));
  };
  const handleUpdateAndSaveEncounter = async (jsondata) => {
    try {
      const text = JSON.stringify(jsondata);
      const user = await getUserData();
      if (
        isNotEmpty(text) &&
        isNotEmpty(aData?.id) &&
        isNotEmpty(user) &&
        isNotEmpty(patient)
      ) {
        const scribeData = {
          id: aData?.id,
          notes_data: text,
          patient_id: patient?.patient_id,
          practice_id: user?.practice_id,
          chart_id: "",
          created_user: user.username,
          deleted: false,

          provider_id: aData?.provider_id,
          location_id: aData?.location_id,
          pos_id: aData?.pos_id,
          date_created: aData?.date_created,
        };
        console.log("Scribe data to save:", scribeData);

        const scribeResponse = await savePatientScribeData(scribeData);
        console.log("Scribe save response:", scribeResponse);
      }

      successMessage("✅ Synced", "Encounter note synced to EHR system.");
      navigation.goBack();
    } catch (err) {
      console.error("Error saving encounter:", err);
    }
  };
  return (
    <>
      <ScreenWrapper
        title={patient?.name}
        scrollEnabled
        footerUnScrollable={() => {
          return transcription ? (
            <View style={{ alignItems: "center" }}>
              <CustomButton
                title={"Send to Maximus"}
                onPress={() => {
                  // navigation.navigate("AddEncounter", { patient, jsonData });
                  const updatedApiResponse = sectionsToApiResponse(
                    sections,
                    jsonData
                  );
                  navigation.navigate("AddEncounter", {
                    patient,
                    jsonData: updatedApiResponse,
                  });
                }}
                style={styles.procedBtn}
              />
            </View>
          ) : (
            editable && (
              <View style={{ alignItems: "center" }}>
                <CustomButton
                  title={"Update on Maximus"}
                  onPress={() => {
                    const updatedApiResponse = sectionsToApiResponse(
                      sections,
                      jsonData
                    );
                    handleUpdateAndSaveEncounter(updatedApiResponse);
                    // navigation.navigate("AddEncounter", {
                    //   patient,
                    //   jsonData: updatedApiResponse,
                    // });
                  }}
                  style={styles.procedBtn}
                />
              </View>
            )
          );
        }}
      >
        <View style={styles.cardList}>
          {sections.map(
            ({ key, title, data, icon, hasData, notShow }) =>
              hasData && (
                <CollapsibleSection
                  key={key}
                  title={title}
                  data={data}
                  icon={icon}
                  editable={editable}
                  notShow={notShow}
                  onPressEdit={() => {
                    setOpenEditModal(true);
                    setEditData({ title, data, icon, hasData, notShow });
                  }}
                />
              )
          )}
        </View>
      </ScreenWrapper>
      <Modal visible={openEditModal} animationType="slide">
        <ScreenWrapper
          title="Edit Note"
          scrollEnabled
          backgroundColor="#fff"
          statusBarColor={COLORS.secondary}
          headerUnScrollable={() => {
            return (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: COLORS.primary,
                  }}
                >
                  {editData?.title}
                </Text>
                <TouchableOpacity
                  onPress={async () => {
                    if (islistning) {
                      clearResults();
                      setIsListening(false);
                    }
                    setOpenEditModal(false);
                  }}
                >
                  <Text style={{ color: COLORS.primary, fontSize: 16 }}>
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
          footerUnScrollable={() => {
            return (
              <>
                {/* {islistning && (
                  <View style={styles.topBar}>
                    <TouchableOpacity
                      onPress={() => _clearResults()}
                      style={styles.backBtn}
                    >
                      <Ionicons
                        name="checkbox-outline"
                        size={20}
                        color="#000000ff"
                        style={styles.backIcon}
                      />
                    </TouchableOpacity>
                    <Text
                      style={{
                        color: "#000000ff",
                        fontSize: 18,
                        fontWeight: "600",
                        marginLeft: 16,
                      }}
                    >
                      {results.join(" ")}
                    </Text>
                  </View>
                )} */}
                <CustomButton
                  title="Save"
                  onPress={() => {
                    // updateSection(title, editData);
                    setOpenEditModal(false);
                    updateSectionData(editData?.title, editData?.data);
                    if (islistning) {
                      clearResults();
                      setIsListening(false);
                    }
                  }}
                  style={{ margin: 16, borderRadius: setHeight(1) }}
                />
              </>
            );
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "#ffffffff",
              paddingHorizontal: 16,
            }}
          >
            {/<\/?[a-z][\s\S]*>/i.test(editData?.data) ? (
              <EditableNote
                htmlContent={editData?.data}
                setHtmlContent={handleNewData}
                finalResult={finalResult}
                results={results}
              />
            ) : (
              <DynamicEditor
                data={
                  Array.isArray(editData?.data)
                    ? editData?.data
                    : [editData?.data]
                }
                setData={handleNewData}
                title={editData?.title}
                // excludedKeys={editData?.notShow || []}
                multilineKeys={["description"]}
              />
            )}
          </View>
        </ScreenWrapper>
        {/<\/?[a-z][\s\S]*>/i.test(editData?.data) && (
          <TouchableOpacity
            style={{
              position: "absolute",
              bottom: setHeight(10),
              right: setWidth(8),
            }}
            onPress={async () => {
              try {
                if (!islistning) {
                  await _startRecognizing();
                  setIsListening(!islistning);
                } else {
                  await clearResults();
                  setIsListening(false);
                }
              } catch (error) {}
            }}
          >
            {islistning ? (
              <MicPulse
                size={setHeight(4)}
                rippleCount={5}
                rippleDuration={3000}
                rippleDelay={2000}
                color={COLORS.primary} // iOS style red
              />
            ) : (
              <View
                style={{
                  borderRadius: setHeight(5),
                  backgroundColor: !islistning ? COLORS.primary : "#ffffffff",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="mic"
                  size={setHeight(3)}
                  color="#fff"
                  style={{ padding: setHeight(2) }}
                />
              </View>
            )}
          </TouchableOpacity>
        )}
      </Modal>
    </>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: setHeight(2),
    paddingVertical: setHeight(1),
  },
  backBtn: { borderRadius: 50, padding: 12 },
  backIcon: { width: 18, height: 18, tintColor: "#FFF" },
  scroll: {
    paddingHorizontal: setHeight(2),
    paddingBottom: setHeight(2),
    alignContent: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  cardList: {
    alignItems: "center",
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
  },
});
