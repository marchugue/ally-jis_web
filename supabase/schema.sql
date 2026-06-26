-- Supabase schema for Ally-jis chat
-- Run this in the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  department text,
  course text,
  year_level text,
  interests text[],
  organizations text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Lookup tables (organizations, departments, courses)
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references public.departments(id) on delete cascade,
  name text not null,
  sort_order integer default 0,
  created_at timestamptz default now(),
  unique (department_id, name)
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create index if not exists courses_department_id_idx on public.courses (department_id);

-- Interests lookup table
create table if not exists public.interests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  color text not null,
  sort_order integer default 0,
  created_at timestamptz default now(),
  unique (category, name)
);

create index if not exists interests_category_idx on public.interests (category);

-- Seed lookup data
insert into public.departments (name, sort_order) values
  ('College of Computer Studies', 1),
  ('College of Education', 2),
  ('College of Industrial Technology', 3),
  ('College of Engineering', 4)
on conflict (name) do nothing;

insert into public.courses (department_id, name, sort_order) values
  ((select id from public.departments where name = 'College of Computer Studies'), 'Information Technology', 1),
  ((select id from public.departments where name = 'College of Computer Studies'), 'Information System', 2),
  ((select id from public.departments where name = 'College of Education'), 'Technical Vocational Teacher Education', 1),
  ((select id from public.departments where name = 'College of Industrial Technology'), 'Automotive', 1),
  ((select id from public.departments where name = 'College of Industrial Technology'), 'Architectural Drafting', 2),
  ((select id from public.departments where name = 'College of Industrial Technology'), 'Computer Technology', 3),
  ((select id from public.departments where name = 'College of Industrial Technology'), 'Culinary', 4),
  ((select id from public.departments where name = 'College of Industrial Technology'), 'Electrical', 5),
  ((select id from public.departments where name = 'College of Industrial Technology'), 'Electronics', 6),
  ((select id from public.departments where name = 'College of Industrial Technology'), 'Mechanical Technology', 7),
  ((select id from public.departments where name = 'College of Engineering'), 'Computer Engineering', 1),
  ((select id from public.departments where name = 'College of Engineering'), 'Electronics Engineering', 2)
on conflict (department_id, name) do nothing;

insert into public.interests (name, category, color, sort_order) values
  ('Coding', 'Technology', 'blue', 1),
  ('Web Design', 'Technology', 'blue', 2),
  ('AI & ML', 'Technology', 'blue', 3),
  ('Cybersecurity', 'Technology', 'blue', 4),
  ('Game Dev', 'Technology', 'blue', 5),
  ('Robotics', 'Technology', 'blue', 6),
  ('Photography', 'Arts', 'pink', 1),
  ('Drawing', 'Arts', 'pink', 2),
  ('Music', 'Arts', 'pink', 3),
  ('Dancing', 'Arts', 'pink', 4),
  ('Filmmaking', 'Arts', 'pink', 5),
  ('Creative Writing', 'Arts', 'pink', 6),
  ('Hiking', 'Nature', 'green', 1),
  ('Environment', 'Nature', 'green', 2),
  ('Gardening', 'Nature', 'green', 3),
  ('Camping', 'Nature', 'green', 4),
  ('Bird Watching', 'Nature', 'green', 5),
  ('Basketball', 'Sports', 'orange', 1),
  ('Volleyball', 'Sports', 'orange', 2),
  ('Swimming', 'Sports', 'orange', 3),
  ('Badminton', 'Sports', 'orange', 4),
  ('Football', 'Sports', 'orange', 5),
  ('Fitness', 'Sports', 'orange', 6),
  ('Community Service', 'Leadership', 'purple', 1),
  ('Student Gov', 'Leadership', 'purple', 2),
  ('Volunteering', 'Leadership', 'purple', 3),
  ('Debate', 'Leadership', 'purple', 4),
  ('Public Speaking', 'Leadership', 'purple', 5),
  ('Cooking', 'Lifestyle', 'amber', 1),
  ('Reading', 'Lifestyle', 'amber', 2),
  ('Travel', 'Lifestyle', 'amber', 3),
  ('Anime', 'Lifestyle', 'amber', 4),
  ('Gaming', 'Lifestyle', 'amber', 5),
  ('Fashion', 'Lifestyle', 'amber', 6)
