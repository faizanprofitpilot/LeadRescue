/**
 * Default compliance copy for texting-line registration. Shown when DB has no saved value.
 * Keep in sync with validation in app/dashboard/onboarding/setup-actions.ts.
 */
export const VERIFICATION_DEFAULT_USE_CASE =
  "We send SMS messages to customers who attempted to call our business but were unable to reach us. These messages help collect service details (such as job type, address, and urgency) so our team can follow up and schedule service.";

export const VERIFICATION_DEFAULT_SAMPLE_1 =
  "Hi, sorry we missed your call. What can we help you with today?";

export const VERIFICATION_DEFAULT_SAMPLE_2 =
  "Thanks. Can you share the service needed and your address so we can follow up?";

export const VERIFICATION_DEFAULT_CONSENT =
  "Customers opt in by calling our business directly. Messages are sent only in response to inbound calls. Customers can reply STOP to opt out at any time.";

/** Consent text should mention how customers can opt out (messaging compliance). */
export function consentIncludesOptOutLanguage(text: string): boolean {
  const s = text.trim().toLowerCase();
  if (!s) return false;
  return (
    s.includes("opt out") ||
    s.includes("opt-out") ||
    /\breply\s+stop\b/.test(s) ||
    /\btext\s+stop\b/.test(s) ||
    s.includes("unsubscribe")
  );
}
