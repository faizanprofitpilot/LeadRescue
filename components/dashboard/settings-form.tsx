"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import {
  updateSettings,
  type SettingsState,
} from "@/app/dashboard/settings/actions";
import {
  saveKnowledgeBaseAction,
  type StepFormState,
} from "@/app/dashboard/onboarding/setup-actions";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ForwardingInstructions } from "@/components/dashboard/forwarding-instructions";
import {
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_LABELS,
} from "@/lib/dashboard/service-categories";
import type { Business, BusinessKnowledgeBaseRow } from "@/lib/types";

const settingsInitial: SettingsState = {};
const kbInitial: StepFormState = {};

function SaveProfileButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save profile"}
    </Button>
  );
}

function SaveKbButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      {pending ? "Saving…" : "Save knowledge base"}
    </Button>
  );
}

type Props = {
  business: Business;
  leadRescueNumber: string | null;
  knowledgeBase: BusinessKnowledgeBaseRow | null;
};

export function SettingsForm({ business, leadRescueNumber, knowledgeBase }: Props) {
  const [profileState, profileAction] = useFormState(updateSettings, settingsInitial);
  const [kbState, kbAction] = useFormState(saveKnowledgeBaseAction, kbInitial);

  const kb = knowledgeBase;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-8">
        <form
          action={profileAction}
          className="space-y-6 rounded-xl border bg-card p-6 shadow-sm"
        >
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
            <p className="mt-1 text-muted-foreground text-sm">
              Business profile for summaries and your LeadRescue line. Phone numbers are
              managed in Setup. You never need carrier or provider IDs.
            </p>
          </div>

          {profileState.error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-sm">
              {profileState.error}
            </p>
          )}
          {profileState.ok && (
            <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-800 text-sm dark:text-emerald-200">
              Profile saved.
            </p>
          )}

          <div className="rounded-lg border border-dashed bg-muted/30 p-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Your LeadRescue number
            </p>
            {leadRescueNumber ? (
              <p className="mt-1 font-mono text-lg font-semibold">{leadRescueNumber}</p>
            ) : (
              <p className="mt-1 text-muted-foreground text-sm">Not generated yet.</p>
            )}
            <Link
              href="/dashboard/onboarding"
              className={cn(
                buttonVariants({ variant: "link" }),
                "mt-2 inline-flex h-auto px-0 text-sm",
              )}
            >
              Open Setup to generate or review
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="businessName">Business name</Label>
              <Input
                id="businessName"
                name="businessName"
                required
                defaultValue={business.business_name}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="primaryServiceCategory">Primary trade</Label>
              <select
                id="primaryServiceCategory"
                name="primaryServiceCategory"
                defaultValue={business.primary_service_category ?? "other"}
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {SERVICE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {SERVICE_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerName">Your name</Label>
              <Input
                id="ownerName"
                name="ownerName"
                defaultValue={business.owner_name ?? ""}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ownerEmail">Owner email (lead summaries)</Label>
              <Input
                id="ownerEmail"
                name="ownerEmail"
                type="email"
                required
                defaultValue={business.owner_email}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ownerPhone">Owner phone (optional)</Label>
              <Input
                id="ownerPhone"
                name="ownerPhone"
                defaultValue={business.owner_phone ?? ""}
              />
            </div>
          </div>

          <SaveProfileButton />
        </form>

        <form
          action={kbAction}
          className="space-y-6 rounded-xl border bg-card p-6 shadow-sm"
        >
          <div>
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              Business knowledge base
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              The AI uses this during SMS so replies match what you actually offer, where you
              work, and how you want to sound.
            </p>
          </div>

          {kbState.error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-sm">
              {kbState.error}
            </p>
          )}
          {kbState.ok && (
            <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-800 text-sm dark:text-emerald-200">
              Knowledge base saved.
            </p>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="servicesOffered">Services offered</Label>
              <Textarea
                id="servicesOffered"
                name="servicesOffered"
                rows={3}
                defaultValue={kb?.services_offered ?? ""}
                placeholder="e.g. AC repair, tune-ups, installs…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceAreas">Service areas</Label>
              <Textarea
                id="serviceAreas"
                name="serviceAreas"
                rows={2}
                defaultValue={kb?.service_areas ?? ""}
                placeholder="Towns, counties, or radius you serve"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessHours">Hours of operation</Label>
              <Textarea
                id="businessHours"
                name="businessHours"
                rows={2}
                defaultValue={kb?.business_hours ?? ""}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="emergencyService"
                name="emergencyService"
                type="checkbox"
                value="on"
                defaultChecked={kb?.emergency_service_available ?? false}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="emergencyService" className="font-normal">
                Emergency / after-hours service available
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="excludedJobs">Jobs you do not take</Label>
              <Textarea
                id="excludedJobs"
                name="excludedJobs"
                rows={2}
                defaultValue={kb?.excluded_jobs ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toneGuidance">Tone & style</Label>
              <Textarea
                id="toneGuidance"
                name="toneGuidance"
                rows={2}
                defaultValue={kb?.tone_guidance ?? ""}
                placeholder="e.g. Friendly, short sentences, say “we” not “I”"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aiNotes">Notes for texting</Label>
              <Textarea
                id="aiNotes"
                name="aiNotes"
                rows={4}
                defaultValue={kb?.ai_notes ?? ""}
              />
            </div>
          </div>

          <SaveKbButton />
        </form>
      </div>

      <ForwardingInstructions
        leadRescueNumber={leadRescueNumber}
        businessName={business.business_name}
      />
    </div>
  );
}
