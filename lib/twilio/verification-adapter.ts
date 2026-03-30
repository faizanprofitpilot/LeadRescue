import type { LineVerificationStatus, TollFreeVerificationRow } from "@/lib/types";
import type {
  TollfreeVerificationContextUpdateOptions,
  TollfreeVerificationListInstanceCreateOptions,
} from "twilio/lib/rest/messaging/v1/tollfreeVerification";
import {
  DEFAULT_TFV_OPT_IN_PROOF_URL,
  LEADRESCUE_PUBLIC_ORIGIN,
} from "@/lib/leadrescue-public";
import { getTwilioClient } from "@/lib/twilio/client";
import {
  lineVerificationStatusFromTwilio,
  tfvMessageVolumeFromEnv,
  tfvOptInTypeFromEnv,
  tfvUseCaseCategoriesFromEnv,
} from "@/lib/twilio/tfv-status";

export type VerificationSubmitPayload = Pick<
  TollFreeVerificationRow,
  | "legal_business_name"
  | "public_business_name"
  | "business_type"
  | "website"
  | "business_email"
  | "business_phone"
  | "business_address_line_1"
  | "business_address_line_2"
  | "business_city"
  | "business_state"
  | "business_postal_code"
  | "business_country"
  | "registration_number"
  | "use_case_description"
  | "sample_message_1"
  | "sample_message_2"
  | "consent_description"
  | "opt_in_image_urls"
  | "provider_submission_id"
>;

export type TfvSubmitContext = VerificationSubmitPayload & {
  id: string;
  business_id: string;
  twilioPhoneSid: string | null;
  ownerName: string | null;
};

export type SubmitToProviderResult =
  | {
      ok: true;
      provider_submission_id: string;
      provider_response_payload: Record<string, unknown>;
      twilio_status: string | undefined;
      line_verification_status: LineVerificationStatus;
    }
  | { ok: false; error: string; provider_response_payload?: Record<string, unknown> };

function successResult(
  sid: string,
  payload: Record<string, unknown>,
  twilioStatus: string | undefined,
  editAllowed?: boolean | null,
): SubmitToProviderResult {
  return {
    ok: true,
    provider_submission_id: sid,
    provider_response_payload: payload,
    twilio_status: twilioStatus,
    line_verification_status: lineVerificationStatusFromTwilio(twilioStatus, editAllowed),
  };
}

function splitOwnerName(name: string | null | undefined): { first: string; last: string } {
  const n = name?.trim();
  if (!n) return { first: "Business", last: "Contact" };
  const parts = n.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "." };
  return { first: parts[0]!, last: parts.slice(1).join(" ") };
}

function ensureHttpUrl(url: string | null | undefined, fallback: string | undefined): string {
  const u = url?.trim();
  if (u) {
    if (/^https?:\/\//i.test(u)) return u;
    return `https://${u}`;
  }
  const f = fallback?.trim();
  if (f) {
    if (/^https?:\/\//i.test(f)) return f;
    return `https://${f}`;
  }
  return "";
}

type TfvFieldRow = Pick<
  TollFreeVerificationRow,
  | "opt_in_image_urls"
  | "sample_message_1"
  | "sample_message_2"
  | "consent_description"
  | "use_case_description"
>;

/**
 * Always returns at least one HTTPS URL for the Twilio TFV payload (never user-facing).
 * Order: DB → TWILIO_TFV_OPT_IN_IMAGE_URLS → product default page.
 */
function resolveOptInImageUrls(row: TfvFieldRow): string[] {
  const raw = row.opt_in_image_urls;
  const fromDb = Array.isArray(raw)
    ? raw.filter((u): u is string => typeof u === "string" && /^https:\/\//i.test(u.trim())).map((u) => u.trim())
    : [];
  if (fromDb.length > 0) return fromDb;
  const envUrls = (process.env.TWILIO_TFV_OPT_IN_IMAGE_URLS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => /^https:\/\//i.test(s));
  if (envUrls.length > 0) return envUrls;
  return [DEFAULT_TFV_OPT_IN_PROOF_URL];
}

function productionSample(row: TfvFieldRow): string {
  const a = row.sample_message_1?.trim() ?? "";
  const b = row.sample_message_2?.trim() ?? "";
  const combined = [a, b].filter(Boolean).join("\n\n");
  return combined.slice(0, 1200) || a || b || "Thank you for contacting us.";
}

function additionalInformation(row: TfvFieldRow): string {
  const parts = [
    row.consent_description?.trim(),
    row.use_case_description?.trim()?.slice(0, 2000),
  ].filter(Boolean);
  return parts.join("\n\n---\n\n").slice(0, 4000);
}

function twilioErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: string }).message);
  }
  return err instanceof Error ? err.message : "Twilio request failed.";
}

