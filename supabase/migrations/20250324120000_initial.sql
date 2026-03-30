-- LeadRescue initial schema

-- Businesses (one per auth user for MVP)
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  business_name text not null,
  niche text not null default 'home_services',
  owner_name text,
  owner_email text not null,
  owner_phone text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_user_id_key unique (user_id)
);

-- Twilio inbound numbers (source of truth for webhook lookup)
create table public.phone_numbers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  twilio_sid text,
  phone_number text not null,
  type text not null default 'leadrescue_inbound',
  verification_status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint phone_numbers_phone_number_key unique (phone_number)
);

create index idx_phone_numbers_phone_number on public.phone_numbers (phone_number);

-- Leads from missed calls + SMS capture
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  caller_phone text not null,
  caller_name text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  source text not null default 'missed_call',
  summary text,
  urgency text,
  appointment_timing text,
  vehicle_year text,
  vehicle_make text,
  vehicle_model text,
  issue_description text,
  drivable_status text,
  twilio_call_sid text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index leads_twilio_call_sid_unique
  on public.leads (twilio_call_sid)
  where twilio_call_sid is not null;

create index idx_leads_business_id on public.leads (business_id);
create index idx_leads_created_at on public.leads (created_at desc);

-- One conversation per lead (SMS thread)
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  ai_state text not null default 'active' check (ai_state in ('active', 'completed')),
  extracted_json jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  summary_email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_lead_id_key unique (lead_id)
);

create index idx_conversations_lead_id on public.conversations (lead_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  body text not null,
  provider_message_sid text,
  created_at timestamptz not null default now()
);

create index idx_messages_conversation_created on public.messages (conversation_id, created_at);

-- updated_at touch
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger businesses_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

create trigger leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- RLS
alter table public.businesses enable row level security;
alter table public.phone_numbers enable row level security;
alter table public.leads enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- businesses: own row only
create policy "Users can view own business"
  on public.businesses for select
  using (auth.uid() = user_id);

create policy "Users can insert own business"
  on public.businesses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own business"
  on public.businesses for update
  using (auth.uid() = user_id);

-- phone_numbers via business ownership
create policy "Users can view own phone numbers"
  on public.phone_numbers for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = phone_numbers.business_id and b.user_id = auth.uid()
    )
  );

create policy "Users can insert own phone numbers"
  on public.phone_numbers for insert
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = phone_numbers.business_id and b.user_id = auth.uid()
    )
  );

create policy "Users can update own phone numbers"
  on public.phone_numbers for update
  using (
    exists (
      select 1 from public.businesses b
      where b.id = phone_numbers.business_id and b.user_id = auth.uid()
    )
  );

create policy "Users can delete own phone numbers"
  on public.phone_numbers for delete
  using (
    exists (
      select 1 from public.businesses b
      where b.id = phone_numbers.business_id and b.user_id = auth.uid()
    )
  );

-- leads
create policy "Users can view own leads"
  on public.leads for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = leads.business_id and b.user_id = auth.uid()
    )
  );

create policy "Users can insert own leads"
  on public.leads for insert
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = leads.business_id and b.user_id = auth.uid()
    )
  );

create policy "Users can update own leads"
  on public.leads for update
  using (
    exists (
      select 1 from public.businesses b
      where b.id = leads.business_id and b.user_id = auth.uid()
    )
  );

-- conversations
create policy "Users can view own conversations"
  on public.conversations for select
  using (
    exists (
      select 1 from public.leads l
      join public.businesses b on b.id = l.business_id
      where l.id = conversations.lead_id and b.user_id = auth.uid()
    )
  );

create policy "Users can insert own conversations"
  on public.conversations for insert
  with check (
    exists (
      select 1 from public.leads l
      join public.businesses b on b.id = l.business_id
      where l.id = conversations.lead_id and b.user_id = auth.uid()
    )
  );

create policy "Users can update own conversations"
  on public.conversations for update
  using (
    exists (
      select 1 from public.leads l
      join public.businesses b on b.id = l.business_id
      where l.id = conversations.lead_id and b.user_id = auth.uid()
    )
  );

-- messages
create policy "Users can view own messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      join public.leads l on l.id = c.lead_id
      join public.businesses b on b.id = l.business_id
      where c.id = messages.conversation_id and b.user_id = auth.uid()
    )
  );

create policy "Users can insert own messages"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversations c
      join public.leads l on l.id = c.lead_id
      join public.businesses b on b.id = l.business_id
      where c.id = messages.conversation_id and b.user_id = auth.uid()
    )
  );
