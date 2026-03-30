/** Production site origin (server-side defaults when NEXT_PUBLIC_APP_URL is unset). */
export const LEADRESCUE_PUBLIC_ORIGIN = "https://leadrescue.xyz";

/** Default HTTPS URL included in toll-free texting line registration payloads when none is configured. */
export const DEFAULT_TFV_OPT_IN_PROOF_URL = `${LEADRESCUE_PUBLIC_ORIGIN}/compliance/opt-in`;
