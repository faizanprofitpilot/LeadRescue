import { Resend } from "resend";
import { LEADRESCUE_PUBLIC_ORIGIN } from "@/lib/leadrescue-public";
import type { Business, TollFreeVerificationStatus } from "@/lib/types";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendTextingVerificationStatusEmail(params: {
  business: Business;
  status: TollFreeVerificationStatus;
}): Promise<{ id?: string; error?: string }> {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) return { error: "RESEND_FROM_EMAIL is not set" };

  const { business, status } = params;
  const dashboardUrl = `${LEADRESCUE_PUBLIC_ORIGIN}/dashboard/onboarding`;

  const approved = status === "approved";
  const needsUpdates = status === "needs_changes" || status === "rejected";
  const headline = approved ? "Texting line approved" : "Texting line needs an update";
  const eyebrow = approved ? "You’re good to go" : "Action needed";
  const accent = approved ? "#059669" : "#B45309"; // emerald / amber

  const body =
    approved
      ? "Your texting line registration was approved. You can start using your LeadRescue number for follow-ups."
      : "Your texting line registration needs an update. Open Setup to review your details and resubmit.";

  const subject = approved
    ? "Your texting line is approved"
    : "Update needed for your texting line";

  const html = `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:24px;background:#0b0b0c;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="background:#111113;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.08);box-shadow:0 14px 60px rgba(0,0,0,.45);">
            <tr>
              <td style="padding:22px 24px;border-bottom:1px solid rgba(255,255,255,.08);">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
                  <div style="font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;color:rgba(255,255,255,.75);font-size:12px;letter-spacing:.12em;text-transform:uppercase;">
                    LeadRescue
                  </div>
                  <div style="font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;font-size:12px;color:rgba(255,255,255,.65);">
                    ${escapeHtml(eyebrow)}
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:26px 24px 10px;">
                <div style="height:10px;width:10px;border-radius:999px;background:${accent};display:inline-block;vertical-align:middle;margin-right:10px;"></div>
                <h1 style="margin:0;display:inline-block;vertical-align:middle;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;font-size:22px;line-height:1.2;color:#fff;">
                  ${escapeHtml(headline)}
                </h1>
                <p style="margin:14px 0 0;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.6;color:rgba(255,255,255,.80);">
                  ${escapeHtml(body)}
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:14px 24px 26px;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;">
                  <tr>
                    <td style="padding:14px 16px;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;color:rgba(255,255,255,.85);font-size:14px;">
                      <div style="color:rgba(255,255,255,.65);font-size:12px;margin-bottom:4px;">Business</div>
                      <div style="font-weight:700;">${escapeHtml(business.business_name)}</div>
                    </td>
                    <td style="padding:14px 16px;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;color:rgba(255,255,255,.85);font-size:14px;text-align:right;">
                      <div style="color:rgba(255,255,255,.65);font-size:12px;margin-bottom:4px;">Status</div>
                      <div style="font-weight:700;">${escapeHtml(
                        approved ? "Approved" : needsUpdates ? "Needs updates" : String(status),
                      )}</div>
                    </td>
                  </tr>
                </table>

                <div style="margin-top:16px;">
                  <a href="${dashboardUrl}"
                    style="display:inline-block;background:${accent};color:#111113;text-decoration:none;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;font-weight:800;font-size:14px;padding:11px 14px;border-radius:12px;">
                    Open Setup
                  </a>
                </div>

                <p style="margin:18px 0 0;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;font-size:12px;line-height:1.5;color:rgba(255,255,255,.55);">
                  If you didn’t request this, you can ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from,
    to: business.owner_email,
    subject,
    html,
  });

  if (error) return { error: error.message };
  return { id: data?.id };
}

