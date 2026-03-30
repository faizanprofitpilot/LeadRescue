import Link from "next/link";
import type { SetupChecklist } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

const ITEMS: { key: keyof SetupChecklist; label: string }[] = [
  { key: "business_info", label: "Business info" },
  { key: "number_generated", label: "LeadRescue number" },
  { key: "verification_submitted", label: "Texting line verification" },
  { key: "knowledge_base", label: "Knowledge base" },
  { key: "forwarding_acknowledged", label: "Forwarding" },
  { key: "test_completed", label: "Test lead" },
];

type Props = { checklist: SetupChecklist };

export function SetupChecklistBanner({ checklist }: Props) {
  const done = ITEMS.filter((i) => checklist[i.key]).length;
  if (done === ITEMS.length) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-sm">Finish setup ({done}/{ITEMS.length})</p>
        <p className="text-muted-foreground text-xs">
          Complete the checklist in Setup so missed-call recovery is fully productized.
        </p>
      </div>
      <Link
        href="/dashboard/onboarding"
        className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "shrink-0")}
      >
        Open Setup
      </Link>
    </div>
  );
}