on conflict (category, name) do nothing;

insert into public.organizations (name, sort_order) values
  ('Artisan''s Society', 1),
  ('Adventist Ministry College and University Students'' Excelsior', 2),
  ('Automotive Technology Society', 3),
  ('CHMSU-A Kabanda', 4),
  ('CHMSU-Alijis Performing Arts', 5),
  ('Circle of Peer Facilitators', 6),
  ('Computer Technology Society', 7),
  ('CHMSU Alijis Vocals', 8),
  ('CHMSU Python Esports Club', 9),
  ('CHMSU University Student Government', 10),
  ('CHMSUans Red Cross Youth Council', 11),
  ('D'' Culinarianz', 12),
  ('D'' Machinist', 13),
  ('Electronics and Communication Technology Society', 14),
  ('Future Technical Educators'' Society', 15),
  ('Information Systems Society', 16),
  ('Information Technology Society', 17),
  ('Institute of Computer Engineers of the Philippines, Student Edition CHMSU Alijis', 18),
  ('Institute of Electronics Engineers of the Philippines-Negros Occidental Student Chapter CHMSU-Alijis', 19),
  ('Integrated Institute of Electrical Student Society', 20),
  ('Junior Safety Officer of Negros Occidental', 21),
  ('New Life Apostolic Campus Ministries', 22),
  ('Research Enthusiasts CHMSU-Alijis', 23),
  ('Philippine Institute of Cyber Security Professionals'' Junior - CHMSU-A', 24),
  ('United Seniors Organization', 25),
  ('Unsullied Frisbee Club', 26),
  ('The Technopacer', 27),
  ('Youth Movers'' Movement', 28)
on conflict (name) do nothing;

-- Conversations
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User Interactions (Matches / Rejects)
create table if not exists public.user_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'rejected')),
  accepted_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, target_user_id)
);

-- Ensure the constraint is correct even if the table already existed
do $$
begin
  alter table public.user_interactions 
  drop constraint if exists user_interactions_status_check;
  
  alter table public.user_interactions 
  add constraint user_interactions_status_check 
  check (status in ('pending', 'accepted', 'rejected'));
exception
  when others then null;
end $$;

-- Ensure accepted_at exists even if table already existed
do $$
begin
  alter table public.user_interactions add column if not exists accepted_at timestamptz;
exception
  when others then null;
end $$;

-- Normalize legacy status value 'connected' to 'accepted'
create or replace function public.normalize_user_interaction_status()
returns trigger as $$
begin
  if new.status = 'connected' then
    new.status := 'accepted';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists normalize_user_interaction_status on public.user_interactions;
create trigger normalize_user_interaction_status
before insert or update on public.user_interactions
for each row execute function public.normalize_user_interaction_status();

create index if not exists user_interactions_user_id_idx on public.user_interactions (user_id);
create index if not exists user_interactions_target_user_id_idx on public.user_interactions (target_user_id);

-- Conversation members
create table if not exists public.conversation_members (
  conversation_id uuid references public.conversations (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  last_read_at timestamptz,
  created_at timestamptz default now(),
  primary key (conversation_id, user_id)
);

create index if not exists conversation_members_user_id_idx on public.conversation_members (user_id);

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete cascade,
  content text,
  image_url text,
  created_at timestamptz default now(),
  constraint messages_content_or_image check (content is not null or image_url is not null)
);

create index if not exists messages_conversation_id_idx on public.messages (conversation_id);
create index if not exists messages_created_at_idx on public.messages (created_at);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  description text,
  from_user_id uuid references public.profiles (id) on delete set null,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists notifications_created_at_idx on public.notifications (created_at);

