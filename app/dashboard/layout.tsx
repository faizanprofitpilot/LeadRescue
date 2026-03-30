import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { userHasActivePaidPlan } from "@/lib/dashboard/subscription";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const subscriptionActive = await userHasActivePaidPlan();

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav subscriptionActive={subscriptionActive} />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
