"use client";

import {
  ClipboardList,
  MessageSquare,
  Phone,
  Voicemail,
  type LucideIcon,
} from "lucide-react";
import { RevealOnView } from "@/components/marketing/reveal-on-view";
import { Card, CardContent } from "@/components/ui/card";

const BENEFITS: {
  title: string;
  body: string;
  Icon: LucideIcon;
}[] = [
  {
    Icon: MessageSquare,
    title: "Instant text-back",
    body: "Every missed call gets an immediate response so you don’t lose the customer while they’re still searching.",
  },
  {
    Icon: ClipboardList,
    title: "Capture real job details",
    body: "We collect service type, address, urgency, and contact info so you know exactly what the customer needs.",
  },
  {
    Icon: Voicemail,
    title: "Leads, not voicemails",
    body: "Get structured leads instead of vague voicemails your team has to sort through later.",
  },
  {
    Icon: Phone,
    title: "Works with your current number",
    body: "Keep your business line. Just forward missed calls. LeadRescue handles the rest.",
  },
];

export function BenefitGridSection() {
  return (
    <section
      id="features"
      className="scroll-mt-24 pb-20 sm:pb-24"
      aria-labelledby="benefits-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <RevealOnView>
          <h2
            id="benefits-heading"
            className="font-heading max-w-2xl text-3xl font-semibold tracking-tight text-[#1a1f26] sm:text-4xl"
          >
            Everything you need to capture missed-call leads
          </h2>
          <p className="mt-3 max-w-xl text-[#3d4652] leading-relaxed">
            Same number customers already dial, with more booked jobs from calls you couldn’t answer.
          </p>
        </RevealOnView>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {BENEFITS.map(({ Icon, title, body }, i) => (
            <RevealOnView key={title} delay={i * 75}>
              <Card className="h-full border-[#1a1f26]/8 bg-white/85 shadow-[0_22px_56px_-30px_rgba(26,31,38,0.4)] backdrop-blur-sm transition-[transform,box-shadow] duration-300 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-[0_28px_64px_-28px_rgba(26,31,38,0.35)] motion-reduce:hover:translate-y-0">
                <CardContent className="p-6 sm:p-7">
                  <div className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c45c3e]/12 text-[#c45c3e]">
                      <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-heading text-lg font-semibold text-[#1a1f26]">{title}</h3>
                      <p className="mt-2.5 text-sm leading-relaxed text-[#3d4652]">{body}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </RevealOnView>
          ))}
        </div>
      </div>
    </section>
  );
}
