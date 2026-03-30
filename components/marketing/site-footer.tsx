"use client";

import Link from "next/link";
import { RevealOnView } from "@/components/marketing/reveal-on-view";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0c1118] py-10 text-white/60">
      <RevealOnView className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm">
          © {new Date().getFullYear()} LeadRescue. Missed-call recovery for home service
          businesses.
        </p>
        <div className="flex gap-6 text-sm">
          <Link href="/login" className="hover:text-white">
            Sign in
          </Link>
          <Link href="/signup" className="hover:text-white">
            Sign up
          </Link>
        </div>
      </RevealOnView>
    </footer>
  );
}
