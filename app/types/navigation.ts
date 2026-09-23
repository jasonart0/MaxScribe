import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { PatientVisit, PracticeLookups } from "lib/preload";
import type { EncounterDefaults } from "lib/scheduledEncounter";

export type Patient = {
  patient_id?: string | number;
  name?: string;
  dob?: string;
  patient_status?: string;
  pic?: string;
  [key: string]: any;
};
export type ConversationMessage = { speaker: string; text: string };
export type ClinicalNote = Record<string, any>;
export type RootStackParamList = {
  Login: undefined;
  Home: { initialPatients?: Patient[]; initialError?: string | null } | undefined;
  PatientDetails: { patient: Patient; initialVisits?: PatientVisit[] };
  Voice: { patient: Patient; encounterDefaults?: EncounterDefaults };
  Transcript: { data: { patient: Patient; transcription: string; showChat?: ConversationMessage[]; encounterDefaults?: EncounterDefaults } };
  Notes: { data: { patient: Patient; transcription?: string; jsonData: ClinicalNote; encounterDefaults?: EncounterDefaults; editAble?: boolean; id?: string | number; aData?: Record<string, any> } };
  AddEncounter: { patient: Patient; jsonData: ClinicalNote; encounterDefaults?: EncounterDefaults; practiceLookups?: PracticeLookups; visitDate?: string; data?: { aData?: Record<string, any> } };
};
export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

declare global {
  namespace ReactNavigation {
    // React Navigation extends this interface through declaration merging.
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
