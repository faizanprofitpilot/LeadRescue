"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { RevealOnView } from "@/components/marketing/reveal-on-view";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

const FEATURES = [
  "Instant text-back for missed calls",
  "AI captures job details (service, address, urgency)",
  "Structured lead summaries",
  "Works with your existing business number",
  "Unlimited missed-call recovery",
] as const;

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="scroll-mt-24 border-t border-[#1a1f26]/8 bg-[#f6f1ea] py-20 text-center sm:py-24"
      aria-labelledby="pricing-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <RevealOnView>
          <h2
            id="pricing-heading"
            className="font-heading text-3xl font-semibold tracking-tight text-[#1a1f26] sm:text-4xl"
          >
            Simple pricing
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[#3d4652] leading-relaxed sm:text-lg">
            Recover missed-call revenue for a fraction of one job.
          </p>
        </RevealOnView>

        <div className="mx-auto mt-12 max-w-md">
          <RevealOnView delay={100}>
            <div className="rounded-2xl border border-[#1a1f26]/10 bg-white/90 px-8 py-9 text-left shadow-[0_22px_56px_-30px_rgba(26,31,38,0.35)] backdrop-blur-sm transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:px-10 sm:py-10 hover:-translate-y-1 hover:shadow-[0_32px_64px_-28px_rgba(26,31,38,0.38)] motion-reduce:hover:translate-y-0">
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.12em] text-[#c45c3e]">
              LeadRescue
            </p>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
              <span className="font-heading text-4xl font-bold tracking-tight text-[#1a1f26] sm:text-5xl">
                $49
              </span>
              <span className="text-lg font-semibold text-[#5c6570] sm:text-xl">/ month</span>
            </div>
            <p className="mt-4 text-[#3d4652] leading-relaxed">
              Automatically text back missed calls and capture ready-to-book leads.
            </p>
            <ul className="mt-8 space-y-3.5 text-sm leading-snug text-[#1a1f26] sm:text-[0.9375rem]">
              {FEATURES.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c45c3e]/12 text-[#c45c3e]">
                    <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-center text-sm leading-relaxed text-[#5c6570]">
              One recovered job typically pays for months of LeadRescue.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-12 w-full justify-center rounded-full bg-[#c45c3e] px-8 text-base text-white shadow-[0_12px_32px_-16px_rgba(196,92,62,0.55)] transition-[transform,box-shadow] duration-200 hover:bg-[#b04f34] hover:shadow-[0_16px_40px_-14px_rgba(196,92,62,0.5)] active:scale-[0.98] motion-reduce:active:scale-100 sm:w-auto",
                )}
              >
                Start recovering leads
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "h-12 w-full justify-center rounded-full border-[#1a1f26]/15 bg-white/80 px-8 text-base transition-[transform,box-shadow] duration-200 hover:bg-white hover:shadow-md active:scale-[0.98] motion-reduce:active:scale-100 sm:w-auto",
                )}
              >
                Sign in
              </Link>
            </div>
          </div>
          </RevealOnView>
        </div>
      </div>
    </section>
  );
}
