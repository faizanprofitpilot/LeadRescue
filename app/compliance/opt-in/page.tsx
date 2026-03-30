import type { Metadata } from "next";
import { LEADRESCUE_PUBLIC_ORIGIN } from "@/lib/leadrescue-public";

export const metadata: Metadata = {
  title: "Text messaging | LeadRescue",
  description:
    "How LeadRescue texting works for customers of home service businesses: consent, missed calls, and opting out.",
  alternates: { canonical: `${LEADRESCUE_PUBLIC_ORIGIN}/compliance/opt-in` },
};

export default function ComplianceOptInPage() {
  return (
    <main className="bg-background text-foreground">
      <div className="mx-auto max-w-prose px-6 py-12 sm:py-16">
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Text messages from your service call
        </h1>
        <p className="mt-6 text-muted-foreground text-sm leading-relaxed">
          LeadRescue helps home service businesses text homeowners who tried to reach them by phone.
          Someone agrees to receive these messages by calling the business—the same act that starts
          the conversation.
        </p>
        <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
          Messages are sent only in response to missed or unanswered calls that are forwarded to the
          business’s LeadRescue line. They are transactional follow-ups about the service request,
          not promotional or marketing blasts.
        </p>
        <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
          Every thread explains how to get help. Customers can reply STOP at any time to opt out of
          further texts from that number.
        </p>
        <p className="mt-6 text-muted-foreground text-sm leading-relaxed">
          More about LeadRescue:{" "}
          <a className="text-foreground underline underline-offset-2" href={LEADRESCUE_PUBLIC_ORIGIN}>
            {LEADRESCUE_PUBLIC_ORIGIN.replace(/^https:\/\//, "")}
          </a>
        </p>
      </div>
    </main>
  );
}
