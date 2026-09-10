import { isNotEmpty } from "./utils";

const sectionConfig = (apiResponse) => [
  {
    key: "chief_complaint",
    icon: "account-alert-outline",
    title: "Chief Complaint",
    hasData: isNotEmpty(apiResponse?.chief_complaint),
    data: apiResponse?.chief_complaint || [],
  },
  {
    key: "hpi",
    icon: "note-text-outline",
    title: "HPI",
    hasData: isNotEmpty(apiResponse?.hpi),
    data: apiResponse?.hpi || "",
  },
  {
    key: "medical_history",
    icon: "hospital-box-outline",
    title: "Medical/Surgical History",
    hasData: isNotEmpty(apiResponse?.medical_history),
    data: apiResponse?.medical_history || "",
  },
  {
    key: "allergies",
    icon: "alert-circle-outline",
    title: "Allergies",
    hasData: isNotEmpty(apiResponse?.allergies),
    data: apiResponse?.allergies || [],
    notShow: [
      "reaction_snomed_code",
      "severity_snomed_code",
      "snomed_ct",
      "type_snomed_code",
    ],
  },
  {
    key: "family_history",
    icon: "account-group-outline",
    title: "Family History",
    hasData: isNotEmpty(apiResponse?.family_history),
    data: apiResponse?.family_history || [],
    notShow: ["code", "relationship_code"],
  },
  {
    key: "social_lifestyle",
    icon: "account-group-outline",
    title: "Social History and Lifestyle",
    hasData: isNotEmpty(apiResponse?.social_lifestyle),
    data: apiResponse?.social_lifestyle || {},
    notShow: ["smoking_status_code"],
  },
  {
    key: "medication",
    icon: "pill",
    title: "Current Medication",
    hasData: isNotEmpty(apiResponse?.medication),
    data: apiResponse?.medication || [],
    notShow: ["rxnorm"],
  },
  {
    key: "physical_exam",
    icon: "stethoscope",
    title: "Physical Exam",
    hasData: isNotEmpty(apiResponse?.physical_exam),
    data: apiResponse?.physical_exam || "",
  },
  {
    key: "ros",
    icon: "file-document-edit-outline",
    title: "Review Of System",
    hasData: isNotEmpty(apiResponse?.ros),
    data: apiResponse?.ros || "",
  },
  {
    key: "diagnosis",
    icon: "medical-bag",
    title: "Diagnosis",
    hasData: isNotEmpty(apiResponse?.diagnosis),
    data: apiResponse?.diagnosis || [],
    notShow: ["icd_10"],
  },
  {
    key: "care_plan",
    icon: "clipboard-check-outline",
    title: "Plan of Care",
    hasData: isNotEmpty(apiResponse?.care_plan),
    data: apiResponse?.care_plan || "",
  },
  {
    key: "education_instructions",
    icon: "book-open-page-variant-outline",
    title: "Education/Instruction",
    hasData: isNotEmpty(apiResponse?.education_instructions),
    data: apiResponse?.education_instructions || "",
  },
  {
    key: "follow_up",
    icon: "calendar-check-outline",
    title: "Follow Up",
    hasData: isNotEmpty(apiResponse?.follow_up),
    data: apiResponse?.follow_up || [],
    notShow: ["follow_up_date", "period", "when"],
  },
];
// reverseSectionConfig.ts
type Section = {
  key: string;
  data: any;
  notShow?: string[];
};

/**
 * Convert sections[] back into API JSON format
 */
const sectionsToApiResponse = (
  sections: Section[],
  prevApiResponse: Record<string, any> = {}
): Record<string, any> => {
  return sections.reduce((acc, section) => {
    const { key, data } = section;

    // If data is object/array, merge with previous to restore hidden fields
    if (Array.isArray(data)) {
      acc[key] = data.map((item, idx) => {
        if (typeof item === "object" && prevApiResponse?.[key]?.[idx]) {
          return { ...prevApiResponse[key][idx], ...item };
        }
        return item;
      });
    } else if (typeof data === "object" && data !== null) {
      acc[key] = {
        ...prevApiResponse?.[key],
        ...data,
      };
    } else {
      acc[key] = data;
    }

    return acc;
  }, {} as Record<string, any>);
};

export { sectionConfig, sectionsToApiResponse };
