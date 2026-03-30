"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";
import { provisionTollFreeNumber } from "@/lib/twilio/provision-toll-free";
import { mergeChecklist, parseSetupChecklist } from "@/lib/dashboard/setup-checklist";
import { consentIncludesOptOutLanguage } from "@/lib/dashboard/verification-compliance-defaults";
import { submitToProvider } from "@/lib/twilio/verification-adapter";
import type { SetupChecklist, TollFreeVerificationStatus } from "@/lib/types";
import { SERVICE_CATEGORIES } from "@/lib/dashboard/service-categories";
import { TWILIO_TOLLFREE_BUSINESS_TYPES } from "@/lib/dashboard/twilio-tollfree-business-types";

const twilioBusinessTypeEnum = z.enum(TWILIO_TOLLFREE_BUSINESS_TYPES);

const twilioBusinessTypeSubmit = z
  .string()
  .min(1, "Select a business type.")
  .refine(
    (s): s is z.infer<typeof twilioBusinessTypeEnum> =>
      (TWILIO_TOLLFREE_BUSINESS_TYPES as readonly string[]).includes(s),
    { message: "Select a business type." },
  );

const optInImageUrlsField = z.string().max(8000).optional().or(z.literal(""));

function parseOptInHttpsUrls(multiline: string): string[] {
  if (!multiline.trim()) return [];
  return multiline
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => /^https:\/\//i.test(s));
}

