import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

const links = [
  { href: "/dashboard/leads", label: "Leads" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/dashboard/onboarding", label: "Setup" },
];

export function DashboardNav({
  subscriptionActive = true,
}: {
  subscriptionActive?: boolean;
}) {
  const logoHref = subscriptionActive ? "/dashboard/leads" : "/dashboard/subscribe";

  return (
    <header className="overflow-visible border-b bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 overflow-visible px-4 sm:px-6">
        <BrandLogo href={logoHref} heightClass="h-14" />
        <div className="flex items-center gap-2">
          {subscriptionActive ? (
            <nav className="flex items-center gap-4 text-sm">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          ) : null}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