-- Updated-at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_conversations_updated_at on public.conversations;
create trigger set_conversations_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    username,
    full_name,
    avatar_url,
    bio,
    department,
    course,
    year_level,
    interests,
    organizations
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'bio',
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'course',
    new.raw_user_meta_data->>'year_level',
    coalesce(
      (select array_agg(value::text)
       from jsonb_array_elements_text(coalesce(new.raw_user_meta_data->'interests', '[]'::jsonb)) as t(value)),
      '{}'::text[]
    ),
    coalesce(
      (select array_agg(value::text)
       from jsonb_array_elements_text(coalesce(new.raw_user_meta_data->'organizations', '[]'::jsonb)) as t(value)),
      '{}'::text[]
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Helper to check conversation membership without RLS recursion
create or replace function public.is_conversation_member(conv_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.conversation_members
    where conversation_id = conv_id
      and user_id = auth.uid()
  );
end;
$$;

-- Function to find a shared conversation between two users bypassing RLS
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

-- Function to get or create a conversation between the current user and another user
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

-- Robust function to accept a connection request and setup everything
create or replace function public.accept_connection(requester_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  curr_user_id uuid;
  conv_id uuid;
  accepted_time timestamptz;
begin
  curr_user_id := auth.uid();
  if curr_user_id is null then
    raise exception 'Not authenticated';
  end if;

  accepted_time := now();

  -- 1. Update interactions for both sides
  update public.user_interactions
  set status = 'accepted', accepted_at = accepted_time
  where user_id = requester_id and target_user_id = curr_user_id;

  insert into public.user_interactions (user_id, target_user_id, status, accepted_at)
  values (curr_user_id, requester_id, 'accepted', accepted_time)
  on conflict (user_id, target_user_id) do update
  set status = 'accepted', accepted_at = accepted_time;

  -- 2. Find or create conversation
  conv_id := public.get_shared_conversation(curr_user_id, requester_id);

  if conv_id is null then
    insert into public.conversations (created_at, updated_at)
    values (accepted_time, accepted_time)
    returning id into conv_id;
  else
    update public.conversations set updated_at = accepted_time where id = conv_id;
  end if;

  -- 3. Add members to conversation
  insert into public.conversation_members (conversation_id, user_id)
  values (conv_id, curr_user_id), (conv_id, requester_id)
  on conflict (conversation_id, user_id) do nothing;

  -- 4. Create notification for the requester
  insert into public.notifications (user_id, type, title, description, from_user_id)
  values (
    requester_id,
    'accepted',
    'Request Accepted!',
    'Your connection request was accepted. You can now message each other.',
    curr_user_id
  );

  return json_build_object('conversationId', conv_id);
end;
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.courses enable row level security;
alter table public.organizations enable row level security;
alter table public.interests enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.user_interactions enable row level security;

-- Profiles policies
drop policy if exists "Profiles are readable by authenticated users" on public.profiles;
create policy "Profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- Lookup policies
drop policy if exists "Public can read departments" on public.departments;
create policy "Public can read departments"
  on public.departments for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can read courses" on public.courses;
create policy "Public can read courses"
  on public.courses for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can read organizations" on public.organizations;
create policy "Public can read organizations"
  on public.organizations for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can read interests" on public.interests;
create policy "Public can read interests"
  on public.interests for select
  to anon, authenticated
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

-- Conversations policies
drop policy if exists "Members can view conversations" on public.conversations;
create policy "Members can view conversations"
  on public.conversations for select
  to authenticated
  using (public.is_conversation_member(conversations.id));

drop policy if exists "Authenticated users can create conversations" on public.conversations;
create policy "Authenticated users can create conversations"
  on public.conversations for insert
  to authenticated
  with check (true);

drop policy if exists "Members can update conversations" on public.conversations;
create policy "Members can update conversations"
  on public.conversations for update
  to authenticated
  using (public.is_conversation_member(conversations.id));

-- Conversation members policies
drop policy if exists "Members can view conversation members" on public.conversation_members;
create policy "Members can view conversation members"
  on public.conversation_members for select
  to authenticated
  using (public.is_conversation_member(conversation_id));

drop policy if exists "Users can add members to conversations" on public.conversation_members;
create policy "Users can add members to conversations"
  on public.conversation_members for insert
  to authenticated
  with check (
    user_id = auth.uid() 
    or public.is_conversation_member(conversation_id)
    or exists (
      select 1 from public.user_interactions i
      where (i.user_id = auth.uid() and i.target_user_id = conversation_members.user_id and i.status = 'accepted')
      or (i.target_user_id = auth.uid() and i.user_id = conversation_members.user_id and i.status = 'accepted')
    )
  );

drop policy if exists "Members can update membership" on public.conversation_members;
create policy "Members can update membership"
  on public.conversation_members for update
  to authenticated
  using (public.is_conversation_member(conversation_id))
  with check (public.is_conversation_member(conversation_id));

-- Messages policies
drop policy if exists "Members can read messages" on public.messages;
create policy "Members can read messages"
  on public.messages for select
  to authenticated
  using (public.is_conversation_member(messages.conversation_id));

drop policy if exists "Members can send messages" on public.messages;
create policy "Members can send messages"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_conversation_member(messages.conversation_id)
  );

drop policy if exists "Users can delete their own messages" on public.messages;
create policy "Users can delete their own messages"
  on public.messages for delete
  to authenticated
  using (sender_id = auth.uid());

-- User Interactions policies
drop policy if exists "Users can view their own interactions" on public.user_interactions;
create policy "Users can view their own interactions"
  on public.user_interactions for select
  to authenticated
  using (user_id = auth.uid() or target_user_id = auth.uid());

drop policy if exists "Users can create interactions" on public.user_interactions;
create policy "Users can create interactions"
  on public.user_interactions for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can update interactions" on public.user_interactions;
create policy "Users can update interactions"
  on public.user_interactions for update
  to authenticated
  using (user_id = auth.uid() or target_user_id = auth.uid())
  with check (user_id = auth.uid() or target_user_id = auth.uid());

-- Notifications policies
drop policy if exists "Users can read their notifications" on public.notifications;
create policy "Users can read their notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can update their notifications" on public.notifications;
create policy "Users can update their notifications"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can insert their notifications" on public.notifications;
create policy "Users can insert their notifications"
  on public.notifications for insert
  to authenticated
  with check (from_user_id = auth.uid() or user_id = auth.uid());

-- Realtime for messages
do $$
begin
  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime'
      and c.relname = 'messages'
      and c.relnamespace = 'public'::regnamespace
  ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;
end $$;

-- Realtime for notifications
do $$
begin
  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime'
      and c.relname = 'notifications'
      and c.relnamespace = 'public'::regnamespace
  ) then
    execute 'alter publication supabase_realtime add table public.notifications';
  end if;
end $$;

-- Storage bucket for chat media
insert into storage.buckets (id, name, public)
values ('chat-media', 'chat-media', true)
on conflict (id) do nothing;

-- Storage bucket for profile photos
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

-- Matching Function
create or replace function public.get_matches(user_id uuid)
returns table (
  profile_id uuid,
  shared_interests text[],
  match_percentage float
)
language plpgsql
security definer
as $$
declare
  user_interests text[];
begin
  -- Get the interests of the target user
  select interests into user_interests from public.profiles where id = user_id;

  return query
  select
    p.id as profile_id,
    array(
      select unnest(p.interests)
      intersect
      select unnest(user_interests)
    ) as shared_interests,
    case
      when array_length(user_interests, 1) > 0 then
        (array_length(array(
          select unnest(p.interests)
          intersect
          select unnest(user_interests)
        ), 1)::float / array_length(user_interests, 1)::float) * 100
      else 0
    end as match_percentage
  from public.profiles p
  where p.id != user_id
  order by match_percentage desc;
end;
$$;
