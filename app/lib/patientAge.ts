export function getPatientAge(patient: { age?: unknown; dob?: unknown }, today = new Date()): number | "--" {
  const provided = typeof patient.age === "number" ? patient.age
    : typeof patient.age === "string" && /^\d+$/.test(patient.age.trim()) ? Number(patient.age.trim()) : NaN;
  if (Number.isInteger(provided) && provided >= 0) return provided;
  if (typeof patient.dob !== "string" || !patient.dob.trim()) return "--";

  const dob = patient.dob.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/.exec(dob);
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:$|\s)/.exec(dob);
  const parts = iso ? [Number(iso[1]), Number(iso[2]), Number(iso[3])]
    : us ? [Number(us[3]), Number(us[1]), Number(us[2])] : null;
  const birth = parts ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(dob);
  if (Number.isNaN(birth.getTime())) return "--";
  if (parts && (birth.getFullYear() !== parts[0] || birth.getMonth() !== parts[1] - 1 || birth.getDate() !== parts[2])) return "--";
  if (birth > today) return "--";

  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return age;
}
