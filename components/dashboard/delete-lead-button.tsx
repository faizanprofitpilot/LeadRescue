"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteLead } from "@/app/dashboard/leads/actions";
import { Button } from "@/components/ui/button";

export function DeleteLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this lead? This will remove the SMS transcript too.")) return;
        startTransition(async () => {
          const res = await deleteLead(leadId);
          if (res?.error) {
            alert(res.error);
            return;
          }
          router.push("/dashboard/leads");
          router.refresh();
        });
      }}
    >
      {pending ? "Deleting…" : "Delete lead"}
    </Button>
  );
}

