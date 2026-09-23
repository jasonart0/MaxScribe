export type EncounterDefaults = {
  providerId?: string;
  locationId?: string;
  providerName?: string;
  locationName?: string;
};

const normalizedId = (value: unknown) => {
  if (value == null || typeof value === "object") return undefined;
  const id = String(value).trim();
  return id || undefined;
};

const firstId = (...values: unknown[]) => {
  for (const value of values) {
    const id = normalizedId(value);
    if (id) return id;
  }
  return undefined;
};

export function getScheduledEncounterDefaults(patient: Record<string, any>): EncounterDefaults | undefined {
  const appointment = patient?.appointment || patient?.scheduled_appointment || patient?.visit || {};
  const schedule = patient?.schedule || {};

  const providerId = firstId(
    patient?.provider_id,
    patient?.providerId,
    patient?.providerID,
    patient?.appointment_provider_id,
    patient?.scheduled_provider_id,
    patient?.rendering_provider_id,
    patient?.provider?.id,
    patient?.provider?.provider_id,
    appointment?.provider_id,
    appointment?.providerId,
    appointment?.provider?.id,
    schedule?.provider_id,
    schedule?.providerId,
  );
  const locationId = firstId(
    patient?.location_id,
    patient?.locationId,
    patient?.locationID,
    patient?.appointment_location_id,
    patient?.scheduled_location_id,
    patient?.facility_id,
    patient?.location?.id,
    patient?.location?.location_id,
    appointment?.location_id,
    appointment?.locationId,
    appointment?.location?.id,
    appointment?.facility_id,
    schedule?.location_id,
    schedule?.locationId,
  );
  const providerName = firstId(
    patient?.app_provider_name,
    patient?.provider_name,
    appointment?.provider_name,
    appointment?.provider?.name,
  );
  const locationName = firstId(
    patient?.app_location_name,
    patient?.location_name,
    appointment?.location_name,
    appointment?.location?.name,
  );

  return providerId || locationId || providerName || locationName ? {
    ...(providerId ? { providerId } : {}),
    ...(locationId ? { locationId } : {}),
    ...(providerName ? { providerName } : {}),
    ...(locationName ? { locationName } : {}),
  } : undefined;
}

export function findLookupById<T extends { value?: any }>(items: T[], id: string | undefined, keys: string[]): T | null {
  const target = normalizedId(id);
  if (!target) return null;

  return items.find((item) => {
    const value = item?.value ?? item;
    return [value?.id, value?.value, ...keys.map((key) => value?.[key])]
      .some((candidate) => normalizedId(candidate) === target);
  }) ?? null;
}

const normalizedName = (value: unknown) => typeof value === "string"
  ? value.trim().toLocaleLowerCase().replace(/\s+/g, " ")
  : "";

export function findLookupByName<T extends { label?: string; value?: any }>(items: T[], name: string | undefined, keys: string[]): T | null {
  const target = normalizedName(name);
  if (!target) return null;

  return items.find((item) => {
    const value = item?.value ?? item;
    return [item?.label, value?.name, value?.full_name, ...keys.map((key) => value?.[key])]
      .some((candidate) => normalizedName(candidate) === target);
  }) ?? null;
}
