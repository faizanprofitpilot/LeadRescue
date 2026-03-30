import { ArrowRight, ClipboardList, MessageSquare, PhoneMissed } from "lucide-react";
import { RevealOnView } from "@/components/marketing/reveal-on-view";

function FlowArrow({ className }: { className?: string }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center text-[#c45c3e]/45 transition-transform duration-500 ease-out motion-reduce:transition-none ${className ?? ""}`}
      aria-hidden
    >
      <ArrowRight className="h-6 w-6 lg:h-8 lg:w-8" strokeWidth={1.5} />
    </div>
  );
}

const cardMotion =
  "transition-[transform,box-shadow] duration-300 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-[0_32px_72px_-36px_rgba(12,17,24,0.55)] motion-reduce:hover:translate-y-0";

export function HeroProductVisual() {
  return (
    <div className="relative w-full">
      <RevealOnView>
        <p className="mb-6 text-center text-sm font-medium tracking-tight text-[#5c6570] sm:mb-8 sm:text-base">
          Missed call → Text → Booked job
        </p>
      </RevealOnView>
      <div
        className="relative w-full"
        role="img"
        aria-label="Missed call, then text conversation, then booked job lead"
      >
        <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-[#c45c3e]/[0.07] via-transparent to-[#0c1118]/[0.05] blur-3xl sm:-inset-8" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-stretch lg:gap-4 xl:gap-6">
          <RevealOnView delay={0} className="flex min-h-0 w-full flex-1 flex-col">
            <article
              className={`flex min-h-[220px] flex-1 flex-col rounded-3xl border border-[#1a1f26]/10 bg-white/95 p-6 shadow-[0_28px_64px_-32px_rgba(12,17,24,0.5)] backdrop-blur-sm sm:min-h-[240px] sm:p-7 lg:min-h-0 lg:p-8 ${cardMotion}`}
            >
              <div className="flex items-center gap-3 text-[#c45c3e]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#c45c3e]/10 lg:h-12 lg:w-12">
                  <PhoneMissed className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={2} aria-hidden />
                </span>
                <span className="font-heading text-xs font-semibold uppercase tracking-[0.14em] sm:text-sm">
                  Missed call
                </span>
              </div>
              <p className="mt-5 font-heading text-xl font-semibold tracking-tight text-[#1a1f26] sm:text-2xl lg:text-[1.65rem] lg:leading-tight">
                Unanswered
              </p>
              <p className="mt-2 font-mono text-sm text-[#5c6570]">9:41 AM · Incoming</p>
              <p className="mt-4 text-base leading-relaxed text-[#3d4652] sm:text-lg">
                Customer needed help now.
              </p>
            </article>
          </RevealOnView>

          <FlowArrow className="hidden self-center py-4 lg:flex lg:w-14 xl:w-16" />
          <div className="flex justify-center lg:hidden">
            <FlowArrow className="rotate-90 py-2" />
          </div>

          <RevealOnView delay={110} className="flex min-h-0 w-full flex-[1.15] flex-col">
            <article
              className={`flex flex-1 flex-col rounded-3xl border border-[#1a1f26]/10 bg-white/95 p-6 shadow-[0_28px_64px_-32px_rgba(12,17,24,0.5)] backdrop-blur-sm sm:p-7 lg:p-8 ${cardMotion}`}
            >
              <div className="flex items-center gap-3 text-[#c45c3e]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#c45c3e]/10 lg:h-12 lg:w-12">
                  <MessageSquare className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={2} aria-hidden />
                </span>
                <span className="font-heading text-xs font-semibold uppercase tracking-[0.14em] sm:text-sm">
                  Instant text-back
                </span>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:mt-7">
                <div className="ml-1 max-w-[94%] rounded-2xl rounded-tr-md bg-[#0c1118] px-4 py-3 text-base leading-snug text-white/95 sm:ml-2 sm:px-5 sm:py-3.5 sm:text-[0.95rem] lg:text-base">
                  Hi, we saw you called. What do you need help with today?
                </div>
                <div className="mr-1 ml-auto max-w-[90%] rounded-2xl rounded-tl-md border border-[#1a1f26]/10 bg-[#f6f1ea] px-4 py-3 text-base leading-snug text-[#1a1f26] sm:mr-2 sm:px-5 sm:py-3.5 sm:text-[0.95rem] lg:text-base">
                  AC won’t cool. Need someone today if possible.
                </div>
                <div className="ml-1 max-w-[94%] rounded-2xl rounded-tr-md bg-[#c45c3e] px-4 py-3 text-base leading-snug text-white sm:ml-2 sm:px-5 sm:py-3.5 sm:text-[0.95rem] lg:text-base">
                  Got it. What’s the best address for the visit?
                </div>
              </div>
            </article>
          </RevealOnView>

          <FlowArrow className="hidden self-center py-4 lg:flex lg:w-14 xl:w-16" />
          <div className="flex justify-center lg:hidden">
            <FlowArrow className="rotate-90 py-2" />
          </div>

          <RevealOnView delay={220} className="flex min-h-0 w-full flex-1 flex-col">
            <article
              className={`flex min-h-[220px] flex-1 flex-col rounded-3xl border border-[#1a1f26]/10 bg-[#0c1118] p-6 text-white shadow-[0_28px_64px_-32px_rgba(12,17,24,0.55)] sm:min-h-[240px] sm:p-7 lg:min-h-0 lg:p-8 ${cardMotion}`}
            >
              <div className="flex items-center gap-3 text-[#c45c3e]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 lg:h-12 lg:w-12">
                  <ClipboardList className="h-5 w-5 text-[#e8a090] lg:h-6 lg:w-6" strokeWidth={2} aria-hidden />
                </span>
                <span className="font-heading text-xs font-semibold uppercase tracking-[0.14em] text-white/90 sm:text-sm">
                  Lead ready
                </span>
              </div>
              <p className="mt-5 font-heading text-xl font-semibold tracking-tight text-white sm:text-2xl lg:text-[1.65rem] lg:leading-tight">
                Ready to call back
              </p>
              <dl className="mt-6 space-y-3 text-base sm:text-[0.95rem] lg:text-base">
                <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                  <dt className="text-white/50">Service</dt>
                  <dd className="text-right font-medium text-white/95">HVAC / AC repair</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                  <dt className="text-white/50">Urgency</dt>
                  <dd className="text-right font-medium text-amber-200/90">Today</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                  <dt className="text-white/50">Address</dt>
                  <dd className="text-right font-medium text-white/95">On file</dd>
                </div>
                <div className="flex justify-between gap-4 pt-1">
                  <dt className="text-white/50">Contact</dt>
                  <dd className="text-right font-mono text-sm text-white/80 sm:text-base">
                    +1 (555) 201-8843
                  </dd>
                </div>
              </dl>
            </article>
          </RevealOnView>
        </div>
      </div>
    </div>
  );
}
