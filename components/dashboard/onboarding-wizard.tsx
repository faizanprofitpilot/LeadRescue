"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  acknowledgeForwardingAction,
  finishOnboardingAndGoToDashboard,
  markTestSetupAction,
  provisionNumberAction,
  saveBusinessBasicsAction,
  saveKnowledgeBaseAction,
  saveVerificationDraft,
  skipKnowledgeBaseAction,
  submitVerificationForReview,
  type StepFormState,
} from "@/app/dashboard/onboarding/setup-actions";
import { CopyPhoneNumberButton } from "@/components/dashboard/copy-phone-number-button";
import { ForwardingInstructions } from "@/components/dashboard/forwarding-instructions";
import { RegenerateNumberSubmit } from "@/components/dashboard/regenerate-number-submit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_LABELS,
} from "@/lib/dashboard/service-categories";
import {
  TWILIO_TOLLFREE_BUSINESS_TYPES,
  TWILIO_TOLLFREE_BUSINESS_TYPE_LABELS,
  isTwilioTollfreeBusinessType,
} from "@/lib/dashboard/twilio-tollfree-business-types";
import {
  VERIFICATION_DEFAULT_CONSENT,
  VERIFICATION_DEFAULT_SAMPLE_1,
  VERIFICATION_DEFAULT_SAMPLE_2,
  VERIFICATION_DEFAULT_USE_CASE,
} from "@/lib/dashboard/verification-compliance-defaults";
import type {
  Business,
  BusinessKnowledgeBaseRow,
  LineVerificationStatus,
  SetupChecklist,
  TollFreeVerificationRow,
} from "@/lib/types";

const initialStepState: StepFormState = {};

/** Phone line / carrier texting approval — customer-facing labels */
const TEXTING_STATUS_CUSTOMER: Record<string, string> = {
  not_started: "Not verified",
  draft: "Not verified",
  submitted: "In review",
  needs_changes: "Needs updates",
  approved: "Approved",
  rejected: "Needs updates",
};

/** In-app registration form progress — customer-facing */
const APPLICATION_STATUS_CUSTOMER: Record<string, string> = {
  not_started: "Not started",
  draft: "In progress",
  submitted: "In review",
  needs_changes: "Needs updates",
  approved: "Approved",
  rejected: "Needs updates",
};

function customerTextingStatus(lineStatus: string | null): string {
  const key = lineStatus ?? "not_started";
  return TEXTING_STATUS_CUSTOMER[key] ?? TEXTING_STATUS_CUSTOMER.not_started;
}

function customerApplicationStatus(tfStatus: string | null | undefined): string {
  const key = tfStatus ?? "not_started";
  return APPLICATION_STATUS_CUSTOMER[key] ?? APPLICATION_STATUS_CUSTOMER.not_started;
}

function firstIncompleteStep(c: SetupChecklist): number {
  if (!c.business_info) return 0;
  if (!c.number_generated) return 1;
  if (!c.verification_submitted) return 2;
  if (!c.knowledge_base) return 3;
  if (!c.forwarding_acknowledged) return 4;
  return 5;
}

/** Sidebar badge for “Verify texting line”: submitted ≠ carrier-approved yet. */
function verificationStepBadge(
  checklistSubmitted: boolean,
  lineStatus: string | null,
): { label: string; variant: "default" | "secondary" | "outline" | "destructive" } {
  if (!checklistSubmitted) {
    return { label: "Open", variant: "secondary" };
  }
  const line = (lineStatus ?? "submitted") as LineVerificationStatus;
  if (line === "approved") return { label: "Approved", variant: "default" };
  if (line === "rejected") return { label: "Needs updates", variant: "destructive" };
  if (line === "needs_changes") return { label: "Needs updates", variant: "outline" };
  return { label: "In review", variant: "secondary" };
}

function verificationAwaitingApproval(
  checklistSubmitted: boolean,
  lineStatus: string | null,
): boolean {
  if (!checklistSubmitted) return false;
  const line = (lineStatus ?? "submitted") as LineVerificationStatus;
  if (line === "approved" || line === "rejected" || line === "needs_changes") return false;
  return true;
}

