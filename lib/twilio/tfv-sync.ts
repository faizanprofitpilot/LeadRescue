import type { SupabaseClient } from "@supabase/supabase-js";
import { getTwilioClient } from "@/lib/twilio/client";
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
export async function syncTollFreeVerificationFromTwilio(
  supabase: SupabaseClient,
  businessId: string,
): Promise<void> {
  const { data: tfv } = await supabase
    .from("toll_free_verifications")
    .select("id, provider_submission_id, status, tfv_last_polled_at")
    .eq("business_id", businessId)
    .maybeSingle();

  if (!tfv?.id) return;
  const sid = tfv.provider_submission_id?.trim();
  if (!sid || !sid.startsWith("HH")) return;

  const status = tfv.status as string | undefined;
  if (status === "approved" || status === "rejected") {
    return;
  }

  const minMs = tfvSyncMinIntervalMs();
  if (shouldSkipPoll(tfv.tfv_last_polled_at as string | null | undefined, minMs)) {
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
    tfv_last_polled_at: now,
  };
  if (lineStatus === "approved" || lineStatus === "rejected" || lineStatus === "needs_changes") {
    tfvPatch.reviewed_at = now;
  }

  await supabase.from("toll_free_verifications").update(tfvPatch).eq("id", tfv.id);

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
