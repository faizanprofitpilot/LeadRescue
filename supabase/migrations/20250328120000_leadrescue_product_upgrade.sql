-- LeadRescue product upgrade: toll-free provisioning, verification, knowledge base, setup checklist, lead address fields

-- Businesses: primary category, setup checklist (JSON), remove reliance on niche in UI (column kept, always home_services in app)
alter table public.businesses
  add column if not exists primary_service_category text,
  add column if not exists setup_checklist jsonb not null default '{
    "business_info": false,
    "number_generated": false,
    "verification_submitted": false,
    "knowledge_base": false,
    "forwarding_acknowledged": false,
    "test_completed": false
  }'::jsonb;

comment on column public.businesses.setup_checklist is 'Onboarding progress flags for dashboard checklist UI';

-- Phone numbers: provisioning + toll-free line verification (customer-facing status)
alter table public.phone_numbers
  add column if not exists provisioning_status text not null default 'not_provisioned',
  add column if not exists phone_type text not null default 'toll_free',
  add column if not exists line_verification_status text not null default 'not_started',
  add column if not exists verification_submitted_at timestamptz,
  add column if not exists verification_approved_at timestamptz,
  add column if not exists provisioned_at timestamptz;

-- Existing manually linked numbers: treat as already provisioned
update public.phone_numbers
set
  provisioning_status = 'active',
  phone_type = coalesce(nullif(phone_type, ''), 'toll_free'),
  provisioned_at = coalesce(provisioned_at, created_at)
where twilio_sid is not null
  and phone_number is not null;

-- Leads: home service job location + category
alter table public.leads
  add column if not exists service_address text,
  add column if not exists service_city text,
  add column if not exists service_state text,
  add column if not exists service_postal_code text,
  add column if not exists service_category text,
  add column if not exists callback_notes text;

-- Toll-free verification (Trust Hub / carrier; Twilio adapter can populate provider_* later)
create table if not exists public.toll_free_verifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  phone_number_id uuid references public.phone_numbers (id) on delete set null,
  legal_business_name text,
  public_business_name text,
  business_type text,
  website text,
  business_email text,
  business_phone text,
  business_address_line_1 text,
  business_address_line_2 text,
  business_city text,
  business_state text,
  business_postal_code text,
  business_country text default 'US',
  registration_number text,
  use_case_description text,
  sample_message_1 text,
  sample_message_2 text,
  consent_description text,
  status text not null default 'not_started' check (status in (
    'not_started', 'draft', 'submitted', 'needs_changes', 'approved', 'rejected'
  )),
  provider_submission_id text,
  provider_response_payload jsonb,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint toll_free_verifications_business_id_key unique (business_id)
);

create index idx_toll_free_verifications_phone_number_id
  on public.toll_free_verifications (phone_number_id);

create trigger toll_free_verifications_updated_at
  before update on public.toll_free_verifications
  for each row execute function public.set_updated_at();

-- Knowledge base (one row per business)
create table if not exists public.business_knowledge_base (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  services_offered text,
  service_areas text,
  business_hours text,
  emergency_service_available boolean not null default false,
  excluded_jobs text,
  tone_guidance text,
  ai_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_knowledge_base_business_id_key unique (business_id)
);

create trigger business_knowledge_base_updated_at
  before update on public.business_knowledge_base
  for each row execute function public.set_updated_at();

-- RLS
alter table public.toll_free_verifications enable row level security;
alter table public.business_knowledge_base enable row level security;

create policy "Users can view own toll free verifications"
  on public.toll_free_verifications for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = toll_free_verifications.business_id and b.user_id = auth.uid()
    )
  );

create policy "Users can insert own toll free verifications"
  on public.toll_free_verifications for insert
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = toll_free_verifications.business_id and b.user_id = auth.uid()
    )
  );

create policy "Users can update own toll free verifications"
  on public.toll_free_verifications for update
  using (
    exists (
      select 1 from public.businesses b
      where b.id = toll_free_verifications.business_id and b.user_id = auth.uid()
    )
  );

create policy "Users can view own knowledge base"
  on public.business_knowledge_base for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_knowledge_base.business_id and b.user_id = auth.uid()
    )
  );

create policy "Users can insert own knowledge base"
  on public.business_knowledge_base for insert
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_knowledge_base.business_id and b.user_id = auth.uid()
    )
  );

create policy "Users can update own knowledge base"
  on public.business_knowledge_base for update
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_knowledge_base.business_id and b.user_id = auth.uid()
    )
  );
