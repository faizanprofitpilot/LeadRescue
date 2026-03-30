import { createAdminClient } from "@/lib/supabase/admin";
import { mergeChecklist, parseSetupChecklist } from "@/lib/dashboard/setup-checklist";

/** When the first lead is created for a business, mark the setup test step complete. */
export async function markTestCompletedIfFirstLead(
  businessId: string,
): Promise<void> {
  const admin = createAdminClient();
  const { count, error: cErr } = await admin
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);

  if (cErr || count !== 1) return;

  const { data: biz } = await admin
    .from("businesses")
    .select("setup_checklist")
    .eq("id", businessId)
    .single();

  if (!biz) return;

  const checklist = mergeChecklist(parseSetupChecklist(biz.setup_checklist), {
    test_completed: true,
  });

  await admin
    .from("businesses")
    .update({ setup_checklist: checklist })
    .eq("id", businessId);
}
