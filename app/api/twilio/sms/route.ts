import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractLeadDataFromConversation } from "@/lib/ai/extract-conversation";
import { generateNextSmsReply } from "@/lib/ai/generate-reply";
import { mergeExtracted, type ExtractedLead } from "@/lib/ai/schemas";
import { maybeCompleteConversation } from "@/lib/lead/complete-and-notify";
import { leadUpdateFromExtraction } from "@/lib/lead/apply-extraction";
import { normalizePhone } from "@/lib/phone";
import {
  buildChatTurns,
  takeRecentChatTurns,
} from "@/lib/sms/chat-window";
import {
  SMS_FALLBACK_CLOSED,
  SMS_FALLBACK_COMPLETED,
  SMS_FALLBACK_NO_THREAD,
  SMS_FALLBACK_STALE,
  STALE_THREAD_INACTIVE_MS,
} from "@/lib/sms/constants";
import { logSmsEvent } from "@/lib/sms/logging";
import { parseAndValidateTwilioForm } from "@/lib/twilio/validate-request";
import { getTwilioClient } from "@/lib/twilio/client";
import { formatKnowledgeBaseForPrompt } from "@/lib/dashboard/knowledge-format";
import type {
  BusinessKnowledgeBaseRow,
  Conversation,
  Lead,
  MessageRow,
} from "@/lib/types";

function nonEmptyPatch(
  patch: Record<string, string | null>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v !== null && String(v).trim() !== "") {
      out[k] = String(v).trim();
    }
  }
  return out;
}

async function touchConversationLastMessageAt(
  admin: ReturnType<typeof createAdminClient>,
  conversationId: string,
): Promise<void> {
  const now = new Date().toISOString();
  await admin
    .from("conversations")
    .update({ last_message_at: now })
    .eq("id", conversationId);
}

function isInactiveBeyondMs(lastMessageAt: string, ms: number): boolean {
  const t = new Date(lastMessageAt).getTime();
  if (Number.isNaN(t)) return true;
  return Date.now() - t > ms;
}

