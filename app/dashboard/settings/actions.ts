"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";
import { SERVICE_CATEGORIES } from "@/lib/dashboard/service-categories";

const schema = z.object({
  businessName: z.string().min(2).max(200),
  ownerName: z.string().max(200).optional().or(z.literal("")),
  ownerEmail: z.string().email(),
  ownerPhone: z.string().max(40).optional().or(z.literal("")),
  primaryServiceCategory: z.enum(SERVICE_CATEGORIES),
});

export type SettingsState = { error?: string; ok?: boolean };

export async function updateSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const parsed = schema.safeParse({
    businessName: formData.get("businessName"),
    ownerName: formData.get("ownerName"),
    ownerEmail: formData.get("ownerEmail"),
    ownerPhone: formData.get("ownerPhone"),
    primaryServiceCategory: formData.get("primaryServiceCategory"),
  });

  if (!parsed.success) {
    return { error: "Please check the form for errors." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return { error: "Complete onboarding first." };
  }

  const values = parsed.data;

  const { error } = await supabase
    .from("businesses")
    .update({
      business_name: values.businessName.trim(),
      niche: "home_services",
      primary_service_category: values.primaryServiceCategory,
      owner_name: values.ownerName?.trim() || null,
      owner_email: values.ownerEmail.trim(),
      owner_phone: values.ownerPhone?.trim()
        ? normalizePhone(values.ownerPhone) ?? values.ownerPhone.trim()
        : null,
    })
    .eq("id", business.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/onboarding");
  return { ok: true };
}
