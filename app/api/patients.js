import { getUserData } from "lib/authdata";
import axios from "./axiosInstance";
import { assertApiSuccess, extractList } from "./response";

const dedupePatients = (patients = []) => {
  if (!Array.isArray(patients)) return [];

  const seen = new Set();
  const unique = [];

  for (const patient of patients) {
    if (!patient || typeof patient !== "object") continue;

    const patientId = patient.patient_id ?? patient.id ?? patient.patientId ?? patient.patientID ?? patient.account_id ?? patient.accountId ?? patient.alternate_account;
    const key = patientId == null ? null : String(patientId).trim();

    if (key && !seen.has(key)) {
      seen.add(key);
      unique.push(patient);
      continue;
    }

    if (!key) {
      const fallbackKey = [patient.name, patient.dob, patient.cell_phone, patient.home_phone]
        .filter(Boolean)
        .map((value) => String(value).trim())
        .join("|");

      if (!fallbackKey || seen.has(fallbackKey)) continue;
      seen.add(fallbackKey);
      unique.push(patient);
    }
  }

  return unique;
};

async function searchPatients(text = "", filter = "ALL", providerId = "", locationId = "", signal) {
  const user = await getUserData();
  const normalizedText = text.trim();
  const paramList = [
    { name: "location_id", value: String(locationId ?? "") },
    { name: "provider_id", value: String(providerId ?? "") },
  ];

  if (filter === "TODAY_SCHEDULED") {
    const response = await axios.post("/search/patient", {
      param_list: paramList,
      option: "TODAY_SCHEDULED",
      pageIndex: 0,
      pageSize: 0,
    }, { signal });
    return dedupePatients(extractList(response.data));
  }

  if (!user?.username) throw new Error("Your session has expired. Please sign in again.");
  const response = await axios.post("/search/patient", {
    param_list: normalizedText ? [{ name: "criteria", value: normalizedText }] : [{ name: "user_name", value: user.username }],
    criteria: normalizedText,
    option: normalizedText ? "DEFAULT" : "LATEST_OPENED",
    pageIndex: 0,
    pageSize: normalizedText ? 50 : 0,
  }, { signal });
  return extractList(response.data);
}
export const fetchPatients = (signal) => searchPatients("", "ALL", "", "", signal);
export const fetchPatientsByFilter = (filter = "TODAY_SCHEDULED", signal) => searchPatients("", filter, "", "", signal);
export const fetchPatientsbySearch = (text, filter = "ALL", signal) => searchPatients(text, filter, "", "", signal);
export const fetchPatientHistory = async (id) => {
  if (id == null || String(id).trim() === "") throw new Error("No patient was selected.");
  const response = await axios.get("/encounter/getPatientScribeData?patient_id=" + encodeURIComponent(id));
  assertApiSuccess(response.data);
  return response.data;
};

const imageDataUri = (value) => {
  if (typeof value !== "string" || !value.trim()) return null;
  const text = value.trim();
  if (/^(https?:\/\/|data:image\/)/i.test(text)) return text;
  if (/^[A-Za-z0-9+/]+=*$/.test(text) && text.length > 100) return `data:image/jpeg;base64,${text}`;
  return null;
};

const findImageValue = (value) => {
  const direct = imageDataUri(value);
  if (direct) return direct;
  if (!value || typeof value !== "object") return null;
  for (const key of ["url", "uri", "src", "image_url", "file_url", "base64", "content", "data"]) {
    const found = findImageValue(value[key]);
    if (found) return found;
  }
  return null;
};

const blobToDataUri = (blob) => new Promise((resolve, reject) => {
  if (typeof FileReader === "undefined") return reject(new Error("Patient image format is not supported."));
  const reader = new FileReader();
  reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
  reader.onerror = () => reject(new Error("Patient image could not be read."));
  reader.readAsDataURL(blob);
});

export const fetchPatientImage = async (patientId) => {
  if (patientId == null || String(patientId).trim() === "") return null;
  const normalizedId = String(patientId).trim();
  const imageLink = /\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(normalizedId)
    ? normalizedId
    : `${normalizedId}.png`;

  const response = await axios.post("/docs/download", {
    link: imageLink,
    document_category: "PatientImages",
  }, { responseType: "blob" });
  assertApiSuccess(response.data);
  if (response.data instanceof Blob) return blobToDataUri(response.data);
  return findImageValue(response.data);
};
