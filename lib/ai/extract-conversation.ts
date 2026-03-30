import { getOpenAI, openaiModel } from "@/lib/ai/openai-client";
import {
  extractedLeadSchema,
  type ExtractedLead,
  mergeExtracted,
} from "@/lib/ai/schemas";
import type { ChatTurn } from "@/lib/ai/generate-reply";

function extractionSystem(knowledgeBlock: string) {
  return `You extract structured lead data from an SMS thread for a home services business.

BUSINESS KNOWLEDGE (use to interpret messages; do not invent services or areas):
${knowledgeBlock}

Return ONLY valid JSON matching this shape (use null for unknown fields):
{
  "caller_name": string | null,
  "service_category": string | null,
  "issue_description": string | null,
  "service_address": string | null,
  "service_city": string | null,
  "service_state": string | null,
  "service_postal_code": string | null,
  "appointment_timing": string | null,
  "urgency": string | null,
  "callback_notes": string | null,
  "summary": string | null,
  "conversation_complete": boolean
}

Rules:
- conversation_complete: true only if customer name (caller_name), service type (service_category), issue (issue_description), a usable address (street + city/state OR at least city + state), AND either urgency OR preferred timing (appointment_timing) are captured.
- summary: one short sentence for the business owner.
- Do not invent details; use null if not stated.`;
}

export async function extractLeadDataFromConversation(params: {
  previous: Record<string, unknown>;
  messages: ChatTurn[];
  knowledgeBasePrompt: string;
}): Promise<ExtractedLead> {
  const openai = getOpenAI();
  const transcript = params.messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const completion = await openai.chat.completions.create({
    model: openaiModel(),
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: extractionSystem(params.knowledgeBasePrompt) },
      {
        role: "user",
        content: `Previous extracted JSON (may be empty): ${JSON.stringify(params.previous)}\n\nTranscript:\n${transcript}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    return mergeExtracted(params.previous, {});
  }

  try {
    const json = JSON.parse(raw) as unknown;
    const parsed = extractedLeadSchema.safeParse(json);
    if (!parsed.success) {
      return mergeExtracted(params.previous, {});
    }
    return mergeExtracted(params.previous, parsed.data);
  } catch {
    return mergeExtracted(params.previous, {});
  }
}
