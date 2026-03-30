import { Resend } from "resend";
import type { Business, Lead } from "@/lib/types";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(key);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendLeadSummaryEmail(params: {
  business: Business;
  lead: Lead;
}): Promise<{ id?: string; error?: string }> {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    return { error: "RESEND_FROM_EMAIL is not set" };
  }

  const { business, lead } = params;
  const addressParts = [
    lead.service_address,
    [lead.service_city, lead.service_state].filter(Boolean).join(", "),
    lead.service_postal_code,
  ].filter((p) => p && String(p).trim() !== "");
  const jobLocation = addressParts.length > 0 ? addressParts.join(" · ") : "-";

  const rows: { label: string; value: string }[] = [
    { label: "Customer", value: lead.caller_name ?? "-" },
    { label: "Phone", value: lead.caller_phone },
    { label: "Service type", value: lead.service_category ?? "-" },
    { label: "Job address", value: jobLocation },
    { label: "Issue", value: lead.issue_description ?? "-" },
    { label: "Timing", value: lead.appointment_timing ?? "-" },
    { label: "Urgency", value: lead.urgency ?? "-" },
    { label: "Callback notes", value: lead.callback_notes ?? "-" },
  ];

  const tableRows = rows
    .map(
      (r) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px;">${escapeHtml(r.label)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(r.value)}</td></tr>`,
    )
    .join("");

  const summaryBlock = lead.summary
    ? `<p style="margin:16px 0 0;font-size:15px;line-height:1.5;color:#333;"><strong>Summary</strong><br/>${escapeHtml(lead.summary)}</p>`
    : "";

  const html = `
<!DOCTYPE html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;background:#f6f6f6;padding:24px;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="background:#fff;border-radius:12px;padding:24px 28px;box-shadow:0 8px 30px rgba(0,0,0,.06);">
      <tr><td>
        <p style="margin:0 0 8px;font-size:13px;color:#666;">LeadRescue</p>
        <h1 style="margin:0 0 16px;font-size:22px;">New home service lead</h1>
        <p style="margin:0 0 20px;color:#444;font-size:15px;">A homeowner reached out after a missed call. Lead captured for <strong>${escapeHtml(business.business_name)}</strong>.</p>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;font-size:14px;">${tableRows}</table>
        ${summaryBlock}
        <p style="margin:24px 0 0;font-size:13px;color:#888;">Reply in LeadRescue or call the customer directly to book.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;

  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from,
    to: business.owner_email,
    subject: "New home service lead from LeadRescue",
    html,
  });

  if (error) {
    return { error: error.message };
  }
  return { id: data?.id };
}
