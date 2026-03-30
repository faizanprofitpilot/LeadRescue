"use client";

import { useTransition } from "react";
import { updateLeadStatus } from "@/app/dashboard/leads/actions";
import type { LeadStatus } from "@/lib/types";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  leadId: string;
  current: LeadStatus;
};

export function LeadStatusForm({ leadId, current }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Label htmlFor="status">Lead status</Label>
      <Select
        disabled={pending}
        defaultValue={current}
        onValueChange={(value) => {
          startTransition(async () => {
            await updateLeadStatus(leadId, value as LeadStatus);
          });
        }}
      >
        <SelectTrigger id="status" className="w-[200px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="new">New</SelectItem>
          <SelectItem value="contacted">Contacted</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
