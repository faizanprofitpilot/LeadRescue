"use client";

import Link from "next/link";
import { RevealOnView } from "@/components/marketing/reveal-on-view";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export function FinalCtaSection() {
  return (
    <section
      className="border-t border-white/10 bg-[#0c1118] py-16 text-white sm:py-20"
      aria-labelledby="final-cta-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end">
          <RevealOnView className="max-w-xl">
            <h2
              id="final-cta-heading"
              className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Stop losing jobs to missed calls
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-white/70">
              Set up your LeadRescue number and start capturing leads today.
            </p>
          </RevealOnView>
          <RevealOnView delay={120} className="w-full sm:w-auto">
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-12 justify-center rounded-full bg-[#c45c3e] px-8 text-base text-white shadow-[0_12px_32px_-16px_rgba(196,92,62,0.45)] transition-[transform,box-shadow] duration-200 hover:bg-[#d66d4f] hover:shadow-[0_16px_40px_-14px_rgba(196,92,62,0.4)] active:scale-[0.98] motion-reduce:active:scale-100",
                )}
              >
                Start recovering leads
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ size: "lg", variant: "ghost" }),
                  "h-12 justify-center rounded-full px-6 text-base text-white/80 transition-transform duration-200 hover:bg-white/10 hover:text-white active:scale-[0.98] motion-reduce:active:scale-100",
                )}
              >
                Sign in
              </Link>
            </div>
          </RevealOnView>
        </div>
      </div>
    </section>
  );
}
