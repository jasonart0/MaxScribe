import { fetchPatients, fetchPatientHistory } from "api/patients";
import { fetchPracticeLookups } from "api/practice";
import { apiErrorMessage } from "api/response";
import type { Patient } from "types/navigation";

export type PracticeLookups = Awaited<ReturnType<typeof fetchPracticeLookups>>;
export type PatientVisit = Record<string, any>;

export function extractEncounters(response: any): PatientVisit[] {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];
  return [response.data, response.records, response.encounters, response.results,
    response.data?.records, response.data?.encounters, response.data?.results,
    response.data?.data, response.data?.data?.records, response.data?.data?.encounters]
    .find(Array.isArray) || [];
}

// Pass prepared data with the route rather than caching patient data across sessions.
export async function preloadHome(): Promise<{ initialPatients: Patient[]; initialError: string | null }> {
  try {
    const data = await fetchPatients();
    return { initialPatients: data, initialError: null };
  } catch (error) {
    return { initialPatients: [], initialError: apiErrorMessage(error, "Unable to load patients. Please try again.") };
  }
}

export async function preloadPatientHistory(patientId: string | number) {
  return extractEncounters(await fetchPatientHistory(patientId));
}

export const preloadEncounter = () => fetchPracticeLookups();
