import type { TollFreeVerificationRow } from "@/lib/types";

export type VerificationSubmitPayload = Pick<
  TollFreeVerificationRow,
  | "legal_business_name"
  | "public_business_name"
  | "business_type"
  | "website"
  | "business_email"
  | "business_phone"
  | "business_address_line_1"
  | "business_address_line_2"
  | "business_city"
  | "business_state"
  | "business_postal_code"
  | "business_country"
  | "registration_number"
  | "use_case_description"
  | "sample_message_1"
  | "sample_message_2"
  | "consent_description"
>;

/**
 * Twilio Trust Hub / toll-free verification API integration can be wired here.
 * For V1 we persist records in Supabase only; provider_submission_id stays null until integrated.
 */
export async function submitToProvider(
  _row: VerificationSubmitPayload & { id: string; business_id: string },
): Promise<{ provider_submission_id: string | null; provider_response_payload: unknown }> {
  // TODO: Call Twilio Trust Hub / Regulatory Compliance when account + bundle IDs are configured.
  // Example env: TWILIO_TF_BUNDLE_SID, TWILIO_END_USER_SID, etc.
  return {
    provider_submission_id: null,
    provider_response_payload: {
      mode: "local_only",
      note: "Submission stored in LeadRescue; Twilio API hook pending configuration.",
    },
  };
}
