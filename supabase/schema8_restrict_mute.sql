-- Migration: 008_user_restrictions_and_mutes
-- Creates tables for user restrictions (removing presence) and user mutes (suppressing notifications)

create table if not exists public.user_restrictions (
  restricter_id uuid not null references public.profiles(id) on delete cascade,
  restricted_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (restricter_id, restricted_id)
);

create index if not exists idx_user_restrictions_restricter on public.user_restrictions (restricter_id);
create index if not exists idx_user_restrictions_restricted on public.user_restrictions (restricted_id);

create table if not exists public.user_mutes (
  muter_id uuid not null references public.profiles(id) on delete cascade,
  muted_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (muter_id, muted_id)
);

create index if not exists idx_user_mutes_muter on public.user_mutes (muter_id);
create index if not exists idx_user_mutes_muted on public.user_mutes (muted_id);
