import { CustomButton, ScreenWrapper } from "@components";
import { Ionicons } from "@expo/vector-icons";
import {
    faildMessage,
    isNotEmpty,
    sectionConfig,
    sectionsToApiResponse,
    setHeight,
    setWidth,
    successMessage,
} from "@lib";
import { savePatientScribeData } from "api/Encounter";
import { apiErrorMessage } from "api/response";
import DynamicEditor from "components/EditAble/DynamicEditable";
import EditableNote from "components/EditAble/Richtext";
import MicPulse from "components/mic";
import CollapsibleSection from "components/Section";
import { COLORS } from "constants/Colors";
import useVoice from "hooks/useVoice";
import { getUserData } from "lib/authdata";
import React, { useEffect, useRef, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { ClinicalNote, ScreenProps } from "types/navigation";
export default function Notes({ route, navigation }: ScreenProps<"Notes">) {
  const { patient, transcription, jsonData, editAble, aData } =
    route.params?.data || {};

  const [sections, setSections] = useState(() => jsonData ? sectionConfig(jsonData) || [] : []);
  const autoOpenGeneratedNote = Boolean(transcription && !aData && sections.length);
  const defaultEditData = autoOpenGeneratedNote
    ? sections.find((section) => section.hasData)
    : null;
  const [editData, setEditData] = useState<any>(defaultEditData ? {
    title: defaultEditData.title,
    data: defaultEditData.data,
    icon: defaultEditData.icon,
    hasData: defaultEditData.hasData,
    notShow: defaultEditData.notShow,
  } : null);
  const editable = editAble === undefined ? true : editAble;
  const [openEditModal, setOpenEditModal] = useState(Boolean(defaultEditData));
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const updateSectionData = (title: string, newData: any) => {
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

  const { started: isListening, processing, error: dictationError, _startRecognizing, results, finalResult, clearResults, _destroyRecognizer } = useVoice();
  useEffect(() => {
    if (dictationError) faildMessage(dictationError);
  }, [dictationError]);

  const handleNewData = (newData: any) => {
    setEditData((prev: any) => ({ ...prev, data: typeof prev?.data === "string" && Array.isArray(newData) ? newData[0] ?? "" : newData }));
  };
  const handleUpdateAndSaveEncounter = async (jsondata: ClinicalNote) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const text = JSON.stringify(jsondata);
      const user = await getUserData();
      if (
        isNotEmpty(text) &&
        isNotEmpty(aData?.id) &&
        isNotEmpty(user) &&
        isNotEmpty(patient)
      ) {
        if (!user?.username) throw new Error("Your session has expired. Please sign in again.");
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
        await savePatientScribeData(scribeData);
      } else throw new Error("The encounter could not be updated. Please reopen the patient encounter.");

      successMessage("✅ Synced", "Encounter note synced to EHR system.");
      navigation.goBack();
    } catch (err) {
      faildMessage(apiErrorMessage(err, "Unable to update the encounter. Please try again."));
    } finally {
      savingRef.current = false;
      setSaving(false);
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
                  isLoading={saving}
                  onPress={() => {
                    const updatedApiResponse = sectionsToApiResponse(
                      sections,
                      jsonData
                    );
                    handleUpdateAndSaveEncounter(updatedApiResponse);
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
      <Modal visible={openEditModal} animationType="slide" onRequestClose={() => {
        if (processing) return;
        void _destroyRecognizer();
        setOpenEditModal(false);
      }}>
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
                    if (processing) return;
                    await _destroyRecognizer();
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

                <CustomButton
                  title="Save"
                  disabled={isListening || processing}
                  onPress={() => {
                    setOpenEditModal(false);
                    updateSectionData(editData?.title, editData?.data);
                    void _destroyRecognizer();
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
                excludedKeys={editData?.notShow || []}
                multilineKeys={["description"]}
              />
            )}
          </View>
        </ScreenWrapper>
        {/<\/?[a-z][\s\S]*>/i.test(editData?.data) && (
          <TouchableOpacity
            disabled={processing}
            style={{
              position: "absolute",
              bottom: setHeight(10),
              right: setWidth(8),
            }}
            onPress={async () => {
              try {
                if (!isListening) {
                  await _startRecognizing();
                } else {
                  await clearResults();
                }
              } catch (error) {
                faildMessage(apiErrorMessage(error, "Dictation failed. Please try again."));
              }
            }}
          >
            {processing ? <Text style={{ color: COLORS.primary }}>Transcribing...</Text> : isListening ? (
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
                  backgroundColor: !isListening ? COLORS.primary : "#ffffffff",
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
  cardList: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  procedBtn: {
    width: "100%",
    borderRadius: 12,
    marginBottom: setHeight(2),
  },
});
