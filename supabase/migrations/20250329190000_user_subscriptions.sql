-- Paid access: one subscription row per auth user. App enforces active status before dashboard use.

create table public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_slug text not null default 'monthly_49',
  status text not null default 'inactive'
    check (status in ('active', 'inactive', 'past_due', 'canceled')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_subscriptions_user_id_key unique (user_id)
);

create index idx_user_subscriptions_user_id on public.user_subscriptions (user_id);
create index idx_user_subscriptions_status on public.user_subscriptions (status);

create trigger user_subscriptions_updated_at
  before update on public.user_subscriptions
  for each row execute function public.set_updated_at();

alter table public.user_subscriptions enable row level security;

create policy "Users can read own subscription"
  on public.user_subscriptions for select
  using (auth.uid() = user_id);

-- No insert/update/delete for authenticated clients; grants run in SQL editor (postgres) or service role.