function baseCreateParams(ctx: TfvSubmitContext) {
  const row = ctx;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    LEADRESCUE_PUBLIC_ORIGIN.replace(/\/$/, "");
  const businessWebsite = ensureHttpUrl(row.website, appUrl);
  if (!businessWebsite) {
    throw new Error("Business website or public app URL is required for toll-free verification.");
  }

  const optInImageUrls = resolveOptInImageUrls(row);

  const { first, last } = splitOwnerName(ctx.ownerName);
  const businessType = row.business_type?.trim();
  if (!businessType) {
    throw new Error("Business type is required.");
  }

  const params: Record<string, unknown> = {
    businessName: row.legal_business_name?.trim() ?? "",
    businessWebsite,
    notificationEmail: row.business_email?.trim() ?? "",
    useCaseCategories: tfvUseCaseCategoriesFromEnv(),
    useCaseSummary: row.use_case_description?.trim() ?? "",
    productionMessageSample: productionSample(row),
    optInImageUrls,
    optInType: tfvOptInTypeFromEnv(),
    messageVolume: tfvMessageVolumeFromEnv(),
    tollfreePhoneNumberSid: ctx.twilioPhoneSid,
    additionalInformation: additionalInformation(row),
    businessContactFirstName: first,
    businessContactLastName: last,
    businessContactEmail: row.business_email?.trim() ?? "",
    businessContactPhone: row.business_phone?.trim() ?? "",
    businessType,
    doingBusinessAs: row.public_business_name?.trim() ?? undefined,
    externalReferenceId: ctx.business_id,
    helpMessageSample: "Reply STOP to opt out. Reply HELP for help.",
    ageGatedContent: false,
  };

  if (businessType !== "SOLE_PROPRIETOR") {
    const reg = row.registration_number?.trim();
    if (reg) {
      params.businessRegistrationNumber = reg;
      params.businessRegistrationAuthority =
        process.env.TWILIO_TFV_REGISTRATION_AUTHORITY?.trim() || "EIN";
      params.businessRegistrationCountry = row.business_country?.trim() || "US";
    }
    params.businessRegistrationPhoneNumber = row.business_phone?.trim() || undefined;
  }

  const customerProfileSid = process.env.TWILIO_CUSTOMER_PROFILE_SID?.trim();
  if (customerProfileSid) {
    params.customerProfileSid = customerProfileSid;
  } else {
    params.businessStreetAddress = row.business_address_line_1?.trim() ?? "";
    if (row.business_address_line_2?.trim()) {
      params.businessStreetAddress2 = row.business_address_line_2.trim();
    }
    params.businessCity = row.business_city?.trim() ?? "";
    params.businessStateProvinceRegion = row.business_state?.trim() ?? "";
    params.businessPostalCode = row.business_postal_code?.trim() ?? "";
    params.businessCountry = row.business_country?.trim() || "US";
  }

  return params;
}

/**
 * Create or update Twilio Messaging toll-free verification; mirrors Twilio TFV API.
 */
export async function submitToProvider(ctx: TfvSubmitContext): Promise<SubmitToProviderResult> {
  if (!ctx.twilioPhoneSid?.startsWith("PN")) {
    return { ok: false, error: "No active Twilio phone number (PN…) found for this business." };
  }

  let createParams: Record<string, unknown>;
  try {
    createParams = baseCreateParams(ctx);
  } catch (e) {
    return { ok: false, error: twilioErrorMessage(e) };
  }

  const client = getTwilioClient();
  const existingSid = ctx.provider_submission_id?.trim();

  try {
    if (existingSid?.startsWith("HH")) {
      const existing = await client.messaging.v1.tollfreeVerifications(existingSid).fetch();
      if (existing.status === "TWILIO_APPROVED") {
        return successResult(
          existingSid,
          existing.toJSON() as unknown as Record<string, unknown>,
          existing.status,
          existing.editAllowed,
        );
      }
      if (existing.status === "PENDING_REVIEW" || existing.status === "IN_REVIEW") {
        return successResult(
          existingSid,
          existing.toJSON() as unknown as Record<string, unknown>,
          existing.status,
          existing.editAllowed,
        );
      }
      if (existing.status === "TWILIO_REJECTED" && existing.editAllowed) {
        const updatePayload = { ...createParams };
        delete updatePayload.tollfreePhoneNumberSid;
        const u = await client.messaging.v1
          .tollfreeVerifications(existingSid)
          // Twilio allows partial updates; extra keys are ignored by the API.
          .update(updatePayload as TollfreeVerificationContextUpdateOptions);
        return successResult(
          u.sid,
          u.toJSON() as unknown as Record<string, unknown>,
          u.status,
          u.editAllowed,
        );
      }
      if (existing.status === "TWILIO_REJECTED" && !existing.editAllowed) {
        return {
          ok: false,
          error:
            "This verification was rejected and cannot be edited in Twilio. Open the Twilio Console or contact Twilio support.",
        };
      }
      return successResult(
        existingSid,
        existing.toJSON() as unknown as Record<string, unknown>,
        existing.status,
        existing.editAllowed,
      );
    }

    const created = await client.messaging.v1.tollfreeVerifications.create(
      createParams as unknown as TollfreeVerificationListInstanceCreateOptions,
    );
    return successResult(
      created.sid,
      created.toJSON() as unknown as Record<string, unknown>,
      created.status,
      created.editAllowed,
    );
  } catch (err: unknown) {
    return {
      ok: false,
      error: twilioErrorMessage(err),
      provider_response_payload: { error: String(err) },
    };
  }
}

