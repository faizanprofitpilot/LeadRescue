import { createClient } from "@/lib/supabase/server";

export type UserSubscriptionRow = {
  user_id: string;
  plan_slug: string;
  status: string;
  current_period_end: string | null;
};

/**
 * Active paid access: row exists, status active, and period not ended.
 * Absent row = no access (hard paywall).
 */
export function isSubscriptionActive(row: UserSubscriptionRow | null): boolean {
  if (!row) return false;
  if (row.status !== "active") return false;
  if (row.current_period_end) {
    const end = new Date(row.current_period_end).getTime();
    if (!Number.isNaN(end) && end <= Date.now()) return false;
  }
  return true;
}

export async function getSubscriptionForUser(): Promise<UserSubscriptionRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("user_id, plan_slug, status, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data as UserSubscriptionRow;
}

export async function userHasActivePaidPlan(): Promise<boolean> {
  const row = await getSubscriptionForUser();
  return isSubscriptionActive(row);
}
