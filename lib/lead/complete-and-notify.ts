import { createAdminClient } from "@/lib/supabase/admin";
import { hasRequiredLeadFields, type ExtractedLead } from "@/lib/ai/schemas";
import { sendLeadSummaryEmail } from "@/lib/email/send-lead-summary";
import { logSmsEvent } from "@/lib/sms/logging";
import type { Business, CompletionReason, Conversation, Lead } from "@/lib/types";

export async function maybeCompleteConversation(params: {
  conversationId: string;
  leadId: string;
  businessId: string;
  extracted: ExtractedLead;
  messageCount: number;
}): Promise<void> {
  const admin = createAdminClient();

  const { data: convRow } = await admin
    .from("conversations")
    .select("*")
    .eq("id", params.conversationId)
    .single();

  if (!convRow) return;
  const conv = convRow as Conversation;
  if (conv.ai_state !== "active") return;

  const { data: leadRow } = await admin
    .from("leads")
    .select("*")
    .eq("id", params.leadId)
    .single();

  const { data: bizRow } = await admin
    .from("businesses")
    .select("*")
    .eq("id", params.businessId)
    .single();

  if (!leadRow || !bizRow) return;

  const lead = leadRow as Lead;
  const hasPhone = Boolean(lead.caller_phone?.trim());
  const requiredMet = hasRequiredLeadFields(params.extracted, hasPhone);
  const maxTurns = Number(process.env.LEAD_MAX_SMS_TURNS ?? "18");
  const overLimit = params.messageCount >= maxTurns;

  if (!requiredMet && !overLimit) {
    return;
  }

  const now = new Date().toISOString();
  const completionReason: CompletionReason = requiredMet
    ? "required_fields_collected"
    : "max_turns_reached";

  logSmsEvent("conversation_completed", {
    conversationId: params.conversationId,
    leadId: params.leadId,
    reason: completionReason,
    requiredMet: String(requiredMet),
    overLimit: String(overLimit),
  });

  await admin
    .from("conversations")
    .update({
      ai_state: "completed",
      completed_at: now,
      completion_reason: completionReason,
      extracted_json: params.extracted as unknown as Record<string, unknown>,
    })
    .eq("id", params.conversationId);

  const { data: freshLead } = await admin
    .from("leads")
    .select("*")
    .eq("id", params.leadId)
    .single();

  if (!freshLead || conv.summary_email_sent_at) {
    return;
  }

  const { error } = await sendLeadSummaryEmail({
    business: bizRow as Business,
    lead: freshLead as Lead,
  });

  if (!error) {
    await admin
      .from("conversations")
      .update({ summary_email_sent_at: now })
      .eq("id", params.conversationId);
  }
}
