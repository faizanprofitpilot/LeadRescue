import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendLeadSummaryEmail } from "@/lib/email/send-lead-summary";
import type { Business, Conversation, Lead } from "@/lib/types";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-internal-secret");
  if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
    return unauthorized();
  }

  let body: { leadId?: string };
  try {
    body = (await request.json()) as { leadId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.leadId) {
    return NextResponse.json({ error: "leadId required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: lead } = await admin
    .from("leads")
    .select("*")
    .eq("id", body.leadId)
    .single();

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const { data: business } = await admin
    .from("businesses")
    .select("*")
    .eq("id", lead.business_id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const { data: conv } = await admin
    .from("conversations")
    .select("*")
    .eq("lead_id", body.leadId)
    .maybeSingle();

  const conversation = conv as Conversation | null;
  if (conversation?.summary_email_sent_at) {
    return NextResponse.json({ ok: true, skipped: "already_sent" });
  }

  const result = await sendLeadSummaryEmail({
    business: business as Business,
    lead: lead as Lead,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const now = new Date().toISOString();
  if (conversation) {
    await admin
      .from("conversations")
      .update({ summary_email_sent_at: now })
      .eq("id", conversation.id);
  }

  return NextResponse.json({ ok: true, id: result.id });
}
