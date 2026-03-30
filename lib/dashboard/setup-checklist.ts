import type { SetupChecklist } from "@/lib/types";

const DEFAULT_CHECKLIST: SetupChecklist = {
  business_info: false,
  number_generated: false,
  verification_submitted: false,
  knowledge_base: false,
  forwarding_acknowledged: false,
  test_completed: false,
};

export function parseSetupChecklist(raw: unknown): SetupChecklist {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_CHECKLIST };
  const o = raw as Record<string, unknown>;
  return {
    business_info: Boolean(o.business_info),
    number_generated: Boolean(o.number_generated),
    verification_submitted: Boolean(o.verification_submitted),
    knowledge_base: Boolean(o.knowledge_base),
    forwarding_acknowledged: Boolean(o.forwarding_acknowledged),
    test_completed: Boolean(o.test_completed),
  };
}

export function mergeChecklist(
  current: SetupChecklist,
  patch: Partial<SetupChecklist>,
): SetupChecklist {
  return { ...current, ...patch };
}
