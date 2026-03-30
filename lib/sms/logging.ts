export function logSmsEvent(
  event: string,
  detail: Record<string, string | number | boolean | null | undefined>,
): void {
  console.info(`[leadrescue:sms] ${event}`, detail);
}
