import Link from "next/link";
import { requireBusiness } from "@/lib/dashboard/guards";
import { createClient } from "@/lib/supabase/server";
import { SetupChecklistBanner } from "@/components/dashboard/setup-checklist-banner";
import { DeleteLeadButton } from "@/components/dashboard/delete-lead-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/lib/types";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusVariant(s: LeadStatus) {
  if (s === "new") return "default" as const;
  if (s === "contacted") return "secondary" as const;
  return "outline" as const;
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const business = await requireBusiness();
  const { status: statusFilter } = await searchParams;

  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (
    statusFilter === "new" ||
    statusFilter === "contacted" ||
    statusFilter === "closed"
  ) {
    query = query.eq("status", statusFilter);
  }

  const { data: leads } = await query;

  const rows = (leads ?? []) as Lead[];

  const filters: { label: string; value: string }[] = [
    { label: "All", value: "" },
    { label: "New", value: "new" },
    { label: "Contacted", value: "contacted" },
    { label: "Closed", value: "closed" },
  ];

  const showSetupBanner =
    Boolean(business.onboarding_completed_at) &&
    !Object.values(business.setup_checklist).every(Boolean);

  return (
    <div className="space-y-6">
      {showSetupBanner && <SetupChecklistBanner checklist={business.setup_checklist} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Leads</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Home service leads captured after missed calls: SMS follow-up and structured job
            details.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <Link
              key={f.label}
              href={f.value ? `/dashboard/leads?status=${f.value}` : "/dashboard/leads"}
              className={cn(
                buttonVariants({
                  variant:
                    statusFilter === f.value || (!statusFilter && !f.value)
                      ? "default"
                      : "outline",
                  size: "sm",
                }),
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card/50 p-12 text-center shadow-sm">
          <p className="font-medium">No leads yet</p>
          <p className="mt-2 text-muted-foreground text-sm">
            Forward a missed call to your LeadRescue number to see your first recovery here.
          </p>
          <Link
            href="/dashboard/onboarding"
            className={cn(buttonVariants({ variant: "secondary", size: "default" }), "mt-6 inline-flex")}
          >
            View setup &amp; number
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Created</TableHead>
                <TableHead className="w-12 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/leads/${lead.id}`}
                      className="hover:underline"
                    >
                      {lead.caller_name?.trim() || "Unknown"}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{lead.caller_phone}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground text-sm">
                    {lead.issue_description ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(lead.status)}>{lead.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">
                    {formatWhen(lead.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DeleteLeadButton
                      leadId={lead.id}
                      appearance="icon"
                      navigateToListAfterDelete={false}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
