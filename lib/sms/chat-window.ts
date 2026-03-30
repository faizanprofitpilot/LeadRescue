import type { ChatTurn } from "@/lib/ai/generate-reply";
import type { MessageRow } from "@/lib/types";
import { AI_CHAT_MESSAGE_WINDOW } from "@/lib/sms/constants";

export function buildChatTurns(rows: MessageRow[]): ChatTurn[] {
  return rows.map((m) => ({
    role: m.direction === "inbound" ? "user" : "assistant",
    content: m.body,
  }));
}

/** Keeps the tail of the transcript for model context; older turns rely on extracted_json. */
export function takeRecentChatTurns(
  turns: ChatTurn[],
  maxMessages: number = AI_CHAT_MESSAGE_WINDOW,
): ChatTurn[] {
  if (turns.length <= maxMessages) return turns;
  return turns.slice(-maxMessages);
}
