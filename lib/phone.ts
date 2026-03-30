/**
 * Normalize Twilio-style numbers to E.164 when possible (US default +1).
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  if (raw.startsWith("+") && digits.length >= 10) {
    return `+${digits}`;
  }
  return raw.trim() || null;
}

export function phonesMatch(a: string, b: string): boolean {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  if (na && nb) return na === nb;
  return a.replace(/\D/g, "") === b.replace(/\D/g, "");
}
