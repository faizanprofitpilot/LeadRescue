-- Run once in Supabase SQL Editor if you see:
-- "Could not find the 'opt_in_image_urls' column ... in the schema cache"
-- (or the same for tfv_last_polled_at). Safe to re-run.

alter table public.toll_free_verifications
  add column if not exists opt_in_image_urls jsonb not null default '[]'::jsonb;

alter table public.toll_free_verifications
  add column if not exists tfv_last_polled_at timestamptz;

comment on column public.toll_free_verifications.opt_in_image_urls is
  'Optional stored proof URLs; TFV payload uses env/default when empty.';
comment on column public.toll_free_verifications.tfv_last_polled_at is
  'Last successful Twilio TFV fetch; throttles dashboard polling.';
