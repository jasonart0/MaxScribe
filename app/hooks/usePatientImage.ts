import { fetchPatientImage } from "api/patients";
import { useEffect, useState } from "react";

const imageCache = new Map<string, string | null>();
const pendingImages = new Map<string, Promise<string | null>>();
const imageQueue: (() => void)[] = [];
let activeImageRequests = 0;
let imageCacheGeneration = 0;
const MAX_IMAGE_REQUESTS = 4;
const MAX_CACHED_IMAGES = 100;

const runNextImageRequest = () => {
  while (activeImageRequests < MAX_IMAGE_REQUESTS && imageQueue.length) {
    activeImageRequests += 1;
    imageQueue.shift()?.();
  }
};

const schedulePatientImage = (patientKey: string, patientId: string | number) => {
  const existing = pendingImages.get(patientKey);
  if (existing) return existing;

  const generation = imageCacheGeneration;
  let request: Promise<string | null>;
  request = new Promise<string | null>((resolve) => {
    imageQueue.push(() => {
      fetchPatientImage(patientId)
        .then((uri) => resolve(uri || null))
        .catch(() => resolve(null))
        .finally(() => {
          activeImageRequests -= 1;
          runNextImageRequest();
        });
    });
    runNextImageRequest();
  }).then((uri) => {
    if (pendingImages.get(patientKey) === request) pendingImages.delete(patientKey);
    if (generation === imageCacheGeneration) {
      if (imageCache.size >= MAX_CACHED_IMAGES) {
        const oldestKey = imageCache.keys().next().value;
        if (oldestKey) imageCache.delete(oldestKey);
      }
      imageCache.set(patientKey, uri);
    }
    return uri;
  });

  pendingImages.set(patientKey, request);
  return request;
};

export const clearPatientImageCache = () => {
  imageCacheGeneration += 1;
  imageCache.clear();
  pendingImages.clear();
};

export function usePatientImage(patientId?: string | number, fallback?: string | null) {
  const patientKey = patientId == null ? "" : String(patientId);
  const [downloadedImage, setDownloadedImage] = useState<{ key: string; uri: string | null }>({
    key: patientKey,
    uri: imageCache.get(patientKey) ?? null,
  });

  useEffect(() => {
    let mounted = true;
    if (patientKey === "") return () => { mounted = false; };

    if (imageCache.has(patientKey)) {
      return () => { mounted = false; };
    }

    schedulePatientImage(patientKey, patientId as string | number)
      .then((uri) => { if (mounted) setDownloadedImage({ key: patientKey, uri }); });
    return () => { mounted = false; };
  }, [patientId, patientKey]);

  const cachedImage = imageCache.get(patientKey);
  if (imageCache.has(patientKey)) return cachedImage || fallback || null;
  return downloadedImage.key === patientKey ? downloadedImage.uri || fallback || null : fallback || null;
}
