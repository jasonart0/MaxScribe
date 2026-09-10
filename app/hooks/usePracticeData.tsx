import { getUserData } from "lib/authdata";
import { useEffect, useState } from "react";
import instance from "../api/axiosInstance";
interface DataResponse {
  posList: any[];
  providerList: any[];
  locationList: any[];
  loading: boolean;
  error: string | null;
}
// helpers/dropdownMapper.ts
// export const mapApiDataToDropdown = (
//   pos: any[],
//   locations: any[],
//   providers: any[]
// ) => {
//   const posList = pos.map((item) => ({
//     label: item, // show description
//     value: item, // keep whole object
//   }));

//   const locationList = locations.map((item) => ({
//     label:item, // combine fields
//     value: item,
//   }));

//   const providerList = providers.map((item) => ({
//     label: item, // show provider name
//     value: item,
//   }));

//   return { posList, locationList, providerList };
// };
// helpers/dropdownMapper.ts
export const mapApiDataToDropdown = (
  pos: any[],
  locations: any[],
  providers: any[]
) => {
  const posList = pos.map((item) => ({
    label: item.name || item.description || String(item.id), // show readable text
    value: item, // keep full object for later use
  }));

  const locationList = locations.map((item) => ({
    label: `${item.name || ""} ${item.city || ""} ${item.state || ""}`.trim(),
    value: item,
  }));

  const providerList = providers.map((item) => ({
    label:
      item.name || item.full_name || `${item.first_name} ${item.last_name}`,
    value: item,
  }));

  return { posList, locationList, providerList };
};

export const usePracticeData = (userId: string | null) => {
  const [data, setData] = useState<DataResponse>({
    posList: [],
    providerList: [],
    locationList: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!userId) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: "No userId provided",
      }));

      return;
    }

    const fetchData = async () => {
      try {
        const user = await getUserData();

        const posPromise = instance.get(`/claim/getPracticePOSList/${userId}`);

        const providerPromise = instance.get(
          `/lookup/getProviderList?practice_id=${user?.practice_id}`
        );

        const locationPromise = instance.get(
          `/lookup/getlocationList?practice_id=${user?.practice_id}`
        );
        const [posRes, locationRes, providerRes] = await Promise.all([
          posPromise,
          locationPromise,
          providerPromise,
        ]);

        const { posList, locationList, providerList } = mapApiDataToDropdown(
          Array.isArray(posRes.data) ? posRes.data : posRes.data?.data || [],
          Array.isArray(locationRes.data)
            ? locationRes.data
            : locationRes.data?.data || [],
          Array.isArray(providerRes.data)
            ? providerRes.data
            : providerRes.data?.data || []
        );
        setData({
          posList,
          providerList,
          locationList,
          loading: false,
          error: null,
        });
      } catch (err: any) {
        setData({
          posList: [],
          providerList: [],
          locationList: [],
          loading: false,
          error: err?.response?.data || err.message,
        });
      }
    };

    fetchData();
  }, [userId]);

  return data;
};