export async function POST(request: NextRequest) {
  const { ok, params } = await parseAndValidateTwilioForm(request);
  if (!ok) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const fromRaw = params.From;
  const toRaw = params.To;
  const inboundBody = (params.Body ?? "").trim();
  const inboundSid = params.MessageSid ?? null;

  if (!fromRaw || !toRaw) {
    return new NextResponse("", { status: 200 });
  }

  const fromNorm = normalizePhone(fromRaw);
  const toNorm = normalizePhone(toRaw);
  if (!fromNorm || !toNorm) {
    return new NextResponse("", { status: 200 });
  }
  const customerE164 = fromNorm;
  const inboundLineE164 = toNorm;

  const admin = createAdminClient();

  const { data: phoneRow } = await admin
    .from("phone_numbers")
    .select("id, business_id, phone_number, phone_type, line_verification_status")
    .eq("phone_number", inboundLineE164)
    .maybeSingle();

  if (!phoneRow) {
    return new NextResponse("", { status: 200 });
  }

  const inboundLine = phoneRow;
  const tollFreeOutboundBlocked =
    inboundLine.phone_type === "toll_free" &&
    inboundLine.line_verification_status !== "approved";

  const outboundFromNumber = inboundLine.phone_number;
  const businessId = inboundLine.business_id;

  const { data: bizRow } = await admin
    .from("businesses")
    .select("id, business_name, primary_service_category")
    .eq("id", businessId)
    .single();

  if (!bizRow) {
    return new NextResponse("", { status: 200 });
  }

  const business = bizRow as {
    business_name: string;
    id: string;
    primary_service_category: string | null;
  };

  if (inboundSid) {
    const { data: dup } = await admin
      .from("messages")
      .select("id")
      .eq("provider_message_sid", inboundSid)
      .maybeSingle();
    if (dup) {
      logSmsEvent("duplicate_inbound_suppressed", {
        messageSid: inboundSid,
        businessId,
        from: customerE164,
      });
      return new NextResponse("", { status: 200 });
    }
  }

  if (!inboundBody) {
    return new NextResponse("", { status: 200 });
  }

  const { data: kbRow } = await admin
    .from("business_knowledge_base")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();

  const knowledgeBasePrompt = formatKnowledgeBaseForPrompt(
    kbRow as BusinessKnowledgeBaseRow | null,
  );

  const { data: activeRow } = await admin
    .from("conversations")
    .select("*")
    .eq("business_id", businessId)
    .eq("caller_phone_normalized", customerE164)
    .eq("ai_state", "active")
    .maybeSingle();

  const activeConv = activeRow as Conversation | null;

  async function sendSms(body: string): Promise<void> {
    if (tollFreeOutboundBlocked) {
      logSmsEvent("toll_free_verification_outbound_blocked", {
        businessId,
        lineVerificationStatus: inboundLine.line_verification_status ?? null,
      });
      return;
    }
    const twilio = getTwilioClient();
    await twilio.messages.create({
      to: customerE164,
      from: outboundFromNumber,
      body,
    });
  }

  /** Latest non-active thread for this caller + business (for fallback messaging). */
  const { data: latestEnded } = await admin
    .from("conversations")
    .select("*")
    .eq("business_id", businessId)
    .eq("caller_phone_normalized", customerE164)
    .in("ai_state", ["completed", "stale", "closed"])
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const endedConv = latestEnded as Conversation | null;

  if (!activeConv) {
    let reply = SMS_FALLBACK_NO_THREAD;
    let path = "no_active_no_history";
    if (endedConv) {
      if (endedConv.ai_state === "stale") {
        reply = SMS_FALLBACK_STALE;
        path = "fallback_stale_history";
      } else if (endedConv.ai_state === "closed") {
        reply = SMS_FALLBACK_CLOSED;
        path = "fallback_closed_history";
      } else {
        reply = SMS_FALLBACK_COMPLETED;
        path = "fallback_completed_history";
      }
    }
    logSmsEvent("inbound_no_active_conversation", {
      businessId,
      from: customerE164,
      path,
      endedConversationId: endedConv?.id ?? null,
    });
    await sendSms(reply);
    return new NextResponse("", { status: 200 });
  }

  const conv = activeConv;

  if (isInactiveBeyondMs(conv.last_message_at, STALE_THREAD_INACTIVE_MS)) {
    const now = new Date().toISOString();

    const { error: staleInboundErr } = await admin.from("messages").insert({
      conversation_id: conv.id,
      direction: "inbound",
      body: inboundBody,
      provider_message_sid: inboundSid,
    });
    if (staleInboundErr?.code === "23505") {
      return new NextResponse("", { status: 200 });
    }

    await admin
      .from("conversations")
      .update({
        ai_state: "stale",
        stale_at: now,
        last_message_at: now,
      })
      .eq("id", conv.id);

    logSmsEvent("conversation_marked_stale_on_inbound", {
      conversationId: conv.id,
      leadId: conv.lead_id,
      lastMessageAt: conv.last_message_at,
    });

    await sendSms(SMS_FALLBACK_STALE);
    return new NextResponse("", { status: 200 });
  }

  const { error: insInboundErr } = await admin.from("messages").insert({
    conversation_id: conv.id,
    direction: "inbound",
    body: inboundBody,
    provider_message_sid: inboundSid,
  });

  if (insInboundErr?.code === "23505") {
    logSmsEvent("duplicate_inbound_race_suppressed", {
      messageSid: inboundSid ?? "",
      conversationId: conv.id,
    });
    return new NextResponse("", { status: 200 });
  }
  if (insInboundErr) {
    logSmsEvent("inbound_insert_failed", {
      code: insInboundErr.code ?? "",
      message: insInboundErr.message,
    });
    return new NextResponse("", { status: 200 });
  }

  await touchConversationLastMessageAt(admin, conv.id);

  logSmsEvent("inbound_matched_active", {
    conversationId: conv.id,
    leadId: conv.lead_id,
    businessId,
  });

  if (tollFreeOutboundBlocked) {
    logSmsEvent("toll_free_verification_inbound_no_ai", {
      businessId,
      conversationId: conv.id,
      lineVerificationStatus: inboundLine.line_verification_status ?? null,
    });
    return new NextResponse("", { status: 200 });
  }

  const { data: messageRows } = await admin
    .from("messages")
    .select("*")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: true });

  const messages = (messageRows ?? []) as MessageRow[];
  const fullTurns = buildChatTurns(messages);
  const turnsForModel = takeRecentChatTurns(fullTurns);

  const { data: leadRow } = await admin
    .from("leads")
    .select("*")
    .eq("id", conv.lead_id)
    .single();

  const lead = leadRow as Lead | null;
  if (!lead) {
    return new NextResponse("", { status: 200 });
  }

  const previousExtracted = (conv.extracted_json ?? {}) as Record<
    string,
    unknown
  >;
  const extracted = await extractLeadDataFromConversation({
    previous: previousExtracted,
    messages: turnsForModel,
    knowledgeBasePrompt,
  });

  const merged: ExtractedLead = mergeExtracted(previousExtracted, extracted);

  await admin
    .from("conversations")
    .update({
      extracted_json: merged as unknown as Record<string, unknown>,
    })
    .eq("id", conv.id);

  const patch = nonEmptyPatch(leadUpdateFromExtraction(merged));
  if (Object.keys(patch).length > 0) {
    await admin.from("leads").update(patch).eq("id", lead.id);
  }

  const replyText = await generateNextSmsReply({
    businessName: business.business_name,
    primaryServiceCategory: business.primary_service_category,
    knowledgeBasePrompt,
    messages: turnsForModel,
    extracted: merged,
  });

  const twilio = getTwilioClient();
  const outbound = await twilio.messages.create({
    to: customerE164,
    from: outboundFromNumber,
    body: replyText,
  });

  await admin.from("messages").insert({
    conversation_id: conv.id,
    direction: "outbound",
    body: replyText,
    provider_message_sid: outbound.sid,
  });

  await touchConversationLastMessageAt(admin, conv.id);

  const messageCount = messages.length + 1;

  await maybeCompleteConversation({
    conversationId: conv.id,
    leadId: lead.id,
    businessId,
    extracted: merged,
    messageCount,
  });

  return new NextResponse("", { status: 200 });
}