function hasServerOptInImageUrlsEnv(): boolean {
  return (process.env.TWILIO_TFV_OPT_IN_IMAGE_URLS ?? "")
    .split(",")
    .some((s) => /^https:\/\//i.test(s.trim()));
}

export async function saveBusinessBasics(formData: FormData): Promise<{
  error?: string;
  ok?: boolean;
}> {
  const schema = z.object({
    businessName: z.string().min(2).max(200),
    ownerName: z.string().max(200).optional().or(z.literal("")),
    ownerEmail: z.string().email(),
    ownerPhone: z.string().max(40).optional().or(z.literal("")),
    primaryServiceCategory: z.enum(SERVICE_CATEGORIES),
  });

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
  if (!user) return { error: "You must be signed in." };

  const v = parsed.data;
  const { data: existing } = await supabase
    .from("businesses")
    .select("id, setup_checklist")
    .eq("user_id", user.id)
    .maybeSingle();

  const checklist = mergeChecklist(parseSetupChecklist(existing?.setup_checklist), {
    business_info: true,
  });

  const payload = {
    user_id: user.id,
    business_name: v.businessName.trim(),
    niche: "home_services",
    primary_service_category: v.primaryServiceCategory,
    owner_name: v.ownerName?.trim() || null,
    owner_email: v.ownerEmail.trim(),
    owner_phone: v.ownerPhone?.trim()
      ? normalizePhone(v.ownerPhone) ?? v.ownerPhone.trim()
      : null,
    setup_checklist: checklist,
  };

  if (existing?.id) {
    const { error } = await supabase
      .from("businesses")
      .update({
        business_name: payload.business_name,
        niche: payload.niche,
        primary_service_category: payload.primary_service_category,
        owner_name: payload.owner_name,
        owner_email: payload.owner_email,
        owner_phone: payload.owner_phone,
        setup_checklist: checklist,
      })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("businesses").insert({
      ...payload,
      onboarding_completed_at: null,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/onboarding");
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function provisionLeadRescueNumber(): Promise<{
  error?: string;
  ok?: boolean;
  phoneNumber?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: business } = await supabase
    .from("businesses")
    .select("id, setup_checklist")
    .eq("user_id", user.id)
    .single();

  if (!business) return { error: "Save your business info first." };

  const { data: existingPhones } = await supabase
    .from("phone_numbers")
    .select("*")
    .eq("business_id", business.id);

  const active = (existingPhones ?? []).find(
    (p) => p.provisioning_status === "active",
  );
  if (active) {
    return { ok: true, phoneNumber: active.phone_number };
  }

  const provisioning = (existingPhones ?? []).find(
    (p) => p.provisioning_status === "provisioning",
  );
  if (provisioning) {
    return { error: "Provisioning already in progress. Please wait." };
  }

  let twilioResult: { phoneNumber: string; twilioSid: string };
  try {
    twilioResult = await provisionTollFreeNumber();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Provisioning failed";
    return { error: msg };
  }

  const { error: insErr } = await supabase.from("phone_numbers").insert({
    business_id: business.id,
    phone_number: twilioResult.phoneNumber,
    twilio_sid: twilioResult.twilioSid,
    type: "leadrescue_inbound",
    phone_type: "toll_free",
    provisioning_status: "active",
    line_verification_status: "not_started",
    verification_status: "pending",
    provisioned_at: new Date().toISOString(),
  });

  if (insErr) {
    return { error: insErr.message };
  }

  const checklist = mergeChecklist(parseSetupChecklist(business.setup_checklist), {
    number_generated: true,
  });
  await supabase
    .from("businesses")
    .update({ setup_checklist: checklist })
    .eq("id", business.id);

  const { data: phoneRow } = await supabase
    .from("phone_numbers")
    .select("id")
    .eq("business_id", business.id)
    .eq("phone_number", twilioResult.phoneNumber)
    .single();

  if (phoneRow?.id) {
    await supabase.from("toll_free_verifications").upsert(
      {
        business_id: business.id,
        phone_number_id: phoneRow.id,
        status: "not_started",
      },
      { onConflict: "business_id" },
    );
  }

  revalidatePath("/dashboard/onboarding");
  revalidatePath("/dashboard/settings");
  return { ok: true, phoneNumber: twilioResult.phoneNumber };
}

const optionalField = z.string().max(4000).optional().or(z.literal(""));

const verificationDraftSchema = z.object({
  legalBusinessName: optionalField,
  publicBusinessName: optionalField,
  businessType: z.union([twilioBusinessTypeEnum, z.literal("")]),
  website: optionalField,
  businessEmail: optionalField,
  businessPhone: optionalField,
  addressLine1: optionalField,
  addressLine2: optionalField,
  city: optionalField,
  state: optionalField,
  postalCode: optionalField,
  country: optionalField,
  registrationNumber: optionalField,
  useCaseDescription: optionalField,
  sampleMessage1: optionalField,
  sampleMessage2: optionalField,
  consentDescription: optionalField,
  optInImageUrls: optInImageUrlsField,
});

const verificationSubmitSchema = z
  .object({
  legalBusinessName: z.string().min(2).max(300),
  publicBusinessName: z.string().min(2).max(300),
  businessType: twilioBusinessTypeSubmit,
  website: z.string().max(500).optional().or(z.literal("")),
  businessEmail: z.string().email(),
  businessPhone: z.string().min(8).max(40),
  addressLine1: z.string().min(2).max(200),
  addressLine2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().min(2).max(120),
  state: z.string().min(2).max(80),
  postalCode: z.string().min(3).max(20),
  country: z.string().max(80).optional().or(z.literal("")),
  registrationNumber: z.string().max(120).optional().or(z.literal("")),
  useCaseDescription: z
    .string()
    .min(1, "Describe how you use this number.")
    .min(50, "“How you use this number” should be at least a short paragraph.")
    .max(4000, "“How you use this number” is too long."),
  sampleMessage1: z
    .string()
    .min(1, "Sample message 1 cannot be empty.")
    .max(500, "Sample message 1 is too long."),
  sampleMessage2: z
    .string()
    .min(1, "Sample message 2 cannot be empty.")
    .max(500, "Sample message 2 is too long."),
  consentDescription: z
    .string()
    .min(1, "Opt-in / consent wording cannot be empty.")
    .min(40, "Opt-in / consent wording is too short. Add how customers agree and how they can opt out.")
    .max(2000, "Opt-in / consent wording is too long.")
    .refine((s) => consentIncludesOptOutLanguage(s), {
      message:
        "Consent wording should explain how customers can opt out (for example, replying STOP).",
    }),
  optInImageUrls: optInImageUrlsField,
})
  .superRefine((data, ctx) => {
    const fromForm = parseOptInHttpsUrls(data.optInImageUrls ?? "");
    if (fromForm.length === 0 && !hasServerOptInImageUrlsEnv()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["optInImageUrls"],
        message:
          "Add at least one HTTPS URL (one per line) showing customer opt-in, or set TWILIO_TFV_OPT_IN_IMAGE_URLS on the server.",
      });
    }
    if (data.businessType !== "SOLE_PROPRIETOR" && !data.registrationNumber?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["registrationNumber"],
        message: "EIN or business registration number is required for this business type.",
      });
    }
  });

