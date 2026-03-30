import { getOpenAI, openaiModel } from "@/lib/ai/openai-client";
import type { ExtractedLead } from "@/lib/ai/schemas";

export type ChatTurn = { role: "user" | "assistant"; content: string };

function baseSystem(knowledgeBlock: string, primaryCategory: string | null) {
  const cat = primaryCategory
    ? `Primary trade focus for this account: ${primaryCategory.replace(/_/g, " ")}.`
    : "";

  return `You are LeadRescue, texting on behalf of a home services business (HVAC, plumbing, electrical, cleaning, landscaping, etc.) after a missed call.

${cat}

BUSINESS KNOWLEDGE (follow strictly; if something is unknown, do not invent):
${knowledgeBlock}

Goals:
- Sound helpful, concise, and professional. One clear question at a time when possible.
- Collect: customer name, what service they need, brief issue, job address (street + city/state or full address), how urgent it is, when they want service, callback preference if useful.
- If the customer mentions a location outside the stated service areas, do not promise coverage; say you will pass it to the team to confirm availability.
- Do NOT offer services listed under excluded jobs. Do NOT promise exact arrival times or emergency response if knowledge base says no emergency service.
- Do NOT give prices or quotes. If they ask price, say a technician will assess and the team will follow up.
- Do NOT be overly chatty or use emojis unless the customer uses them first.
- When you have enough info, close politely (e.g. the team will follow up shortly). Keep under 320 characters when possible (SMS).`;
}

export async function generateNextSmsReply(params: {
  businessName: string;
  primaryServiceCategory: string | null;
  knowledgeBasePrompt: string;
  messages: ChatTurn[];
  extracted: ExtractedLead;
}): Promise<string> {
  const openai = getOpenAI();
  const known = JSON.stringify(params.extracted ?? {});
  const SYSTEM = baseSystem(
    params.knowledgeBasePrompt,
    params.primaryServiceCategory,
  );

  const completion = await openai.chat.completions.create({
    model: openaiModel(),
    temperature: 0.4,
    max_tokens: 220,
    messages: [
      {
        role: "system",
        content: `${SYSTEM}\n\nBusiness name: ${params.businessName}\nKnown extracted fields (JSON): ${known}\n\nReply with ONLY the next SMS text to send (no quotes, no JSON). Stay under 320 characters if possible.`,
      },
      ...params.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? "";
  if (!text) {
    return "Thanks, got it. What’s the best address for the job?";
  }
  return text.slice(0, 1600);
}
