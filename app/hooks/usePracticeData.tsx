import { fetchPracticeLookups } from "api/practice";
import { apiErrorMessage } from "api/response";
import { useEffect, useState } from "react";
import type { DropdownItem } from "components/CustomDropDown";

type Lookup = Record<string, any>;
type PracticeData = { posList: DropdownItem[]; providerList: DropdownItem[]; locationList: DropdownItem[]; loading: boolean; error: string | null };
export const mapApiDataToDropdown = (pos: Lookup[], locations: Lookup[], providers: Lookup[]) => ({
  posList: pos.map((item) => ({ label: String(item.name || item.description || item.id), value: item })),
  locationList: locations.map((item) => ({ label: [item.name, item.city, item.state].filter(Boolean).join(" ") || String(item.id), value: item })),
  providerList: providers.map((item) => ({ label: item.name || item.full_name || [item.first_name, item.last_name].filter(Boolean).join(" ") || String(item.id), value: item })),
});
export const usePracticeData = () => {
  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState<PracticeData>({ posList: [], providerList: [], locationList: [], loading: true, error: null });
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { pos, locations, providers } = await fetchPracticeLookups();
        if (!cancelled) setData({ ...mapApiDataToDropdown(pos, locations, providers), loading: false, error: null });
      } catch (error) {
        if (!cancelled) setData({ posList: [], providerList: [], locationList: [], loading: false, error: apiErrorMessage(error) });
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [attempt]);
  const retry = () => {
    setData((previous) => ({ ...previous, loading: true, error: null }));
    setAttempt((previous) => previous + 1);
  };
  return { ...data, retry };
};
