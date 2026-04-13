"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { LeadStatus } from "@/lib/types";

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    throw new Error("No business");
  }

  const { data: lead } = await supabase
    .from("leads")
    .select("id, business_id")
    .eq("id", leadId)
    .single();

  if (!lead || lead.business_id !== business.id) {
    throw new Error("Not found");
  }

  await supabase.from("leads").update({ status }).eq("id", leadId);

  revalidatePath("/dashboard/leads");
  revalidatePath(`/dashboard/leads/${leadId}`);
}

export async function deleteLead(leadId: string): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) return { error: "No business" };

  const { data: lead } = await supabase
    .from("leads")
    .select("id, business_id")
    .eq("id", leadId)
    .single();

  if (!lead || lead.business_id !== business.id) return { error: "Not found" };

  const { data: deleted, error } = await supabase
    .from("leads")
    .delete()
    .eq("id", leadId)
    .select("id");

  if (error) return { error: error.message };
  if (!deleted?.length) {
    return {
      error:
        "Could not delete this lead. If this keeps happening, confirm database migrations are applied (leads delete policy).",
    };
  }

  revalidatePath("/dashboard/leads");
  revalidatePath(`/dashboard/leads/${leadId}`);
  return { ok: true };
}
