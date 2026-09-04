-- ────────────────────────────────────────────────────────────────────────────
-- OTP Email Confirmation Migration
-- Run this in the Supabase SQL editor AFTER schema.sql.
-- ────────────────────────────────────────────────────────────────────────────

-- 1. New profile columns for email type & student verification
do $$
begin
  alter table public.profiles add column if not exists email_type text default 'unknown';
  alter table public.profiles add column if not exists chmsu_auto_verified boolean default false;
  alter table public.profiles add column if not exists student_id_url text;
  alter table public.profiles add column if not exists pending_student_verification boolean default false;
  alter table public.profiles add column if not exists student_verification_status text default 'none';
  -- 'none' | 'pending' | 'approved' | 'rejected'
exception
  when others then null;
end $$;

-- 2. email_otps table — stores one active OTP per user
create table if not exists public.email_otps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  email text not null,
  otp_hash text not null,        -- bcrypt hash of the 6-digit code
  expires_at timestamptz not null,
  resend_count integer default 0,
  last_resent_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- One OTP row per user (upserted on each generate)
create index if not exists email_otps_user_id_idx on public.email_otps (user_id);

-- Disable RLS — accessed only via service_role from the backend
alter table public.email_otps disable row level security;

-- 3. updated_at trigger for email_otps
drop trigger if exists set_email_otps_updated_at on public.email_otps;
create trigger set_email_otps_updated_at
before update on public.email_otps
for each row execute function public.set_updated_at();
