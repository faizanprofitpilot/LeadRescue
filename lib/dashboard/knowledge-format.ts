import type { BusinessKnowledgeBaseRow } from "@/lib/types";

/** Compact block for system prompts (no PII beyond what the business entered). */
export function formatKnowledgeBaseForPrompt(
  kb: BusinessKnowledgeBaseRow | null,
): string {
  if (!kb) {
    return "No business knowledge base has been configured yet. Use generic professional home-services language.";
  }
  const parts: string[] = [];
  if (kb.services_offered?.trim()) {
    parts.push(`Services offered: ${kb.services_offered.trim()}`);
  }
  if (kb.service_areas?.trim()) {
    parts.push(`Service areas: ${kb.service_areas.trim()}`);
  }
  if (kb.business_hours?.trim()) {
    parts.push(`Hours: ${kb.business_hours.trim()}`);
  }
  parts.push(
    `Emergency / after-hours service: ${kb.emergency_service_available ? "Yes" : "No"}`,
  );
  if (kb.excluded_jobs?.trim()) {
    parts.push(`Do NOT offer or schedule these job types: ${kb.excluded_jobs.trim()}`);
  }
  if (kb.tone_guidance?.trim()) {
    parts.push(`Tone: ${kb.tone_guidance.trim()}`);
  }
  if (kb.ai_notes?.trim()) {
    parts.push(`Owner notes for SMS: ${kb.ai_notes.trim()}`);
  }
  return parts.join("\n");
}
