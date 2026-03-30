import { requireBusiness } from "@/lib/dashboard/guards";
import { getDashboardContext } from "@/lib/dashboard/business";
import { SettingsForm } from "@/components/dashboard/settings-form";

export default async function SettingsPage() {
  await requireBusiness();
  const { business, phoneNumbers, knowledgeBase } = await getDashboardContext();

  if (!business) {
    return null;
  }

  const activePhone = phoneNumbers.find((p) => p.provisioning_status === "active");
  const leadRescueNumber = activePhone?.phone_number ?? null;

  return (
    <SettingsForm
      business={business}
      leadRescueNumber={leadRescueNumber}
      knowledgeBase={knowledgeBase}
    />
  );
}
