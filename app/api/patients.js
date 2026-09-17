import { getUserData } from "lib/authdata";
import axios from "./axiosInstance";
import { assertApiSuccess, extractList } from "./response";

async function searchPatients(text = "") {
  const user = await getUserData();
  if (!user?.username) throw new Error("Your session has expired. Please sign in again.");
  const response = await axios.post("/search/patient", {
    param_list: text ? [{ name: "criteria", value: text }] : [{ name: "user_name", value: user.username }],
    criteria: text,
    option: text ? "DEFAULT" : "LATEST_OPENED",
    pageIndex: 0,
    pageSize: text ? 50 : 0,
  });
  return extractList(response.data);
}
export const fetchPatients = () => searchPatients();
export const fetchPatientsbySearch = (text) => searchPatients(text.trim());
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
  const response = await axios.post("/docs/download", {
    link: patientId,
    document_category: "PatientImages",
  }, { responseType: "blob" });
  assertApiSuccess(response.data);
  if (response.data instanceof Blob) return blobToDataUri(response.data);
  return findImageValue(response.data);
};
