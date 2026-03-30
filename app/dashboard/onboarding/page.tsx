import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDashboardContext } from "@/lib/dashboard/business";
import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard";
import { ForwardingInstructions } from "@/components/dashboard/forwarding-instructions";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ctx = await getDashboardContext();
  const { business, phoneNumbers, knowledgeBase, tollFreeVerification } = ctx;

  const activePhone = phoneNumbers.find((p) => p.provisioning_status === "active");
  const leadRescueNumber = activePhone?.phone_number ?? null;
  const lineVerificationStatus = activePhone?.line_verification_status ?? null;

  if (business?.onboarding_completed_at) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Setup complete</h1>
          <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
            Your LeadRescue account is active. Reopen this Setup page anytime to adjust your
            number, texting line verification, knowledge base, or forwarding checklist. Profile
            and knowledge base are also available in Settings.
          </p>
          <Link
            href="/dashboard/leads"
            className={cn(buttonVariants({ size: "default" }), "mt-4 inline-flex")}
          >
            View leads
          </Link>
        </div>
        <ForwardingInstructions
          leadRescueNumber={leadRescueNumber}
          businessName={business.business_name}
        />
      </div>
    );
  }

  return (
    <OnboardingWizard
      defaultEmail={user?.email ?? ""}
      business={business}
      leadRescueNumber={leadRescueNumber}
      lineVerificationStatus={lineVerificationStatus}
      tollFreeVerification={tollFreeVerification}
      knowledgeBase={knowledgeBase}
      checklist={business?.setup_checklist ?? {
        business_info: false,
        number_generated: false,
        verification_submitted: false,
        knowledge_base: false,
        forwarding_acknowledged: false,
        test_completed: false,
      }}
    />
  );
}
