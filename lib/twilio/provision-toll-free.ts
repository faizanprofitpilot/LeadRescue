import { getTwilioClient } from "@/lib/twilio/client";

export type ProvisionResult = {
  phoneNumber: string;
  twilioSid: string;
};

/**
 * Search for an available US toll-free number and purchase it with Voice + SMS webhooks.
 * All Twilio identifiers stay server-side; never return SID to client UI.
 */
export async function provisionTollFreeNumber(): Promise<ProvisionResult> {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error("NEXT_PUBLIC_APP_URL is required for webhook configuration");
  }

  const voiceUrl = `${base}/api/twilio/voice`;
  const smsUrl = `${base}/api/twilio/sms`;

  const client = getTwilioClient();

  const available = await client
    .availablePhoneNumbers("US")
    .tollFree.list({
      limit: 5,
      smsEnabled: true,
      voiceEnabled: true,
    });

  if (!available.length) {
    throw new Error(
      "No toll-free numbers are available right now. Try again in a few minutes.",
    );
  }

  let lastErr: Error | null = null;
  for (const candidate of available) {
    try {
      const incoming = await client.incomingPhoneNumbers.create({
        phoneNumber: candidate.phoneNumber,
        voiceUrl,
        voiceMethod: "POST",
        smsUrl,
        smsMethod: "POST",
      });
      return {
        phoneNumber: incoming.phoneNumber,
        twilioSid: incoming.sid,
      };
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastErr ?? new Error("Could not provision a toll-free number.");
}
