import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/dashboard/guards";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LeadStatusForm } from "@/components/dashboard/lead-status-form";
import { DeleteLeadButton } from "@/components/dashboard/delete-lead-button";
import type { Conversation, Lead, MessageRow } from "@/lib/types";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const business = await requireBusiness();
  const { id } = await params;

  const supabase = await createClient();

  const { data: leadRow } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const lead = leadRow as Lead | null;
  if (!lead || lead.business_id !== business.id) {
    notFound();
  }

  const { data: convRow } = await supabase
    .from("conversations")
    .select("*")
    .eq("lead_id", lead.id)
    .maybeSingle();

  const conversation = convRow as Conversation | null;

  let messages: MessageRow[] = [];
  if (conversation) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });
    messages = (msgs ?? []) as MessageRow[];
  }

  const addressLine = [
    lead.service_address,
    [lead.service_city, lead.service_state].filter(Boolean).join(", "),
    lead.service_postal_code,
  ]
    .filter((p) => p && String(p).trim() !== "")
    .join(" · ");

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/dashboard/leads"
            className="text-muted-foreground text-sm hover:text-foreground hover:underline"
          >
            ← All leads
          </Link>
          <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
            {lead.caller_name?.trim() || "Unknown caller"}
          </h1>
          <p className="mt-1 font-mono text-muted-foreground text-sm">{lead.caller_phone}</p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <LeadStatusForm leadId={lead.id} current={lead.status} />
          <DeleteLeadButton leadId={lead.id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Captured details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Service type</span>
              <span className="text-right font-medium">
                {lead.service_category ?? "-"}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Job address</span>
              <span className="max-w-[60%] text-right font-medium">
                {addressLine || "-"}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Issue</span>
              <span className="max-w-[60%] text-right font-medium">
                {lead.issue_description ?? "-"}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Timing</span>
              <span className="text-right font-medium">
                {lead.appointment_timing ?? "-"}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Callback notes</span>
              <span className="max-w-[60%] text-right font-medium">
                {lead.callback_notes ?? "-"}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">AI state</span>
              <Badge variant="secondary">{conversation?.ai_state ?? "-"}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {lead.summary?.trim() || "Summary will appear as the AI fills in the conversation."}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg">SMS transcript</CardTitle>
          <p className="text-muted-foreground text-sm">
            Inbound and outbound messages for this lead.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {messages.length === 0 ? (
            <p className="text-muted-foreground text-sm">No messages yet.</p>
          ) : (
            <ul className="space-y-3">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    m.direction === "inbound"
                      ? "border-primary/20 bg-primary/5"
                      : "bg-muted/40"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      {m.direction}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(m.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
