import twilio from "twilio";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";
import { parseAndValidateTwilioForm } from "@/lib/twilio/validate-request";
import { getTwilioClient } from "@/lib/twilio/client";
import { markTestCompletedIfFirstLead } from "@/lib/dashboard/auto-checklist";

const FIRST_SMS =
  "Hey, sorry we missed your call. What home service can we help you with today?";

function twimlHangup(): Response {
  const vr = new twilio.twiml.VoiceResponse();
  vr.hangup();
  return new NextResponse(vr.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

export async function POST(request: NextRequest) {
  const { ok, params } = await parseAndValidateTwilioForm(request);
  if (!ok) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const callSid = params.CallSid;
  const fromRaw = params.From;
  const toRaw = params.To;

  if (!callSid || !fromRaw || !toRaw) {
    return twimlHangup();
  }

  const from = normalizePhone(fromRaw);
  const to = normalizePhone(toRaw);
  if (!from || !to) {
    return twimlHangup();
  }

  const admin = createAdminClient();

  const { data: existingLead } = await admin
    .from("leads")
    .select("id")
    .eq("twilio_call_sid", callSid)
    .maybeSingle();

  if (existingLead) {
    return twimlHangup();
  }

  const { data: phoneRow } = await admin
    .from("phone_numbers")
    .select("id, business_id, phone_number")
    .eq("phone_number", to)
    .maybeSingle();

  if (!phoneRow) {
    return twimlHangup();
  }

  const nowIso = new Date().toISOString();

  await admin
    .from("conversations")
    .update({
      ai_state: "stale",
      stale_at: nowIso,
    })
    .eq("business_id", phoneRow.business_id)
    .eq("caller_phone_normalized", from)
    .eq("ai_state", "active");

  const { data: lead, error: leadError } = await admin
    .from("leads")
    .insert({
      business_id: phoneRow.business_id,
      caller_phone: from,
      twilio_call_sid: callSid,
      source: "missed_call",
      status: "new",
    })
    .select("id")
    .single();

  if (leadError || !lead) {
    return twimlHangup();
  }

  const { data: conversation, error: convError } = await admin
    .from("conversations")
    .insert({
      lead_id: lead.id,
      business_id: phoneRow.business_id,
      caller_phone_normalized: from,
      ai_state: "active",
      extracted_json: {},
      last_message_at: nowIso,
    })
    .select("id")
    .single();

  if (convError || !conversation) {
    return twimlHangup();
  }

  const client = getTwilioClient();
  let outboundSid: string | null = null;
  try {
    const msg = await client.messages.create({
      to: from,
      from: phoneRow.phone_number,
      body: FIRST_SMS,
    });
    outboundSid = msg.sid;
  } catch {
    return twimlHangup();
  }

  await admin.from("messages").insert({
    conversation_id: conversation.id,
    direction: "outbound",
    body: FIRST_SMS,
    provider_message_sid: outboundSid,
  });

  await admin
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversation.id);

  await markTestCompletedIfFirstLead(phoneRow.business_id);

  return twimlHangup();
}
