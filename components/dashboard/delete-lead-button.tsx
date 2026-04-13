"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteLead } from "@/app/dashboard/leads/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DeleteLeadButtonProps = {
  leadId: string;
  /** When false (e.g. on the leads list), only refreshes after delete. Default: navigate to /dashboard/leads then refresh. */
  navigateToListAfterDelete?: boolean;
  /** Icon-only control for dense lists; default is the labeled destructive button. */
  appearance?: "default" | "icon";
  className?: string;
};

export function DeleteLeadButton({
  leadId,
  navigateToListAfterDelete = true,
  appearance = "default",
  className,
}: DeleteLeadButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const runDelete = () => {
    if (!confirm("Delete this lead? This will remove the SMS transcript too.")) return;
    startTransition(async () => {
      const res = await deleteLead(leadId);
      if (res?.error) {
        alert(res.error);
        return;
      }
      if (navigateToListAfterDelete) {
        router.push("/dashboard/leads");
      }
      router.refresh();
    });
  };

  if (appearance === "icon") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        aria-label={pending ? "Deleting lead" : "Delete lead"}
        title="Delete lead"
        className={cn(
          "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
          className,
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          runDelete();
        }}
      >
        <Trash2 className="size-4" aria-hidden />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={pending}
      className={className}
      onClick={runDelete}
    >
      {pending ? "Deleting…" : "Delete lead"}
    </Button>
  );
}

