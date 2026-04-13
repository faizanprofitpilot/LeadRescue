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
  const s = (twilioStatus ?? "").trim().toUpperCase();

  // Twilio has historically used TWILIO_APPROVED / TWILIO_REJECTED, but we treat
  // common variants defensively so UI reflects the Console status.
  if (
    s === "TWILIO_APPROVED" ||
    s === "APPROVED" ||
    s === "ACTIVE" ||
    s.includes("APPROVED") ||
    s.includes("VERIFIED")
  ) {
    return "approved";
  }
  if (s === "TWILIO_REJECTED" || s === "REJECTED" || s.includes("REJECT")) {
    return editAllowed ? "needs_changes" : "rejected";
  }
  if (s === "PENDING_REVIEW" || s === "IN_REVIEW" || s.includes("REVIEW") || s.includes("PENDING")) {
    return "submitted";
  }
  return "submitted";
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
