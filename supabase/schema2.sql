-- ============================================================
-- Post media: up to 4 images per post.
-- Run this in the Supabase SQL editor, after newsfeed_schema.sql
-- (requires public.posts and public.can_view_post_by_id to exist).
-- ============================================================

-- ============================================================
-- Storage bucket (mirrors the chat-media bucket convention)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do nothing;

-- ============================================================
-- Table
-- ============================================================

create table if not exists public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  url text not null,
  position smallint not null default 0,
  created_at timestamptz default now(),

  constraint post_media_position_range check (position >= 0 and position <= 3)
);

create index if not exists post_media_post_id_idx on public.post_media (post_id);

-- At most 4 images per post, and no duplicate position within a post.
create unique index if not exists post_media_post_id_position_idx
  on public.post_media (post_id, position);

-- ============================================================
-- Enforce max 4 images per post at insert time
-- (the unique index on (post_id, position) already blocks more than
-- 4 since position is constrained to 0-3, but this gives a clean
-- application-level error instead of a constraint-violation 500 if
-- something ever inserts without going through the service layer)
-- ============================================================

create or replace function public.enforce_max_post_media()
returns trigger as $$
declare
  existing_count integer;
begin
  select count(*) into existing_count
  from public.post_media
  where post_id = new.post_id;

  if existing_count >= 4 then
    raise exception 'A post can have at most 4 images';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists enforce_max_post_media on public.post_media;
create trigger enforce_max_post_media
before insert on public.post_media
for each row execute function public.enforce_max_post_media();

-- ============================================================
-- RLS — visibility follows the parent post's visibility exactly,
-- reusing can_view_post_by_id() from newsfeed_schema.sql.
-- ============================================================

alter table public.post_media enable row level security;

drop policy if exists "Users can view media on visible posts" on public.post_media;
create policy "Users can view media on visible posts"
  on public.post_media for select
  to authenticated
  using (public.can_view_post_by_id(post_id));

-- Inserts/deletes happen via supabaseAdmin (service role) in the API,
-- same pattern as posts/comments, so no authenticated insert/delete
-- policy is needed here. If you ever let clients write directly,
-- add a policy that checks posts.author_id = auth.uid().

-- ============================================================
-- Realtime (optional — only needed if the feed UI subscribes live)
-- ============================================================

do $$
begin
  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime'
      and c.relname = 'post_media'
      and c.relnamespace = 'public'::regnamespace
  ) then
    execute 'alter publication supabase_realtime add table public.post_media';
  end if;
end $$;