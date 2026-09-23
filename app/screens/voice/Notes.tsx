import { CustomButton, ScreenWrapper } from "@components";
import { Ionicons } from "@expo/vector-icons";
import {
    faildMessage,
    isNotEmpty,
    sectionConfig,
    sectionPreviewText,
    sectionsToApiResponse,
    setHeight,
    setWidth,
    successMessage,
} from "@lib";
import { savePatientScribeData } from "api/Encounter";
import { apiErrorMessage } from "api/response";
import BlueGradient from "components/BlueGradient";
import DynamicEditor from "components/EditAble/DynamicEditable";
import EditableNote from "components/EditAble/Richtext";
import MicPulse from "components/mic";
import CollapsibleSection from "components/Section";
import { COLORS } from "constants/Colors";
import useVoice from "hooks/useVoice";
import { getUserData } from "lib/authdata";
import { preloadEncounter } from "lib/preload";
import React, { useEffect, useRef, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import type { ClinicalNote, ScreenProps } from "types/navigation";

function formatVisitHeaderDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  return `${month} ${String(date.getDate()).padStart(2, "0")}`;
}

export default function Notes({ route, navigation }: ScreenProps<"Notes">) {
  const { patient, transcription, jsonData, aData } =
    route.params?.data || {};
  const headerTitle = formatVisitHeaderDate(aData?.date_created) || patient?.name || "Visit details";

  const [sections, setSections] = useState(() => jsonData ? sectionConfig(jsonData) || [] : []);
  const isGeneratedNoteFlow = Boolean(transcription && !aData && sections.length);
  const [editData, setEditData] = useState<any>(null);
  const editable = true;
  const [openEditModal, setOpenEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [preparing, setPreparing] = useState(false);
  const preparingRef = useRef(false);

  const openEncounter = async () => {
    if (preparingRef.current) return;
    preparingRef.current = true;
    setPreparing(true);
    try {
      const practiceLookups = await preloadEncounter();
      if (navigation.isFocused?.() === false) return;
      const updatedApiResponse = sectionsToApiResponse(sections, jsonData);
      navigation.navigate("AddEncounter", { patient, jsonData: updatedApiResponse, practiceLookups });
    } catch (error) {
      faildMessage(apiErrorMessage(error, "Unable to load encounter options. Please try again."));
    } finally {
      preparingRef.current = false;
      setPreparing(false);
    }
  };

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

  const openSectionEditor = (section: any) => {
    setOpenEditModal(true);
    setEditData({
      title: section.title,
      data: section.data,
      icon: section.icon,
      hasData: section.hasData,
      notShow: section.notShow,
    });
  };

  const renderGeneratedSection = (section: any) => {
    const displayText = sectionPreviewText(section.data, section.notShow);

    return (
      <TouchableOpacity
        key={section.key}
        activeOpacity={0.85}
        style={styles.generatedSection}
        onPress={() => openSectionEditor(section)}
      >
        <Text style={styles.generatedTitle}>{section.title}</Text>
        <Text style={styles.generatedBody}>{displayText || "No content"}</Text>
      </TouchableOpacity>
    );
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
        title={headerTitle}
        scrollEnabled
        footerUnScrollable={() => {
          return transcription ? (
            <View style={{ alignItems: "center" }}>
              <CustomButton
                title={"Send to Maximus"}
                onPress={openEncounter}
                isLoading={preparing}
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
          {isGeneratedNoteFlow
            ? sections.map((section) => section.hasData && renderGeneratedSection(section))
            : sections.map(
                ({ key, title, data, icon, hasData, notShow }, index) =>
                  hasData && (
                    <CollapsibleSection
                      key={key}
                      title={title}
                      data={data}
                      icon={icon}
                      editable={editable}
                      notShow={notShow}
                      defaultOpen={index === 0}
                      onPressEdit={() => {
                        openSectionEditor({ key, title, data, icon, hasData, notShow });
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
        <SafeAreaProvider>
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
                  overflow: "hidden",
                  borderRadius: setHeight(5),
                  backgroundColor: !isListening ? "#2B69C1" : "#ffffffff",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {!isListening && <BlueGradient />}
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
        </SafeAreaProvider>
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
  generatedSection: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(29,115,188,0.12)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  generatedTitle: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  generatedBody: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 22,
  },
});
