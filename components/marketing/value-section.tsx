"use client";

import { RevealOnView } from "@/components/marketing/reveal-on-view";

export function ValueSection() {
  return (
    <section
      id="value"
      className="scroll-mt-24 py-20 sm:py-24"
      aria-labelledby="value-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <RevealOnView>
          <div className="relative overflow-hidden rounded-3xl border border-[#1a1f26]/10 bg-[#0c1118] px-6 py-14 text-white sm:px-12 sm:py-16">
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#c45c3e]/20 blur-3xl lr-hero-glow-pulse motion-reduce:animate-none"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-[#c45c3e]/10 blur-3xl lr-hero-glow-pulse motion-reduce:animate-none"
              aria-hidden
              style={{ animationDelay: "1.2s" }}
            />
            <div className="relative max-w-3xl">
              <h2
                id="value-heading"
                className="font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl sm:leading-tight"
              >
                One missed call could be a $500–$5,000 job
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-white/75 sm:text-xl">
                Home service businesses lose real revenue when calls go unanswered. LeadRescue makes
                sure every missed call gets an immediate follow-up and a real chance to book.
              </p>
            </div>
          </div>
        </RevealOnView>
      </div>
    </section>
  );
}
