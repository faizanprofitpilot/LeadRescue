"use client";

import { RevealOnView } from "@/components/marketing/reveal-on-view";

const TRADES = [
  "HVAC",
  "Plumbing",
  "Roofing",
  "Electrical",
  "Garage door",
  "Pest control",
  "Landscaping",
  "Cleaning",
  "Handyman",
] as const;

export function TradesStrip() {
  return (
    <div className="border-t border-[#1a1f26]/10 pt-8">
      <RevealOnView>
        <p className="text-center font-heading text-sm font-semibold tracking-tight text-[#3d4652] sm:text-base">
          Built for home service businesses
        </p>
      </RevealOnView>
      <ul className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-2 sm:gap-x-4">
        {TRADES.map((t, i) => (
          <li key={t} className="list-none">
            <RevealOnView delay={40 + i * 35}>
              <span className="inline-block rounded-full border border-[#1a1f26]/10 bg-white/70 px-3 py-1 text-xs font-medium text-[#3d4652] shadow-sm backdrop-blur-sm transition-[transform,box-shadow] duration-200 ease-out motion-reduce:transition-none hover:-translate-y-px hover:shadow-md motion-reduce:hover:translate-y-0">
                {t}
              </span>
            </RevealOnView>
          </li>
        ))}
      </ul>
    </div>
  );
}
