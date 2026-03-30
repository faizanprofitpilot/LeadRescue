import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractLeadDataFromConversation } from "@/lib/ai/extract-conversation";
import {
  mergeExtracted,
  type ExtractedLead,
} from "@/lib/ai/schemas";
import { leadUpdateFromExtraction } from "@/lib/lead/apply-extraction";
import { formatKnowledgeBaseForPrompt } from "@/lib/dashboard/knowledge-format";
import {
  buildChatTurns,
  takeRecentChatTurns,
} from "@/lib/sms/chat-window";
import type { BusinessKnowledgeBaseRow, MessageRow } from "@/lib/types";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

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

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-internal-secret");
  if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
    return unauthorized();
  }

  let body: { conversationId?: string };
  try {
    body = (await request.json()) as { conversationId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.conversationId) {
    return NextResponse.json({ error: "conversationId required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: conv } = await admin
    .from("conversations")
    .select("*")
    .eq("id", body.conversationId)
    .single();

  if (!conv) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const leadId = conv.lead_id as string;

  const { data: leadRow } = await admin
    .from("leads")
    .select("business_id")
    .eq("id", leadId)
    .single();

  if (!leadRow?.business_id) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const { data: kbRow } = await admin
    .from("business_knowledge_base")
    .select("*")
    .eq("business_id", leadRow.business_id)
    .maybeSingle();

  const knowledgeBasePrompt = formatKnowledgeBaseForPrompt(
    (kbRow ?? null) as BusinessKnowledgeBaseRow | null,
  );

  const { data: msgs } = await admin
    .from("messages")
    .select("*")
    .eq("conversation_id", body.conversationId)
    .order("created_at", { ascending: true });

  const messages = (msgs ?? []) as MessageRow[];
  const turns = takeRecentChatTurns(buildChatTurns(messages));

  const previous = (conv.extracted_json ?? {}) as Record<string, unknown>;
  const extracted = await extractLeadDataFromConversation({
    previous,
    messages: turns,
    knowledgeBasePrompt,
  });
  const merged: ExtractedLead = mergeExtracted(previous, extracted);

  await admin
    .from("conversations")
    .update({
      extracted_json: merged as unknown as Record<string, unknown>,
    })
    .eq("id", body.conversationId);

  const patch = nonEmptyPatch(leadUpdateFromExtraction(merged));
  if (Object.keys(patch).length > 0) {
    await admin.from("leads").update(patch).eq("id", leadId);
  }

  return NextResponse.json({ ok: true, extracted: merged });
}