function trimVerificationField(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function formToVerificationRaw(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return {
    legalBusinessName: trimVerificationField(raw.legalBusinessName),
    publicBusinessName: trimVerificationField(raw.publicBusinessName),
    businessType: trimVerificationField(raw.businessType),
    website: trimVerificationField(raw.website),
    businessEmail: trimVerificationField(raw.businessEmail),
    businessPhone: trimVerificationField(raw.businessPhone),
    addressLine1: trimVerificationField(raw.addressLine1),
    addressLine2: trimVerificationField(raw.addressLine2),
    city: trimVerificationField(raw.city),
    state: trimVerificationField(raw.state),
    postalCode: trimVerificationField(raw.postalCode),
    country: trimVerificationField(raw.country) || "US",
    registrationNumber: trimVerificationField(raw.registrationNumber),
    useCaseDescription: trimVerificationField(raw.useCaseDescription),
    sampleMessage1: trimVerificationField(raw.sampleMessage1),
    sampleMessage2: trimVerificationField(raw.sampleMessage2),
    consentDescription: trimVerificationField(raw.consentDescription),
    optInImageUrls: trimVerificationField(raw.optInImageUrls),
  };
}

export async function saveVerificationDraft(
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const parsed = verificationDraftSchema.safeParse(formToVerificationRaw(formData));
  if (!parsed.success) {
    return { error: "Invalid field values." };
  }

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
  if (!business) return { error: "No business found." };

  const { data: existing } = await supabase
    .from("toll_free_verifications")
    .select("id, opt_in_image_urls")
    .eq("business_id", business.id)
    .maybeSingle();

  const v = parsed.data;
  const trim = (s: string | undefined) => (s?.trim() ? s.trim() : null);
  const fromFormDraft = parseOptInHttpsUrls(v.optInImageUrls ?? "");
  const opt_in_image_urls =
    fromFormDraft.length > 0
      ? fromFormDraft
      : Array.isArray(existing?.opt_in_image_urls)
        ? (existing.opt_in_image_urls as string[])
        : [];
  const row = {
    business_id: business.id,
    legal_business_name: trim(v.legalBusinessName),
    public_business_name: trim(v.publicBusinessName),
    business_type: trim(v.businessType),
    website: trim(v.website),
    business_email: trim(v.businessEmail),
    business_phone: v.businessPhone?.trim()
      ? normalizePhone(v.businessPhone) ?? v.businessPhone.trim()
      : null,
    business_address_line_1: trim(v.addressLine1),
    business_address_line_2: trim(v.addressLine2),
    business_city: trim(v.city),
    business_state: trim(v.state),
    business_postal_code: trim(v.postalCode),
    business_country: trim(v.country) || "US",
    registration_number: trim(v.registrationNumber),
    use_case_description: trim(v.useCaseDescription),
    sample_message_1: trim(v.sampleMessage1),
    sample_message_2: trim(v.sampleMessage2),
    consent_description: trim(v.consentDescription),
    opt_in_image_urls,
    status: "draft" as const,
  };

  if (existing?.id) {
    await supabase
      .from("toll_free_verifications")
      .update(row)
      .eq("id", existing.id);
  } else {
    await supabase.from("toll_free_verifications").insert(row);
  }

  const { data: phone } = await supabase
    .from("phone_numbers")
    .select("id")
    .eq("business_id", business.id)
    .eq("provisioning_status", "active")
    .maybeSingle();

  if (phone?.id) {
    await supabase
      .from("phone_numbers")
      .update({ line_verification_status: "draft" })
      .eq("id", phone.id);
  }

  revalidatePath("/dashboard/onboarding");
  return { ok: true };
}

export async function submitVerificationForReview(
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const parsed = verificationSubmitSchema.safeParse(formToVerificationRaw(formData));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      error: first?.message ?? "Please complete all required fields before submitting.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: business } = await supabase
    .from("businesses")
    .select("id, setup_checklist, owner_name")
    .eq("user_id", user.id)
    .single();
  if (!business) return { error: "No business found." };

  const { data: phone } = await supabase
    .from("phone_numbers")
    .select("id, twilio_sid")
    .eq("business_id", business.id)
    .eq("provisioning_status", "active")
    .maybeSingle();

  const { data: existingTfv } = await supabase
    .from("toll_free_verifications")
    .select("*")
    .eq("business_id", business.id)
    .maybeSingle();

  const v = parsed.data;
  const fromForm = parseOptInHttpsUrls(v.optInImageUrls ?? "");
  const opt_in_image_urls =
    fromForm.length > 0
      ? fromForm
      : Array.isArray(existingTfv?.opt_in_image_urls)
        ? (existingTfv.opt_in_image_urls as string[])
        : [];

  const statusKeep = (existingTfv?.status ?? "not_started") as TollFreeVerificationStatus;

  const row = {
    business_id: business.id,
    legal_business_name: v.legalBusinessName.trim(),
    public_business_name: v.publicBusinessName.trim(),
    business_type: v.businessType,
    website: v.website?.trim() || null,
    business_email: v.businessEmail.trim(),
    business_phone: normalizePhone(v.businessPhone) ?? v.businessPhone.trim(),
    business_address_line_1: v.addressLine1.trim(),
    business_address_line_2: v.addressLine2?.trim() || null,
    business_city: v.city.trim(),
    business_state: v.state.trim(),
    business_postal_code: v.postalCode.trim(),
    business_country: v.country?.trim() || "US",
    registration_number: v.registrationNumber?.trim() || null,
    use_case_description: v.useCaseDescription.trim(),
    sample_message_1: v.sampleMessage1.trim(),
    sample_message_2: v.sampleMessage2.trim(),
    consent_description: v.consentDescription.trim(),
    opt_in_image_urls,
    phone_number_id: phone?.id ?? existingTfv?.phone_number_id ?? null,
    status: statusKeep,
  };

  let rowId: string;
  if (existingTfv?.id) {
    const { error: upErr } = await supabase
      .from("toll_free_verifications")
      .update(row)
      .eq("id", existingTfv.id);
    if (upErr) return { error: upErr.message ?? "Could not save." };
    rowId = existingTfv.id;
  } else {
    const { data: ins, error } = await supabase
      .from("toll_free_verifications")
      .insert(row)
      .select("id")
      .single();
    if (error || !ins) return { error: error?.message ?? "Could not save." };
    rowId = ins.id;
  }

  const { data: fullRow } = await supabase
    .from("toll_free_verifications")
    .select("*")
    .eq("id", rowId)
    .single();

  if (!fullRow) return { error: "Could not load verification." };

  const provider = await submitToProvider({
    ...fullRow,
    id: fullRow.id,
    business_id: fullRow.business_id,
    twilioPhoneSid: phone?.twilio_sid ?? null,
    ownerName: business.owner_name ?? null,
  });

  if (!provider.ok) {
    revalidatePath("/dashboard/onboarding");
    return { error: provider.error };
  }

  const now = new Date().toISOString();
  const tfvStatus = provider.line_verification_status as TollFreeVerificationStatus;

  await supabase
    .from("toll_free_verifications")
    .update({
      status: tfvStatus,
      submitted_at: now,
      provider_submission_id: provider.provider_submission_id,
      provider_response_payload: provider.provider_response_payload as Record<
        string,
        unknown
      >,
    })
    .eq("id", rowId);

  if (phone?.id) {
    await supabase
      .from("phone_numbers")
      .update({
        line_verification_status: provider.line_verification_status,
        verification_submitted_at: now,
        verification_approved_at:
          provider.line_verification_status === "approved" ? now : null,
      })
      .eq("id", phone.id);
  }

  const checklist = mergeChecklist(parseSetupChecklist(business.setup_checklist), {
    verification_submitted: true,
  });
  await supabase
    .from("businesses")
    .update({ setup_checklist: checklist })
    .eq("id", business.id);

  revalidatePath("/dashboard/onboarding");
  return { ok: true };
}

const kbSchema = z.object({
  servicesOffered: z.string().max(8000).optional().or(z.literal("")),
  serviceAreas: z.string().max(8000).optional().or(z.literal("")),
  businessHours: z.string().max(2000).optional().or(z.literal("")),
  emergencyService: z.enum(["on", "off"]).optional(),
  excludedJobs: z.string().max(8000).optional().or(z.literal("")),
  toneGuidance: z.string().max(2000).optional().or(z.literal("")),
  aiNotes: z.string().max(8000).optional().or(z.literal("")),
});

export async function saveKnowledgeBase(
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const parsed = kbSchema.safeParse({
    servicesOffered: formData.get("servicesOffered"),
    serviceAreas: formData.get("serviceAreas"),
    businessHours: formData.get("businessHours"),
    emergencyService: formData.get("emergencyService"),
    excludedJobs: formData.get("excludedJobs"),
    toneGuidance: formData.get("toneGuidance"),
    aiNotes: formData.get("aiNotes"),
  });

  if (!parsed.success) {
    return { error: "Invalid knowledge base fields." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: business } = await supabase
    .from("businesses")
    .select("id, setup_checklist")
    .eq("user_id", user.id)
    .single();
  if (!business) return { error: "No business found." };

  const v = parsed.data;
  const payload = {
    business_id: business.id,
    services_offered: v.servicesOffered?.trim() || null,
    service_areas: v.serviceAreas?.trim() || null,
    business_hours: v.businessHours?.trim() || null,
    emergency_service_available: v.emergencyService === "on",
    excluded_jobs: v.excludedJobs?.trim() || null,
    tone_guidance: v.toneGuidance?.trim() || null,
    ai_notes: v.aiNotes?.trim() || null,
  };

  const { data: existing } = await supabase
    .from("business_knowledge_base")
    .select("id")
    .eq("business_id", business.id)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("business_knowledge_base")
      .update(payload)
      .eq("id", existing.id);
  } else {
    await supabase.from("business_knowledge_base").insert(payload);
  }

  const hasContent = Boolean(
    payload.services_offered ||
      payload.service_areas ||
      payload.business_hours ||
      payload.excluded_jobs ||
      payload.tone_guidance ||
      payload.ai_notes ||
      payload.emergency_service_available,
  );

  const checklist = mergeChecklist(parseSetupChecklist(business.setup_checklist), {
    knowledge_base: hasContent,
  });
  await supabase
    .from("businesses")
    .update({ setup_checklist: checklist })
    .eq("id", business.id);

  revalidatePath("/dashboard/onboarding");
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

/** Marks the knowledge-base onboarding step complete without saving fields (owner can fill in Settings later). */
export async function skipKnowledgeBaseOnboarding(): Promise<{
  error?: string;
  ok?: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: business } = await supabase
    .from("businesses")
    .select("id, setup_checklist")
    .eq("user_id", user.id)
    .single();
  if (!business) return { error: "No business found." };

  const checklist = mergeChecklist(parseSetupChecklist(business.setup_checklist), {
    knowledge_base: true,
  });
  await supabase
    .from("businesses")
    .update({ setup_checklist: checklist })
    .eq("id", business.id);

  revalidatePath("/dashboard/onboarding");
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function acknowledgeForwarding(): Promise<{ error?: string; ok?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: business } = await supabase
    .from("businesses")
    .select("id, setup_checklist")
    .eq("user_id", user.id)
    .single();
  if (!business) return { error: "No business found." };

  const checklist = mergeChecklist(parseSetupChecklist(business.setup_checklist), {
    forwarding_acknowledged: true,
  });
  await supabase
    .from("businesses")
    .update({ setup_checklist: checklist })
    .eq("id", business.id);

  revalidatePath("/dashboard/onboarding");
  return { ok: true };
}

export async function markTestSetupComplete(): Promise<{ error?: string; ok?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: business } = await supabase
    .from("businesses")
    .select("id, setup_checklist")
    .eq("user_id", user.id)
    .single();
  if (!business) return { error: "No business found." };

  const checklist = mergeChecklist(parseSetupChecklist(business.setup_checklist), {
    test_completed: true,
  });
  await supabase
    .from("businesses")
    .update({ setup_checklist: checklist })
    .eq("id", business.id);

  revalidatePath("/dashboard/onboarding");
  return { ok: true };
}

