-- SMS thread routing: conversations keyed by (business_id, caller_phone_normalized).
-- At most one active conversation per (business, caller) via partial unique index.
-- Idempotent inbound SMS via unique provider_message_sid.

-- 1) New columns (nullable for backfill)
alter table public.conversations
  add column if not exists business_id uuid references public.businesses (id) on delete cascade,
  add column if not exists caller_phone_normalized text,
  add column if not exists last_message_at timestamptz,
  add column if not exists stale_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists completion_reason text;

-- 2) Backfill from leads + latest message time
update public.conversations c
set
  business_id = l.business_id,
  caller_phone_normalized = l.caller_phone,
  last_message_at = coalesce(
    (select max(m.created_at) from public.messages m where m.conversation_id = c.id),
    c.updated_at
  )
from public.leads l
where c.lead_id = l.id
  and (c.business_id is null or c.caller_phone_normalized is null);

alter table public.conversations
  alter column business_id set not null,
  alter column caller_phone_normalized set not null;

-- Default last_message_at for any edge row
update public.conversations
set last_message_at = coalesce(last_message_at, updated_at, created_at)
where last_message_at is null;

alter table public.conversations
  alter column last_message_at set not null;

-- 3) Expand ai_state
alter table public.conversations drop constraint if exists conversations_ai_state_check;
alter table public.conversations
  add constraint conversations_ai_state_check
  check (ai_state in ('active', 'completed', 'stale', 'closed'));

create index if not exists idx_conversations_business_caller_lastmsg
  on public.conversations (business_id, caller_phone_normalized, last_message_at desc);

-- Enforces at most one active thread per business + caller (app also guards races).
create unique index if not exists conversations_one_active_per_business_caller
  on public.conversations (business_id, caller_phone_normalized)
  where ai_state = 'active';

-- 4) Inbound SMS idempotency (Twilio retries same MessageSid)
-- Drop duplicate rows for the same Twilio SID, keeping the earliest row.
delete from public.messages m
using public.messages m2
where m.provider_message_sid is not null
  and m.provider_message_sid = m2.provider_message_sid
  and m.id > m2.id;

create unique index if not exists messages_provider_message_sid_unique
  on public.messages (provider_message_sid)
  where provider_message_sid is not null;
