export function unwrapData(response: any): any {
  let data = response;
  for (let depth = 0; depth < 4 && data && typeof data === "object" && !Array.isArray(data) && "data" in data; depth++) data = data.data;
  return data;
}

export function assertApiSuccess(response: any): void {
  let data = response;
  for (let depth = 0; depth <= 4 && data && typeof data === "object"; depth++) {
    if (data.success === false) {
      throw new Error(apiErrorMessage(data, "The request could not be completed. Please try again."));
    }
    data = data.data;
  }
}

export function extractList(response: any): any[] {
  assertApiSuccess(response);
  const data = unwrapData(response);
  if (Array.isArray(data)) return data;
  for (const key of ["records", "results", "patients", "encounters"]) if (Array.isArray(data?.[key])) return data[key];
  if (data == null) return [];
  throw new Error("The server returned an unexpected list format. Please try again.");
}

export function apiErrorMessage(error: any, fallback = "Something went wrong. Please try again."): string {
  if (error?.response?.status === 401) return "Your session has expired. Please sign in again.";
  if (error?.code === "ECONNABORTED" || error?.name === "AbortError") return "The request timed out. Please try again.";
  const data = error?.response?.data ?? error;
  const message = data?.message ?? data?.response ?? data?.error?.message;
  return typeof message === "string" && message.trim() ? message : fallback;
}
