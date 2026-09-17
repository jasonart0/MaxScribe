import { fetchPatientImage } from "api/patients";
import { useEffect, useState } from "react";

export function usePatientImage(patientId?: string | number, fallback?: string | null) {
  const patientKey = patientId == null ? "" : String(patientId);
  const [downloadedImage, setDownloadedImage] = useState<{ key: string; uri: string | null }>({ key: patientKey, uri: null });

  useEffect(() => {
    let mounted = true;
    if (patientKey === "") return () => { mounted = false; };

    fetchPatientImage(patientId)
      .then((uri) => { if (mounted && uri) setDownloadedImage({ key: patientKey, uri }); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [patientId, patientKey]);

  return downloadedImage.key === patientKey ? downloadedImage.uri || fallback || null : fallback || null;
}