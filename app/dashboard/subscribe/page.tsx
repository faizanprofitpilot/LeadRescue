import Link from "next/link";
import { redirect } from "next/navigation";
import { userHasActivePaidPlan } from "@/lib/dashboard/subscription";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default async function SubscribePage() {
  const active = await userHasActivePaidPlan();
  if (active) {
    redirect("/dashboard/leads");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.12em] text-[#c45c3e]">
          Subscription required
        </p>
        <h1 className="font-heading mt-2 text-2xl font-semibold tracking-tight">
          Activate LeadRescue to continue
        </h1>
        <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
          LeadRescue is <strong className="text-foreground">$49 / month</strong> per business. After you
          subscribe, your account is enabled for missed-call recovery, AI SMS, and the dashboard.
        </p>
        <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
          Complete checkout (when billing is connected) or contact us if your plan was activated
          manually. You can sign out below and return once your subscription shows as active.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {process.env.NEXT_PUBLIC_SUPPORT_EMAIL ? (
            <a
              href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}?subject=LeadRescue%20subscription`}
              className={cn(buttonVariants({ size: "lg" }), "justify-center rounded-full")}
            >
              Email support
            </a>
          ) : null}
          <Link
            href="/"
            className={cn(
              buttonVariants({ size: "lg", variant: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ? "outline" : "default" }),
              "justify-center rounded-full",
            )}
          >
            Back to home
          </Link>
        </div>
      </div>
      <p className="text-center text-muted-foreground text-xs">
        Already paid? Refresh this page after your account is marked active in our system.
      </p>
    </div>
  );
}
