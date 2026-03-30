"use client";

import { ClipboardCheck, MessageSquare, PhoneMissed, type LucideIcon } from "lucide-react";
import { RevealOnView } from "@/components/marketing/reveal-on-view";

const STEPS: {
  title: string;
  body: string;
  Icon: LucideIcon;
}[] = [
  {
    Icon: PhoneMissed,
    title: "You miss a call",
    body: "A customer calls while you’re busy, after hours, or on a job.",
  },
  {
    Icon: MessageSquare,
    title: "We text them instantly",
    body: "LeadRescue texts them in seconds and asks what they need.",
  },
  {
    Icon: ClipboardCheck,
    title: "You get a ready-to-book lead",
    body: "We capture service, address, urgency, and contact info so you can call back and book.",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 border-t border-[#1a1f26]/8 bg-[#f0ebe3]/80 py-20 sm:py-24"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <RevealOnView>
          <h2
            id="how-it-works-heading"
            className="font-heading max-w-2xl text-3xl font-semibold tracking-tight text-[#1a1f26] sm:text-4xl"
          >
            How LeadRescue works
          </h2>
          <p className="mt-3 max-w-xl text-[#3d4652] leading-relaxed">
            From missed call to booked job in three steps.
          </p>
        </RevealOnView>

        <div className="mt-14 lg:mt-16">
          <ol className="grid gap-6 lg:grid-cols-3 lg:gap-6">
            {STEPS.map(({ Icon, title, body }, i) => (
              <li key={title} className="list-none">
                <RevealOnView
                  delay={i * 90}
                  className="h-full motion-reduce:transform-none"
                >
                  <div className="h-full rounded-2xl border border-[#1a1f26]/10 bg-white/80 p-6 shadow-[0_20px_50px_-32px_rgba(26,31,38,0.35)] backdrop-blur-sm transition-[transform,box-shadow] duration-300 ease-out motion-reduce:transition-none sm:p-7 hover:-translate-y-0.5 hover:shadow-[0_26px_56px_-28px_rgba(26,31,38,0.4)] motion-reduce:hover:translate-y-0">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#c45c3e]/12 text-[#c45c3e] shadow-[0_10px_24px_-12px_rgba(196,92,62,0.35)]">
                        <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                      </span>
                      <div className="h-px flex-1 bg-gradient-to-r from-[#c45c3e]/25 to-transparent lg:hidden" />
                    </div>
                    <h3 className="font-heading mt-5 text-xl font-semibold tracking-tight text-[#1a1f26]">
                      {title}
                    </h3>
                    <p className="mt-3 text-[#3d4652] leading-relaxed">{body}</p>
                  </div>
                </RevealOnView>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
