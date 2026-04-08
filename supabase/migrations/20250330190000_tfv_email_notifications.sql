-- Track TFV status emails so we don't spam on dashboard refresh.
alter table public.toll_free_verifications
  add column if not exists status_email_last_sent_status text,
  add column if not exists status_email_sent_at timestamptz;

comment on column public.toll_free_verifications.status_email_last_sent_status is
  'Last toll-free verification status value we emailed to the owner (approved/needs_changes/rejected).';
comment on column public.toll_free_verifications.status_email_sent_at is
  'Timestamp of last toll-free verification status email sent to owner.';

