import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

const navLinkClass =
  "shrink-0 text-xs font-medium text-white/70 transition-colors hover:text-white sm:text-sm";

export function SiteHeader() {
  return (
    <header className="lr-anim-header sticky top-0 z-50 overflow-visible border-b border-white/10 bg-[#0c1118]/95 backdrop-blur-md supports-[backdrop-filter]:bg-[#0c1118]/88">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 overflow-visible px-3 sm:gap-4 sm:px-6">
        <div className="shrink-0 overflow-visible">
          <BrandLogo
            href="/"
            heightClass="h-[4.5rem] sm:h-20"
            imageClassName="max-w-[min(70vw,520px)] sm:max-w-[min(48vw,520px)]"
            priority
          />
        </div>
        <nav
          className="flex min-w-0 flex-1 items-center justify-center gap-3 overflow-x-auto whitespace-nowrap py-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-5 md:gap-7 lg:gap-8 [&::-webkit-scrollbar]:hidden"
          aria-label="Page sections"
        >
          <Link href="/#how-it-works" className={navLinkClass}>
            How it works
          </Link>
          <Link href="/#value" className={navLinkClass}>
            Why it matters
          </Link>
          <Link href="/#features" className={navLinkClass}>
            Features
          </Link>
          <Link href="/#pricing" className={navLinkClass}>
            Pricing
          </Link>
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-white/80 hover:bg-white/10 hover:text-white",
            )}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "bg-[#c45c3e] text-white hover:bg-[#d66d4f]",
            )}
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
