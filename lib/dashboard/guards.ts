import { redirect } from "next/navigation";
import { getBusinessForUser } from "@/lib/dashboard/business";

/** Business profile exists (user completed at least initial setup). */
export async function requireBusiness() {
  const { business } = await getBusinessForUser();
  if (!business) {
    redirect("/dashboard/onboarding");
  }
  return business;
}

/** @deprecated Use requireBusiness; kept for gradual migration */
export async function requireBusinessOnboarded() {
  return requireBusiness();
}
