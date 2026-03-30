import Link from "next/link";
import { BenefitGridSection } from "@/components/marketing/benefit-grid-section";
import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { HeroProductVisual } from "@/components/marketing/hero-product-visual";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { TradesStrip } from "@/components/marketing/trades-strip";
import { ValueSection } from "@/components/marketing/value-section";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f6f1ea] text-[#1a1f26]">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="lr-hero-glow-pulse pointer-events-none absolute inset-0 opacity-[0.5]"
            aria-hidden
            style={{
              backgroundImage:
                "radial-gradient(880px 480px at 12% 8%, rgba(196, 92, 62, 0.28), transparent 58%), radial-gradient(720px 400px at 92% 18%, rgba(12, 17, 24, 0.14), transparent 52%), radial-gradient(560px 360px at 48% 100%, rgba(196, 92, 62, 0.1), transparent 48%)",
            }}
          />
          <div className="relative pb-16 pt-16 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-24">
            <div className="lr-hero-stagger mx-auto max-w-6xl px-4 text-center sm:px-6">
              <p className="font-heading text-sm font-semibold tracking-[0.1em] text-[#c45c3e] uppercase">
                Missed-call revenue recovery
              </p>
              <h1 className="font-heading mx-auto mt-10 max-w-[min(100%,56rem)] text-4xl font-bold leading-[1.08] tracking-tight sm:mt-12 sm:text-5xl sm:leading-[1.06] lg:mt-14 lg:text-[2.875rem] lg:leading-[1.05] xl:text-[3.25rem] xl:leading-[1.05]">
                <span className="block">Every missed call is a lost job.</span>
                <span className="mt-2.5 block text-[#1a1f26] sm:mt-3">
                  LeadRescue turns them into booked work.
                </span>
              </h1>
              <p className="mx-auto mt-14 max-w-[37.5rem] text-lg leading-relaxed text-[#5c6570] sm:mt-16 sm:text-xl">
                When you miss a call, LeadRescue texts the customer instantly and sends you a
                ready-to-call job with all the details.
              </p>
              <div className="mt-11 flex flex-col items-center justify-center gap-3 sm:mt-12 sm:flex-row sm:flex-wrap">
                <Link
                  href="/signup"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-12 w-full justify-center rounded-full bg-[#c45c3e] px-8 text-base text-white transition-[transform,box-shadow,background-color] duration-200 ease-out hover:bg-[#b04f34] hover:shadow-md active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 sm:w-auto",
                  )}
                >
                  Start recovering leads
                </Link>
                <a
                  href="#how-it-works"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "h-12 w-full justify-center rounded-full border-[#1a1f26]/20 bg-white/70 px-8 text-base text-[#1a1f26] backdrop-blur-sm transition-[transform,background-color,box-shadow] duration-200 ease-out hover:bg-white/90 hover:shadow-sm active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 sm:w-auto",
                  )}
                >
                  How it works
                </a>
              </div>
              <p className="mx-auto mt-8 max-w-[37.5rem] text-sm leading-relaxed text-[#5c6570]">
                Not a phone system replacement. LeadRescue only handles missed or unanswered
                calls.
              </p>
            </div>

            <div className="mt-16 w-full sm:mt-20 lg:mt-24">
              <div className="mx-auto max-w-7xl px-4 sm:max-w-[85rem] sm:px-6 lg:px-8">
                <HeroProductVisual />
              </div>
            </div>

            <div className="mx-auto mt-12 max-w-6xl px-4 sm:mt-14 sm:px-6">
              <TradesStrip />
            </div>
          </div>
        </section>

        <HowItWorksSection />
        <ValueSection />
        <BenefitGridSection />
        <PricingSection />
        <FinalCtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
