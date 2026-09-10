
import api from "./axiosInstance";
// models/ORMPatientChart.ts
// 1. Create new chart (encounter)
// export const createNewChart = async (chart: ORMPatientChart) => {
//   try {
//     const response = await api.post("/encounter/createNewChart", chart);
//     return response.data; // should contain chart_id
//   } catch (error) {
//     console.error("Error creating new chart:", error);
//     throw error;
//   }
// };

// 2. Save patient scribe data
export const savePatientScribeData = async (scribeData) => {
  try {
    const response = await api.post("encounter/savePatientScribeData", scribeData);
    
    return response.data;
  } catch (error) {
    console.error("Error saving scribe data:", error);
    throw error;
  }
};