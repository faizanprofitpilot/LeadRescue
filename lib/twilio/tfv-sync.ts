import type { SupabaseClient } from "@supabase/supabase-js";
import { getTwilioClient } from "@/lib/twilio/client";
import { sendTextingVerificationStatusEmail } from "@/lib/email/send-texting-verification-status";
import type { Business, TollFreeVerificationStatus } from "@/lib/types";
import {
  lineVerificationStatusFromTwilio,
  tollFreeVerificationStatusFromTwilio,
} from "@/lib/twilio/tfv-status";

function tfvSyncMinIntervalMs(): number {
  const raw = process.env.TWILIO_TFV_SYNC_MIN_INTERVAL_SEC?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 120;
  const sec = Number.isFinite(n) ? Math.max(30, n) : 120;
  return sec * 1000;
}

function shouldSkipPoll(lastPolledAt: string | null | undefined, minMs: number): boolean {
  if (!lastPolledAt) return false;
  const t = new Date(lastPolledAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < minMs;
}

/**
 * Pull latest toll-free verification status from Twilio and mirror it to Supabase.
 * No-ops when there is no HH… submission id. Skips Twilio when status is terminal
 * (approved / rejected) or when polled recently (see TWILIO_TFV_SYNC_MIN_INTERVAL_SEC).
 */
function isMissingColumnError(err: { message?: string } | null): boolean {
  const m = err?.message ?? "";
  return m.includes("schema cache") || m.includes("Could not find");
}

export async function syncTollFreeVerificationFromTwilio(
  supabase: SupabaseClient,
  businessId: string,
): Promise<void> {
  let tfvLastPolledKey = true;
  let res = await supabase
    .from("toll_free_verifications")
    .select(
      "id, provider_submission_id, status, tfv_last_polled_at, status_email_last_sent_status",
    )
    .eq("business_id", businessId)
    .maybeSingle();

  if (res.error && isMissingColumnError(res.error) && res.error.message?.includes("tfv_last_polled_at")) {
    tfvLastPolledKey = false;
    res = await supabase
      .from("toll_free_verifications")
      .select("id, provider_submission_id, status")
      .eq("business_id", businessId)
      .maybeSingle();
  } else if (res.error) {
    return;
  }

  const tfv = res.data;

  if (!tfv?.id) return;

  // Primary path: we have the Twilio TFV SID (HH…).
  let sid = tfv.provider_submission_id?.trim() ?? "";

  // Fallback path: verification may have been submitted/approved in the Twilio Console,
  // so we don't have HH… stored yet. In that case, look up the latest TFV record by the
  // active toll-free phone number SID (PN…).
  if (!sid.startsWith("HH")) {
    const { data: phone } = await supabase
      .from("phone_numbers")
      .select("id, twilio_sid")
      .eq("business_id", businessId)
      .eq("provisioning_status", "active")
      .maybeSingle();

    const pnSid = (phone as { twilio_sid?: string | null } | null)?.twilio_sid ?? null;
    if (pnSid?.startsWith("PN")) {
      try {
        const client = getTwilioClient();
        const list = await client.messaging.v1.tollfreeVerifications.list({
          tollfreePhoneNumberSid: pnSid,
          limit: 20,
        });
        const latest = [...list].sort((a, b) => {
          const ta = a.dateCreated ? new Date(a.dateCreated).getTime() : 0;
          const tb = b.dateCreated ? new Date(b.dateCreated).getTime() : 0;
          return tb - ta;
        })[0];
        if (latest?.sid?.startsWith("HH")) {
          sid = latest.sid;
          // Persist the discovered submission id so future syncs are cheap.
          await supabase
            .from("toll_free_verifications")
            .update({ provider_submission_id: sid })
            .eq("id", tfv.id);
        }
      } catch {
        // ignore, keep existing behavior
      }
    }
  }

  if (!sid.startsWith("HH")) return;

  const status = tfv.status as string | undefined;
  if (status === "approved" || status === "rejected") {
    return;
  }

  const minMs = tfvSyncMinIntervalMs();
  const lastPolled = tfvLastPolledKey
    ? (tfv as { tfv_last_polled_at?: string | null }).tfv_last_polled_at
    : undefined;
  if (shouldSkipPoll(lastPolled, minMs)) {
    return;
  }

  let twilioStatus: string | undefined;
  let editAllowed: boolean | null = null;
  let payload: Record<string, unknown>;

  try {
    const client = getTwilioClient();
    const resource = await client.messaging.v1.tollfreeVerifications(sid).fetch();
    twilioStatus = resource.status;
    editAllowed = resource.editAllowed ?? null;
    payload = resource.toJSON() as unknown as Record<string, unknown>;
  } catch {
    return;
  }

  const lineStatus = lineVerificationStatusFromTwilio(twilioStatus, editAllowed);
  const tfvStatus = tollFreeVerificationStatusFromTwilio(twilioStatus, editAllowed);
  const now = new Date().toISOString();
  const approvedAt = lineStatus === "approved" ? now : null;

  const tfvPatch: Record<string, unknown> = {
    status: tfvStatus,
    provider_response_payload: payload,
  };
  if (tfvLastPolledKey) {
    tfvPatch.tfv_last_polled_at = now;
  }
  if (lineStatus === "approved" || lineStatus === "rejected" || lineStatus === "needs_changes") {
    tfvPatch.reviewed_at = now;
  }

  await supabase.from("toll_free_verifications").update(tfvPatch).eq("id", tfv.id);

  const terminal = tfvStatus === "approved" || tfvStatus === "needs_changes" || tfvStatus === "rejected";
  const lastEmailed = (tfv as { status_email_last_sent_status?: string | null })
    .status_email_last_sent_status;
  const shouldEmail = terminal && lastEmailed !== tfvStatus;
  if (shouldEmail) {
    const { data: biz } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .single();
    if (biz) {
      const sent = await sendTextingVerificationStatusEmail({
        business: biz as unknown as Business,
        status: tfvStatus as TollFreeVerificationStatus,
      });
      if (!sent.error) {
        await supabase
          .from("toll_free_verifications")
          .update({
            status_email_last_sent_status: tfvStatus,
            status_email_sent_at: now,
          })
          .eq("id", tfv.id);
      }
    }
  }

  const { data: phone } = await supabase
    .from("phone_numbers")
    .select("id")
    .eq("business_id", businessId)
    .eq("provisioning_status", "active")
    .maybeSingle();

  if (phone?.id) {
    const patch: Record<string, unknown> = {
      line_verification_status: lineStatus,
    };
    if (lineStatus === "approved") {
      patch.verification_approved_at = approvedAt;
    }
    await supabase.from("phone_numbers").update(patch).eq("id", phone.id);
  }
}
