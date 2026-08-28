-- ============================================================================
-- Message reactions
-- Run after schema.sql
-- ============================================================================

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index if not exists message_reactions_message_id_idx
  on public.message_reactions (message_id);