export async function finishOnboardingAndGoToDashboard(): Promise<never> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("businesses")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
  redirect("/dashboard/leads");
}

export type StepFormState = { error?: string; ok?: boolean; phoneNumber?: string };

export async function saveBusinessBasicsAction(
  _prev: StepFormState,
  formData: FormData,
): Promise<StepFormState> {
  return saveBusinessBasics(formData);
}

export async function provisionNumberAction(
  _prev: StepFormState,
  _formData: FormData,
): Promise<StepFormState> {
  return provisionLeadRescueNumber();
}

export async function saveKnowledgeBaseAction(
  _prev: StepFormState,
  formData: FormData,
): Promise<StepFormState> {
  return saveKnowledgeBase(formData);
}

export async function saveVerificationDraftAction(
  _prev: StepFormState,
  formData: FormData,
): Promise<StepFormState> {
  return saveVerificationDraft(formData);
}

export async function submitVerificationAction(
  _prev: StepFormState,
  formData: FormData,
): Promise<StepFormState> {
  return submitVerificationForReview(formData);
}

export async function acknowledgeForwardingAction(
  _prev: StepFormState,
  _formData: FormData,
): Promise<StepFormState> {
  return acknowledgeForwarding();
}

export async function markTestSetupAction(
  _prev: StepFormState,
  _formData: FormData,
): Promise<StepFormState> {
  return markTestSetupComplete();
}

export async function skipKnowledgeBaseAction(
  _prev: StepFormState,
  _formData: FormData,
): Promise<StepFormState> {
  return skipKnowledgeBaseOnboarding();
}