const STEP_META = [
  { key: "business_info" as const, title: "Business basics", desc: "Name, contact, trade" },
  { key: "number_generated" as const, title: "LeadRescue number", desc: "Your business line" },
  { key: "verification_submitted" as const, title: "Verify texting line", desc: "One-time registration" },
  { key: "knowledge_base" as const, title: "Knowledge base", desc: "What the AI knows" },
  { key: "forwarding_acknowledged" as const, title: "Call forwarding", desc: "Missed-call flow" },
  { key: "test_completed" as const, title: "Test & finish", desc: "Confirm it works" },
];

function Submit({
  label,
  pendingLabel,
  disabled,
}: {
  label: string;
  pendingLabel: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

function FinishDashboardButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Opening…" : "Go to dashboard"}
    </Button>
  );
}

export type OnboardingWizardProps = {
  defaultEmail: string;
  business: Business | null;
  leadRescueNumber: string | null;
  lineVerificationStatus: string | null;
  tollFreeVerification: TollFreeVerificationRow | null;
  knowledgeBase: BusinessKnowledgeBaseRow | null;
  checklist: SetupChecklist;
};

export function OnboardingWizard({
  defaultEmail,
  business,
  leadRescueNumber,
  lineVerificationStatus,
  tollFreeVerification,
  knowledgeBase,
  checklist,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(() => firstIncompleteStep(checklist));

  const [basicsState, basicsAction] = useFormState(saveBusinessBasicsAction, initialStepState);
  const [provisionState, provisionAction] = useFormState(
    provisionNumberAction,
    initialStepState,
  );
  const [kbState, kbAction] = useFormState(saveKnowledgeBaseAction, initialStepState);
  const [skipState, skipAction] = useFormState(skipKnowledgeBaseAction, initialStepState);
  const [fwdState, fwdAction] = useFormState(acknowledgeForwardingAction, initialStepState);
  const [testState, testAction] = useFormState(markTestSetupAction, initialStepState);

  const verifyFormRef = useRef<HTMLFormElement>(null);
  const [verifyFlash, setVerifyFlash] = useState<{ error?: string; ok?: string }>({});
  const [draftPending, runDraft] = useTransition();
  const [submitPending, runSubmit] = useTransition();

  const tf = tollFreeVerification;
  const [verificationBusinessType, setVerificationBusinessType] = useState(() =>
    isTwilioTollfreeBusinessType(tf?.business_type) ? tf.business_type : "",
  );
  useEffect(() => {
    setVerificationBusinessType(
      isTwilioTollfreeBusinessType(tf?.business_type) ? tf.business_type : "",
    );
  }, [tf?.business_type]);

  const displayNumber = provisionState.phoneNumber ?? leadRescueNumber;
  const textingStatusLabel = customerTextingStatus(lineVerificationStatus);
  const textingApproved = lineVerificationStatus === "approved";

  function goContinue(fromStep: number) {
    setStep(fromStep + 1);
    router.refresh();
  }

  const kb = knowledgeBase;

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-4 rounded-xl border bg-card p-4 shadow-sm lg:sticky lg:top-24 lg:self-start">
        <div>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Setup progress
          </p>
          <p className="font-heading mt-1 text-lg font-semibold">LeadRescue checklist</p>
        </div>
        <ol className="space-y-2">
          {STEP_META.map((s, i) => {
            const done = checklist[s.key];
            const active = step === i;
            const testLocked = s.key === "test_completed" && !textingApproved;
            const vBadge =
              s.key === "verification_submitted"
                ? verificationStepBadge(checklist.verification_submitted, lineVerificationStatus)
                : null;
            return (
              <li key={s.key}>
                <button
                  type="button"
                  disabled={testLocked}
                  onClick={() => setStep(i)}
                  className={cn(
                    "flex w-full flex-col rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    active && "border-primary bg-primary/5",
                    !active && !testLocked && "hover:bg-muted/60",
                    testLocked && "cursor-not-allowed opacity-55",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium">{s.title}</span>
                    {vBadge ? (
                      <Badge variant={vBadge.variant} className="shrink-0 text-[10px]">
                        {vBadge.label}
                      </Badge>
                    ) : (
                      <Badge variant={done ? "default" : "secondary"} className="shrink-0 text-[10px]">
                        {done ? "Done" : "Open"}
                      </Badge>
                    )}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {testLocked
                      ? "Unlocks after texting is approved"
                      : s.desc}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Missed calls to your business number forward to LeadRescue. We text the homeowner back
          and capture the job details for you.
        </p>
      </aside>

      <div className="min-w-0 space-y-6">
        {verificationAwaitingApproval(
          checklist.verification_submitted,
          lineVerificationStatus,
        ) && (
          <div
            className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100"
            role="status"
          >
            <p className="font-medium">Texting line verification is in progress</p>
            <p className="mt-1 text-amber-900/90 leading-relaxed dark:text-amber-100/85">
              Texting approval usually takes a few business days. The status shown here refreshes
              automatically every few minutes when you load the dashboard (for example when you open
              Setup again). You can keep going with the steps below, or open{" "}
              <button
                type="button"
                className="font-semibold underline-offset-2 hover:underline"
                onClick={() => setStep(2)}
              >
                Verify texting line
              </button>{" "}
              anytime to review your details.
            </p>
          </div>
        )}
        {step === 0 && (
          <section className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="font-heading text-xl font-semibold">Business basics</h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Home service businesses only. This drives your summaries and how we position the AI.
            </p>
            <form action={basicsAction} className="mt-6 space-y-4">
              {basicsState.error && (
                <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-sm">
                  {basicsState.error}
                </p>
              )}
              {basicsState.ok && (
                <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-800 text-sm dark:text-emerald-200">
                  Saved. Continue when you are ready.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="businessName">Business name</Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    required
                    defaultValue={business?.business_name ?? ""}
                    placeholder="e.g. North Star HVAC"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="primaryServiceCategory">Primary trade</Label>
                  <select
                    id="primaryServiceCategory"
                    name="primaryServiceCategory"
                    defaultValue={business?.primary_service_category ?? "other"}
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
                    defaultValue={business?.owner_name ?? ""}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="ownerEmail">Owner email</Label>
                  <Input
                    id="ownerEmail"
                    name="ownerEmail"
                    type="email"
                    required
                    defaultValue={business?.owner_email ?? defaultEmail}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="ownerPhone">Owner phone</Label>
                  <Input
                    id="ownerPhone"
                    name="ownerPhone"
                    defaultValue={business?.owner_phone ?? ""}
                    placeholder="+1…"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Submit label="Save and continue" pendingLabel="Saving…" />
                {basicsState.ok && (
                  <Button type="button" variant="secondary" onClick={() => goContinue(0)}>
                    Next step
                  </Button>
                )}
              </div>
            </form>
          </section>
        )}

        {step === 1 && (
          <section
            className={cn(
              "rounded-xl border bg-card p-6 shadow-sm sm:p-8",
              displayNumber &&
                "border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.07] to-card dark:from-emerald-500/[0.09]",
            )}
          >
            {!displayNumber ? (
              <>
                <h2 className="font-heading text-xl font-semibold">Get your LeadRescue number</h2>
                <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
                  We&apos;ll assign a dedicated number for your account. You&apos;ll forward missed
                  calls from your current business line to it so we can text customers back right
                  away.
                </p>
                <form action={provisionAction} className="mt-8 space-y-4">
                  {provisionState.error && (
                    <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-sm">
                      {provisionState.error}
                    </p>
                  )}
                  <Submit label="Generate my LeadRescue number" pendingLabel="Getting your number…" />
                </form>
              </>
            ) : (
              <>
                <p className="text-emerald-800 text-sm font-medium dark:text-emerald-200/95">
                  You&apos;re almost set
                </p>
                <h2 className="font-heading mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Your LeadRescue number is ready
                </h2>

                {provisionState.error && (
                  <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-sm">
                    {provisionState.error}
                  </p>
                )}

                <div className="mt-6 rounded-2xl border-2 border-emerald-500/25 bg-background/80 px-5 py-6 shadow-sm sm:px-8 sm:py-8">
                  <p className="text-muted-foreground text-xs font-medium tracking-wide">
                    Call forwarding destination
                  </p>
                  <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <p className="font-mono text-3xl font-bold tracking-tight sm:text-4xl">
                      {displayNumber}
                    </p>
                    <CopyPhoneNumberButton value={displayNumber} />
                  </div>
                  <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                    Forward missed calls here from your current business number.
                  </p>
                  <div className="text-muted-foreground mt-5 space-y-1 border-t border-border/80 pt-5 text-sm">
                    <p>
                      <span className="font-medium text-foreground">Number</span>
                      <span className="mx-1.5">·</span>
                      Ready
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Texting status</span>
                      <span className="mx-1.5">·</span>
                      {textingStatusLabel}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-lg border border-dashed bg-muted/25 px-4 py-3">
                  <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                    What happens next
                  </p>
                  <ol className="mt-2 flex list-none flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-1">
                    <li>
                      <span className="font-medium text-foreground">1.</span> Verify texting
                    </li>
                    <li>
                      <span className="font-medium text-foreground">2.</span> Forward missed calls
                    </li>
                    <li>
                      <span className="font-medium text-foreground">3.</span> Test your setup
                    </li>
                  </ol>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <Button type="button" size="lg" className="w-full sm:w-auto" onClick={() => goContinue(1)}>
                    Verify texting line
                  </Button>
                </div>

                <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                  Texting approval usually takes a few business days.
                </p>

                <form action={provisionAction} className="mt-8 border-t pt-5">
                  <p className="text-muted-foreground text-center text-sm sm:text-left">
                    Need a different number? <RegenerateNumberSubmit />
                  </p>
                </form>
              </>
            )}
          </section>
        )}

        {step === 2 && (
          <section className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="font-heading text-xl font-semibold">Verify your texting line</h2>
            <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
              U.S. carriers require a one-time registration with your business details. Submit
              accurate information, then check back here for status—it updates automatically every few
              minutes when you use the dashboard, not the instant a review status changes.
            </p>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Texting approval usually takes a few business days.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">
                Application: {customerApplicationStatus(tf?.status)}
              </Badge>
              <Badge variant="outline">Texting status: {textingStatusLabel}</Badge>
            </div>

            <form ref={verifyFormRef} className="mt-6 space-y-4">
              {verifyFlash.error && (
                <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-sm">
                  {verifyFlash.error}
                </p>
              )}
              {verifyFlash.ok && (
                <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-800 text-sm dark:text-emerald-200">
                  {verifyFlash.ok}
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="legalBusinessName">Legal business name</Label>
                  <Input
                    id="legalBusinessName"
                    name="legalBusinessName"
                    defaultValue={tf?.legal_business_name ?? ""}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="publicBusinessName">Public / DBA name</Label>
                  <Input
                    id="publicBusinessName"
                    name="publicBusinessName"
                    defaultValue={tf?.public_business_name ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business type</Label>
                  <input type="hidden" name="businessType" value={verificationBusinessType} />
                  <Select
                    value={verificationBusinessType === "" ? undefined : verificationBusinessType}
                    onValueChange={(v) => setVerificationBusinessType(v ?? "")}
                  >
                    <SelectTrigger id="businessType" className="w-full" aria-required>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TWILIO_TOLLFREE_BUSINESS_TYPES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {TWILIO_TOLLFREE_BUSINESS_TYPE_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" name="website" defaultValue={tf?.website ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Business email</Label>
                  <Input
                    id="businessEmail"
                    name="businessEmail"
                    type="email"
                    defaultValue={tf?.business_email ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessPhone">Business phone</Label>
                  <Input
                    id="businessPhone"
                    name="businessPhone"
                    defaultValue={tf?.business_phone ?? ""}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="addressLine1">Street address</Label>
                  <Input
                    id="addressLine1"
                    name="addressLine1"
                    defaultValue={tf?.business_address_line_1 ?? ""}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="addressLine2">Suite / unit (optional)</Label>
                  <Input
                    id="addressLine2"
                    name="addressLine2"
                    defaultValue={tf?.business_address_line_2 ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" defaultValue={tf?.business_city ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State / province</Label>
                  <Input id="state" name="state" defaultValue={tf?.business_state ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal code</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    defaultValue={tf?.business_postal_code ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    defaultValue={tf?.business_country ?? "US"}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="registrationNumber">EIN / registration number</Label>
                  <Input
                    id="registrationNumber"
                    name="registrationNumber"
                    defaultValue={tf?.registration_number ?? ""}
                  />
                  <p className="text-muted-foreground text-xs">
                    Required for registered business types (not sole proprietor). Sole proprietors may
                    leave blank.
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    We&apos;ve pre-filled these based on how LeadRescue works. You can edit if
                    needed.
                  </p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="useCaseDescription">How you use this number</Label>
                  <Textarea
                    id="useCaseDescription"
                    name="useCaseDescription"
                    rows={4}
                    required
                    defaultValue={
                      tf?.use_case_description?.trim()
                        ? tf.use_case_description
                        : VERIFICATION_DEFAULT_USE_CASE
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="sampleMessage1">Sample message 1</Label>
                  <Textarea
                    id="sampleMessage1"
                    name="sampleMessage1"
                    rows={2}
                    required
                    defaultValue={
                      tf?.sample_message_1?.trim()
                        ? tf.sample_message_1
                        : VERIFICATION_DEFAULT_SAMPLE_1
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="sampleMessage2">Sample message 2</Label>
                  <Textarea
                    id="sampleMessage2"
                    name="sampleMessage2"
                    rows={2}
                    required
                    defaultValue={
                      tf?.sample_message_2?.trim()
                        ? tf.sample_message_2
                        : VERIFICATION_DEFAULT_SAMPLE_2
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="consentDescription">Text message consent wording</Label>
                  <Textarea
                    id="consentDescription"
                    name="consentDescription"
                    rows={4}
                    required
                    defaultValue={
                      tf?.consent_description?.trim()
                        ? tf.consent_description
                        : VERIFICATION_DEFAULT_CONSENT
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={draftPending || submitPending}
                  onClick={() => {
                    const el = verifyFormRef.current;
                    if (!el) return;
                    runDraft(async () => {
                      setVerifyFlash({});
                      const r = await saveVerificationDraft(new FormData(el));
                      setVerifyFlash(
                        r.ok ? { ok: "Draft saved." } : { error: r.error ?? "Could not save." },
                      );
                      if (r.ok) router.refresh();
                    });
                  }}
                >
                  {draftPending ? "Saving…" : "Save draft"}
                </Button>
                <Button
                  type="button"
                  disabled={draftPending || submitPending}
                  onClick={() => {
                    const el = verifyFormRef.current;
                    if (!el) return;
                    runSubmit(async () => {
                      setVerifyFlash({});
                      const r = await submitVerificationForReview(new FormData(el));
                      setVerifyFlash(
                        r.ok
                          ? {
                              ok: "Submitted. Status will refresh automatically every few minutes when you use the dashboard.",
                            }
                          : { error: r.error ?? "Could not submit." },
                      );
                      if (r.ok) router.refresh();
                    });
                  }}
                >
                  {submitPending ? "Submitting…" : "Submit for review"}
                </Button>
                {verifyFlash.ok?.includes("Submitted.") && (
                  <Button type="button" variant="secondary" onClick={() => goContinue(2)}>
                    Continue to knowledge base
                  </Button>
                )}
              </div>
            </form>
          </section>
        )}

        {step === 3 && (
          <section className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="font-heading text-xl font-semibold">Business knowledge base</h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Helps the AI stay in your service area, avoid jobs you do not take, and sound like
              your brand. You can refine this anytime in Settings.
            </p>
            <form action={kbAction} className="mt-6 space-y-4">
              {kbState.error && (
                <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-sm">
                  {kbState.error}
                </p>
              )}
              {kbState.ok && (
                <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-800 text-sm dark:text-emerald-200">
                  Saved. Continue when ready, or add more detail first.
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceAreas">Service areas</Label>
                  <Textarea
                    id="serviceAreas"
                    name="serviceAreas"
                    rows={2}
                    defaultValue={kb?.service_areas ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessHours">Hours</Label>
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
                    Emergency / after-hours service
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="excludedJobs">Jobs you do not handle</Label>
                  <Textarea
                    id="excludedJobs"
                    name="excludedJobs"
                    rows={2}
                    defaultValue={kb?.excluded_jobs ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toneGuidance">Tone</Label>
                  <Textarea
                    id="toneGuidance"
                    name="toneGuidance"
                    rows={2}
                    defaultValue={kb?.tone_guidance ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aiNotes">Extra notes for SMS</Label>
                  <Textarea
                    id="aiNotes"
                    name="aiNotes"
                    rows={3}
                    defaultValue={kb?.ai_notes ?? ""}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Submit label="Save knowledge base" pendingLabel="Saving…" />
                {kbState.ok && (
                  <Button type="button" variant="secondary" onClick={() => goContinue(3)}>
                    Next step
                  </Button>
                )}
              </div>
            </form>
            <form action={skipAction} className="mt-4 border-t pt-4">
              {skipState.error && (
                <p className="mb-2 text-destructive text-sm">{skipState.error}</p>
              )}
              <p className="text-muted-foreground mb-3 text-sm">
                Short on time? Skip for now and complete this under Settings.
              </p>
              <Button type="submit" variant="outline">
                Skip for now
              </Button>
              {skipState.ok && (
                <Button
                  type="button"
                  variant="secondary"
                  className="ml-3"
                  onClick={() => goContinue(3)}
                >
                  Next step
                </Button>
              )}
            </form>
          </section>
        )}

        {step === 4 && (
          <section className="space-y-6">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="font-heading text-xl font-semibold">Configure missed-call forwarding</h2>
              <p className="mt-1 text-muted-foreground text-sm">
                Keep your published business number. Forward busy / no-answer calls to LeadRescue so
                we can text the customer immediately.
              </p>
              <ForwardingInstructions
                leadRescueNumber={displayNumber}
                businessName={business?.business_name}
              />
              <form action={fwdAction} className="mt-6 space-y-4">
                {fwdState.error && (
                  <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-sm">
                    {fwdState.error}
                  </p>
                )}
                {fwdState.ok && (
                  <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-800 text-sm dark:text-emerald-200">
                    Marked as understood. Run a quick test on the next step.
                  </p>
                )}
                <p className="text-muted-foreground text-sm">
                  Confirm you know where to set forwarding with your carrier or VoIP provider.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Submit label="I’ve set up forwarding" pendingLabel="Saving…" />
                  {fwdState.ok && (
                    <Button type="button" variant="secondary" onClick={() => goContinue(4)}>
                      Next step
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </section>
        )}

        {step === 5 && (
          <section
            className={cn(
              "rounded-xl border bg-card p-6 shadow-sm",
              !textingApproved && "opacity-90",
            )}
          >
            <h2 className="font-heading text-xl font-semibold">Test your setup</h2>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              Testing works best after your texting line is approved and missed-call forwarding is
              set up.
            </p>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              Call your main business number from your phone and let it ring through to voicemail or
              hang up after forwarding picks up. LeadRescue should text the caller back. When you
              see a lead in the dashboard, this step completes automatically—or mark it done once
              you&apos;ve tried.
            </p>
            <form action={testAction} className="mt-6 space-y-4">
              {testState.error && (
                <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-sm">
                  {testState.error}
                </p>
              )}
              {testState.ok && (
                <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-800 text-sm dark:text-emerald-200">
                  Marked complete.
                </p>
              )}
              <Submit
                label="Mark test completed"
                pendingLabel="Saving…"
                disabled={!textingApproved}
              />
            </form>
            <form action={finishOnboardingAndGoToDashboard} className="mt-8 border-t pt-6">
              <p className="text-muted-foreground mb-4 text-sm">
                Finished for now? You can always return to Setup from the top navigation.
              </p>
              <FinishDashboardButton />
            </form>
          </section>
        )}

        <p className="text-muted-foreground text-center text-xs sm:text-left">
          Profile or knowledge base later?{" "}
          <Link href="/dashboard/settings" className="text-foreground underline underline-offset-4">
            Open Settings
          </Link>
        </p>
      </div>
    </div>
  );
}
