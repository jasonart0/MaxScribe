import api from "./axiosInstance";
import { assertApiSuccess } from "./response";

export type ScribeData = {
  id?: string | number;
  patient_id?: string | number;
  practice_id?: string | number;
  notes_data: string;
  chart_id: string;
  created_user: string;
  deleted: boolean;
  provider_id?: string;
  location_id?: string;
  pos_id?: string;
  date_created: string;
};
export const savePatientScribeData = async (scribeData: ScribeData) => {
  for (const key of ["patient_id", "practice_id", "provider_id", "location_id", "pos_id", "created_user"] as const) {
    if (scribeData[key] == null || String(scribeData[key]).trim() === "") {
      throw new Error("Patient, practice, provider, location and place of service are required to save an encounter.");
    }
  }
  let note;
  try { note = JSON.parse(scribeData.notes_data); }
  catch { throw new Error("The clinical note format is invalid. Please generate the note again."); }
  if (!note || typeof note !== "object" || Array.isArray(note) || !Object.keys(note).length) throw new Error("No clinical note is available to save.");
  const response = await api.post("/encounter/savePatientScribeData", scribeData);
  assertApiSuccess(response.data);
  return response.data;
};
