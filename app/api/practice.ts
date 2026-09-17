import { getUserData } from "lib/authdata";
import instance from "./axiosInstance";
import { extractList } from "./response";

export async function fetchPracticeLookups() {
  const user = await getUserData();
  if (user?.practice_id == null || String(user.practice_id).trim() === "") throw new Error("No practice is available. Please sign in again.");
  const practiceId = encodeURIComponent(user.practice_id);
  const [pos, locations, providers] = await Promise.all([
    instance.get("/claim/getPracticePOSList/" + practiceId),
    instance.get("/lookup/getlocationList?practice_id=" + practiceId),
    instance.get("/lookup/getProviderList?practice_id=" + practiceId),
  ]);
  return { pos: extractList(pos.data), locations: extractList(locations.data), providers: extractList(providers.data) };
}
