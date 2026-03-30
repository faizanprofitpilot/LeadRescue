/**
 * Toll-free verification (TFV) `business_type` values per Twilio Messaging API.
 * @see https://www.twilio.com/docs/messaging/api/tollfree-verification-resource
 */
export const TWILIO_TOLLFREE_BUSINESS_TYPES = [
  "PRIVATE_PROFIT",
  "PUBLIC_PROFIT",
  "SOLE_PROPRIETOR",
  "NON_PROFIT",
  "GOVERNMENT",
] as const;

export type TwilioTollfreeBusinessType = (typeof TWILIO_TOLLFREE_BUSINESS_TYPES)[number];

export const TWILIO_TOLLFREE_BUSINESS_TYPE_LABELS: Record<TwilioTollfreeBusinessType, string> =
  {
    PRIVATE_PROFIT: "Private company (for profit)",
    PUBLIC_PROFIT: "Public company (for profit)",
    SOLE_PROPRIETOR: "Sole proprietor",
    NON_PROFIT: "Non-profit organization",
    GOVERNMENT: "Government",
  };

export function isTwilioTollfreeBusinessType(
  value: string | null | undefined,
): value is TwilioTollfreeBusinessType {
  return (
    typeof value === "string" &&
    (TWILIO_TOLLFREE_BUSINESS_TYPES as readonly string[]).includes(value)
  );
}
