-- Public HTTPS URLs proving opt-in workflow (Twilio TFV required field)
alter table public.toll_free_verifications
  add column if not exists opt_in_image_urls jsonb not null default '[]'::jsonb;
