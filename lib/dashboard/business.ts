import { createClient } from "@/lib/supabase/server";
import { parseSetupChecklist } from "@/lib/dashboard/setup-checklist";
import type {
  Business,
  BusinessKnowledgeBaseRow,
  PhoneNumberRow,
  TollFreeVerificationRow,
} from "@/lib/types";

function normalizeBusiness(row: Record<string, unknown>): Business {
  const b = row as Business;
  return {
    ...b,
    primary_service_category:
      (row.primary_service_category as string | null | undefined) ?? null,
    setup_checklist: parseSetupChecklist(row.setup_checklist ?? {}),
    niche: (b.niche as string) ?? "home_services",
  };
}

export async function getBusinessForUser(): Promise<{
  business: Business | null;
  phoneNumbers: PhoneNumberRow[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { business: null, phoneNumbers: [] };
  }

  const { data: business, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !business) {
    return { business: null, phoneNumbers: [] };
  }

  const b = normalizeBusiness(business as Record<string, unknown>);
  const { data: phones } = await supabase
    .from("phone_numbers")
    .select("*")
    .eq("business_id", b.id)
    .order("created_at", { ascending: true });

  return {
    business: b,
    phoneNumbers: (phones ?? []) as PhoneNumberRow[],
  };
}

export async function getDashboardContext(): Promise<{
  business: Business | null;
  phoneNumbers: PhoneNumberRow[];
  knowledgeBase: BusinessKnowledgeBaseRow | null;
  tollFreeVerification: TollFreeVerificationRow | null;
}> {
  const base = await getBusinessForUser();
  if (!base.business) {
    return {
      business: null,
      phoneNumbers: [],
      knowledgeBase: null,
      tollFreeVerification: null,
    };
  }

  const supabase = await createClient();

  const { data: kb } = await supabase
    .from("business_knowledge_base")
    .select("*")
    .eq("business_id", base.business.id)
    .maybeSingle();

  const { data: tfv } = await supabase
    .from("toll_free_verifications")
    .select("*")
    .eq("business_id", base.business.id)
    .maybeSingle();

  return {
    business: base.business,
    phoneNumbers: base.phoneNumbers,
    knowledgeBase: (kb ?? null) as BusinessKnowledgeBaseRow | null,
    tollFreeVerification: (tfv ?? null) as TollFreeVerificationRow | null,
  };
}
