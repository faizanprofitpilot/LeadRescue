import { z } from "zod";

export const extractedLeadSchema = z.object({
  caller_name: z.string().max(120).nullable().optional(),
  service_category: z.string().max(120).nullable().optional(),
  issue_description: z.string().max(2000).nullable().optional(),
  service_address: z.string().max(500).nullable().optional(),
  service_city: z.string().max(120).nullable().optional(),
  service_state: z.string().max(80).nullable().optional(),
  service_postal_code: z.string().max(20).nullable().optional(),
  appointment_timing: z.string().max(500).nullable().optional(),
  urgency: z.string().max(200).nullable().optional(),
  callback_notes: z.string().max(500).nullable().optional(),
  summary: z.string().max(2000).nullable().optional(),
  conversation_complete: z.boolean().optional(),
  vehicle_year: z.string().max(8).nullable().optional(),
  vehicle_make: z.string().max(80).nullable().optional(),
  vehicle_model: z.string().max(120).nullable().optional(),
  drivable_status: z.string().max(80).nullable().optional(),
});

export type ExtractedLead = z.infer<typeof extractedLeadSchema>;

const requiredNames: (keyof ExtractedLead)[] = [
  "caller_name",
  "service_category",
  "issue_description",
];

export function hasRequiredLeadFields(
  data: ExtractedLead,
  hasCallerPhone: boolean,
): boolean {
  if (!hasCallerPhone) return false;
  for (const key of requiredNames) {
    const v = data[key];
    if (v === undefined || v === null || String(v).trim() === "") {
      return false;
    }
  }
  const addr =
    (data.service_address && String(data.service_address).trim() !== "") ||
    (data.service_city &&
      String(data.service_city).trim() !== "" &&
      data.service_state &&
      String(data.service_state).trim() !== "");
  if (!addr) return false;
  const hasUrgency =
    data.urgency !== undefined &&
    data.urgency !== null &&
    String(data.urgency).trim() !== "";
  const hasTiming =
    data.appointment_timing !== undefined &&
    data.appointment_timing !== null &&
    String(data.appointment_timing).trim() !== "";
  if (!hasUrgency && !hasTiming) return false;
  return true;
}

export function mergeExtracted(
  previous: Record<string, unknown>,
  next: ExtractedLead,
): ExtractedLead {
  const parsedPrev = extractedLeadSchema.safeParse(previous);
  const base = parsedPrev.success ? parsedPrev.data : {};
  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(next) as [keyof ExtractedLead, unknown][]) {
    if (value === undefined) continue;
    if (typeof value === "boolean") {
      merged[key as string] = value;
      continue;
    }
    if (value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    merged[key as string] = value;
  }
  return extractedLeadSchema.parse(merged);
}
