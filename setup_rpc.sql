-- RUN THIS IN YOUR SUPABASE SQL EDITOR

-- 1. Helper function to find shared conversations
create or replace function public.get_shared_conversation(user_id_1 uuid, user_id_2 uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  return (
    select m1.conversation_id
    from public.conversation_members m1
    join public.conversation_members m2 on m1.conversation_id = m2.conversation_id
    where m1.user_id = user_id_1
      and m2.user_id = user_id_2
    limit 1
  );
end;
$$;

-- 2. Function to get or create a conversation
create or replace function public.get_or_create_conversation(target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  curr_user_id uuid;
  conv_id uuid;
begin
  curr_user_id := auth.uid();
  if curr_user_id is null then
    raise exception 'Not authenticated';
  end if;

  conv_id := public.get_shared_conversation(curr_user_id, target_user_id);

  if conv_id is null then
    insert into public.conversations (updated_at)
    values (now())
    returning id into conv_id;

    insert into public.conversation_members (conversation_id, user_id)
    values (conv_id, curr_user_id), (conv_id, target_user_id);
  end if;

  return conv_id;
end;
$$;