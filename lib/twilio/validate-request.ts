import twilio from "twilio";
import type { NextRequest } from "next/server";

function formBodyToRecord(body: string): Record<string, string> {
  const params = new URLSearchParams(body);
  const out: Record<string, string> = {};
  params.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

export async function parseAndValidateTwilioForm(request: NextRequest): Promise<{
  ok: boolean;
  params: Record<string, string>;
  body: string;
}> {
  const body = await request.text();
  const params = formBodyToRecord(body);
  const skip =
    process.env.NODE_ENV === "development" &&
    process.env.TWILIO_SKIP_SIGNATURE_VERIFY === "true";

  if (skip) {
    return { ok: true, params, body };
  }

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = request.headers.get("x-twilio-signature");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  if (!authToken || !signature || !baseUrl) {
    return { ok: false, params, body };
  }

  const path = new URL(request.url).pathname;
  const url = `${baseUrl}${path}`;
  const valid = twilio.validateRequest(authToken, signature, url, params);
  return { ok: valid, params, body };
}
