-- ============================================================================
-- Message replies
-- Run after schema.sql
-- ============================================================================

alter table public.messages
  add column if not exists reply_to_message_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'messages_reply_to_message_id_fkey'
  ) then
    alter table public.messages
      add constraint messages_reply_to_message_id_fkey
      foreign key (reply_to_message_id)
      references public.messages (id)
      on delete set null;
  end if;
end $$;

create index if not exists messages_reply_to_message_id_idx
  on public.messages (reply_to_message_id);
