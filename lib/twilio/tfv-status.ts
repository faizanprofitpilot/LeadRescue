import type { LineVerificationStatus, TollFreeVerificationStatus } from "@/lib/types";

/** Twilio Messaging toll-free verification `status` values */
export type TwilioTfvApiStatus =
  | "PENDING_REVIEW"
  | "IN_REVIEW"
  | "TWILIO_APPROVED"
  | "TWILIO_REJECTED";

export function lineVerificationStatusFromTwilio(
  twilioStatus: string | undefined,
  editAllowed?: boolean | null,
): LineVerificationStatus {
  switch (twilioStatus) {
    case "TWILIO_APPROVED":
      return "approved";
    case "TWILIO_REJECTED":
      return editAllowed ? "needs_changes" : "rejected";
    case "PENDING_REVIEW":
    case "IN_REVIEW":
      return "submitted";
    default:
      return "submitted";
  }
}

export function tollFreeVerificationStatusFromTwilio(
  twilioStatus: string | undefined,
  editAllowed?: boolean | null,
): TollFreeVerificationStatus {
  return lineVerificationStatusFromTwilio(twilioStatus, editAllowed) as TollFreeVerificationStatus;
}

const DEFAULT_USE_CASES = ["CUSTOMER_CARE", "DELIVERY_NOTIFICATIONS"] as const;

export function tfvUseCaseCategoriesFromEnv(): string[] {
  const raw = process.env.TWILIO_TFV_USE_CASE_CATEGORIES?.trim();
  if (!raw) return [...DEFAULT_USE_CASES];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function tfvMessageVolumeFromEnv(): string {
  return process.env.TWILIO_TFV_MESSAGE_VOLUME?.trim() || "100";
}

export function tfvOptInTypeFromEnv(): string {
  return process.env.TWILIO_TFV_OPT_IN_TYPE?.trim() || "VERBAL";
}
