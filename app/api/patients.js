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
