-- Throttle Twilio TFV status polls (dashboard sync) without relying on per-instance memory.
alter table public.toll_free_verifications
  add column if not exists tfv_last_polled_at timestamptz;

comment on column public.toll_free_verifications.tfv_last_polled_at is
  'Last successful Twilio toll-free verification fetch; used to avoid polling on every dashboard request.';
