import type { ExtractedLead } from "@/lib/ai/schemas";

export function leadUpdateFromExtraction(
  extracted: ExtractedLead,
): Record<string, string | null> {
  return {
    caller_name: extracted.caller_name?.trim() || null,
    issue_description: extracted.issue_description?.trim() || null,
    appointment_timing: extracted.appointment_timing?.trim() || null,
    urgency: extracted.urgency?.trim() || null,
    summary: extracted.summary?.trim() || null,
    service_address: extracted.service_address?.trim() || null,
    service_city: extracted.service_city?.trim() || null,
    service_state: extracted.service_state?.trim() || null,
    service_postal_code: extracted.service_postal_code?.trim() || null,
    service_category: extracted.service_category?.trim() || null,
    callback_notes: extracted.callback_notes?.trim() || null,
  };
}
