  -- ============================================================
  -- Newsfeed: posts, likes, comments (with comment_likes)
  -- Run this in the Supabase SQL editor, after your existing schema.
  -- ============================================================

  -- Posts
  create table if not exists public.posts (
    id uuid primary key default gen_random_uuid(),
    author_id uuid not null references public.profiles (id) on delete cascade,
    content text not null,
    audience text not null default 'public' check (audience in ('public', 'connections')),
    likes_count integer not null default 0,
    comments_count integer not null default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );

  create index if not exists posts_author_id_idx on public.posts (author_id);
  create index if not exists posts_created_at_idx on public.posts (created_at desc);

  drop trigger if exists set_posts_updated_at on public.posts;
  create trigger set_posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

  -- Post likes
  create table if not exists public.post_likes (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null references public.posts (id) on delete cascade,
    user_id uuid not null references public.profiles (id) on delete cascade,
    created_at timestamptz default now(),
    unique (post_id, user_id)
  );

  create index if not exists post_likes_post_id_idx on public.post_likes (post_id);
  create index if not exists post_likes_user_id_idx on public.post_likes (user_id);

  -- Post comments (flat + one level of replies)
  create table if not exists public.post_comments (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null references public.posts (id) on delete cascade,
    author_id uuid not null references public.profiles (id) on delete cascade,
    parent_comment_id uuid references public.post_comments (id) on delete cascade,
    content text not null,
    likes_count integer not null default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );

  create index if not exists post_comments_post_id_idx on public.post_comments (post_id);
  create index if not exists post_comments_author_id_idx on public.post_comments (author_id);
  create index if not exists post_comments_parent_comment_id_idx on public.post_comments (parent_comment_id);

  drop trigger if exists set_post_comments_updated_at on public.post_comments;
  create trigger set_post_comments_updated_at
  before update on public.post_comments
  for each row execute function public.set_updated_at();

  -- Enforce only one level of nesting: a reply's parent must itself be a top-level comment
  create or replace function public.enforce_single_level_reply()
  returns trigger as $$
  declare
    parent_depth uuid;
  begin
    if new.parent_comment_id is not null then
      select parent_comment_id into parent_depth
      from public.post_comments
      where id = new.parent_comment_id;

      if parent_depth is not null then
        raise exception 'Replies can only be one level deep';
      end if;
    end if;
    return new;
  end;
  $$ language plpgsql;

  drop trigger if exists enforce_single_level_reply on public.post_comments;
  create trigger enforce_single_level_reply
  before insert or update on public.post_comments
  for each row execute function public.enforce_single_level_reply();

  -- Comment likes
  create table if not exists public.comment_likes (
    id uuid primary key default gen_random_uuid(),
    comment_id uuid not null references public.post_comments (id) on delete cascade,
    user_id uuid not null references public.profiles (id) on delete cascade,
    created_at timestamptz default now(),
    unique (comment_id, user_id)
  );

  create index if not exists comment_likes_comment_id_idx on public.comment_likes (comment_id);
  create index if not exists comment_likes_user_id_idx on public.comment_likes (user_id);

  -- ============================================================
  -- Counter maintenance triggers
  -- ============================================================

  create or replace function public.increment_post_likes_count()
  returns trigger as $$
  begin
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
    return new;
  end;
  $$ language plpgsql;

  create or replace function public.decrement_post_likes_count()
  returns trigger as $$
  begin
    update public.posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id;
    return old;
  end;
  $$ language plpgsql;

  drop trigger if exists on_post_like_insert on public.post_likes;
  create trigger on_post_like_insert
  after insert on public.post_likes
  for each row execute function public.increment_post_likes_count();

  drop trigger if exists on_post_like_delete on public.post_likes;
  create trigger on_post_like_delete
  after delete on public.post_likes
  for each row execute function public.decrement_post_likes_count();

  create or replace function public.increment_post_comments_count()
  returns trigger as $$
  begin
    update public.posts set comments_count = comments_count + 1 where id = new.post_id;
    return new;
  end;
  $$ language plpgsql;

  create or replace function public.decrement_post_comments_count()
  returns trigger as $$
  begin
    update public.posts set comments_count = greatest(comments_count - 1, 0) where id = old.post_id;
    return old;
  end;
  $$ language plpgsql;

  drop trigger if exists on_post_comment_insert on public.post_comments;
  create trigger on_post_comment_insert
  after insert on public.post_comments
  for each row execute function public.increment_post_comments_count();

  drop trigger if exists on_post_comment_delete on public.post_comments;
  create trigger on_post_comment_delete
  after delete on public.post_comments
  for each row execute function public.decrement_post_comments_count();

  create or replace function public.increment_comment_likes_count()
  returns trigger as $$
  begin
    update public.post_comments set likes_count = likes_count + 1 where id = new.comment_id;
    return new;
  end;
  $$ language plpgsql;

  create or replace function public.decrement_comment_likes_count()
  returns trigger as $$
  begin
    update public.post_comments set likes_count = greatest(likes_count - 1, 0) where id = old.comment_id;
    return old;
  end;
  $$ language plpgsql;

  drop trigger if exists on_comment_like_insert on public.comment_likes;
  create trigger on_comment_like_insert
  after insert on public.comment_likes
  for each row execute function public.increment_comment_likes_count();

  drop trigger if exists on_comment_like_delete on public.comment_likes;
  create trigger on_comment_like_delete
  after delete on public.comment_likes
  for each row execute function public.decrement_comment_likes_count();

  -- ============================================================
  -- Visibility helper: can current user see this post?
  -- (security definer so it can be used safely inside RLS without recursion)
  -- ============================================================

  create or replace function public.can_view_post(post_author_id uuid, post_audience text)
  returns boolean
  language plpgsql
  security definer
  set search_path = public
  as $$
  begin
    -- Author can always see their own post
    if post_author_id = auth.uid() then
      return true;
    end if;

    if post_audience = 'public' then
      return true;
    end if;

    -- connections-only: must have an accepted interaction either direction
    return exists (
      select 1 from public.user_interactions
      where status = 'accepted'
        and (
          (user_id = auth.uid() and target_user_id = post_author_id)
          or (user_id = post_author_id and target_user_id = auth.uid())
        )
    );
  end;
  $$;

  create or replace function public.can_view_post_by_id(p_post_id uuid)
  returns boolean
  language plpgsql
  security definer
  set search_path = public
  as $$
  declare
    v_author_id uuid;
    v_audience text;
  begin
    select author_id, audience into v_author_id, v_audience
    from public.posts
    where id = p_post_id;

    if v_author_id is null then
      return false;
    end if;

    return public.can_view_post(v_author_id, v_audience);
  end;
  $$;

  -- ============================================================
  -- RLS
  -- ============================================================

  alter table public.posts enable row level security;
  alter table public.post_likes enable row level security;
  alter table public.post_comments enable row level security;
  alter table public.comment_likes enable row level security;

  -- Posts policies
  drop policy if exists "Users can view visible posts" on public.posts;
  create policy "Users can view visible posts"
    on public.posts for select
    to authenticated
    using (public.can_view_post(author_id, audience));

  drop policy if exists "Users can create their own posts" on public.posts;
  create policy "Users can create their own posts"
    on public.posts for insert
    to authenticated
    with check (author_id = auth.uid());

  drop policy if exists "Users can update their own posts" on public.posts;
  create policy "Users can update their own posts"
    on public.posts for update
    to authenticated
    using (author_id = auth.uid())
    with check (author_id = auth.uid());

  drop policy if exists "Users can delete their own posts" on public.posts;
  create policy "Users can delete their own posts"
    on public.posts for delete
    to authenticated
    using (author_id = auth.uid());

  -- Post likes policies
  drop policy if exists "Users can view likes on visible posts" on public.post_likes;
  create policy "Users can view likes on visible posts"
    on public.post_likes for select
    to authenticated
    using (public.can_view_post_by_id(post_id));

  drop policy if exists "Users can like visible posts" on public.post_likes;
  create policy "Users can like visible posts"
    on public.post_likes for insert
    to authenticated
    with check (user_id = auth.uid() and public.can_view_post_by_id(post_id));

  drop policy if exists "Users can unlike their own likes" on public.post_likes;
  create policy "Users can unlike their own likes"
    on public.post_likes for delete
    to authenticated
    using (user_id = auth.uid());

  -- Post comments policies
  drop policy if exists "Users can view comments on visible posts" on public.post_comments;
  create policy "Users can view comments on visible posts"
    on public.post_comments for select
    to authenticated
    using (public.can_view_post_by_id(post_id));

  drop policy if exists "Users can comment on visible posts" on public.post_comments;
  create policy "Users can comment on visible posts"
    on public.post_comments for insert
    to authenticated
    with check (author_id = auth.uid() and public.can_view_post_by_id(post_id));

  drop policy if exists "Users can update their own comments" on public.post_comments;
  create policy "Users can update their own comments"
    on public.post_comments for update
    to authenticated
    using (author_id = auth.uid())
    with check (author_id = auth.uid());

  drop policy if exists "Users can delete their own comments" on public.post_comments;
  create policy "Users can delete their own comments"
    on public.post_comments for delete
    to authenticated
    using (author_id = auth.uid());

  -- Comment likes policies
  drop policy if exists "Users can view likes on visible comments" on public.comment_likes;
  create policy "Users can view likes on visible comments"
    on public.comment_likes for select
    to authenticated
    using (
      exists (
        select 1 from public.post_comments c
        where c.id = comment_likes.comment_id
        and public.can_view_post_by_id(c.post_id)
      )
    );

  drop policy if exists "Users can like comments on visible posts" on public.comment_likes;
  create policy "Users can like comments on visible posts"
    on public.comment_likes for insert
    to authenticated
    with check (
      user_id = auth.uid()
      and exists (
        select 1 from public.post_comments c
        where c.id = comment_likes.comment_id
        and public.can_view_post_by_id(c.post_id)
      )
    );

  drop policy if exists "Users can unlike their own comment likes" on public.comment_likes;
  create policy "Users can unlike their own comment likes"
    on public.comment_likes for delete
    to authenticated
    using (user_id = auth.uid());

  -- ============================================================
  -- Notifications on like / comment
  -- ============================================================

  create or replace function public.notify_on_post_like()
  returns trigger as $$
  declare
    v_post_author uuid;
  begin
    select author_id into v_post_author from public.posts where id = new.post_id;

    if v_post_author is not null and v_post_author != new.user_id then
      insert into public.notifications (user_id, type, title, description, from_user_id)
      values (
        v_post_author,
        'post_like',
        'New like on your post',
        'Someone liked your post.',
        new.user_id
      );
    end if;

    return new;
  end;
  $$ language plpgsql security definer set search_path = public;

  drop trigger if exists on_post_like_notify on public.post_likes;
  create trigger on_post_like_notify
  after insert on public.post_likes
  for each row execute function public.notify_on_post_like();

  create or replace function public.notify_on_post_comment()
  returns trigger as $$
  declare
    v_post_author uuid;
  begin
    select author_id into v_post_author from public.posts where id = new.post_id;

    if v_post_author is not null and v_post_author != new.author_id then
      insert into public.notifications (user_id, type, title, description, from_user_id)
      values (
        v_post_author,
        'post_comment',
        'New comment on your post',
        'Someone commented on your post.',
        new.author_id
      );
    end if;

    -- If this is a reply, also notify the parent comment's author
    if new.parent_comment_id is not null then
      declare
        v_parent_author uuid;
      begin
        select author_id into v_parent_author from public.post_comments where id = new.parent_comment_id;
        if v_parent_author is not null and v_parent_author != new.author_id then
          insert into public.notifications (user_id, type, title, description, from_user_id)
          values (
            v_parent_author,
            'comment_reply',
            'New reply to your comment',
            'Someone replied to your comment.',
            new.author_id
          );
        end if;
      end;
    end if;

    return new;
  end;
  $$ language plpgsql security definer set search_path = public;

  drop trigger if exists on_post_comment_notify on public.post_comments;
  create trigger on_post_comment_notify
  after insert on public.post_comments
  for each row execute function public.notify_on_post_comment();

  -- ============================================================
  -- Realtime
  -- ============================================================

  do $$
  begin
    if not exists (
      select 1
      from pg_publication_rel pr
      join pg_class c on c.oid = pr.prrelid
      join pg_publication p on p.oid = pr.prpubid
      where p.pubname = 'supabase_realtime'
        and c.relname = 'posts'
        and c.relnamespace = 'public'::regnamespace
    ) then
      execute 'alter publication supabase_realtime add table public.posts';
    end if;
  end $$;

  do $$
  begin
    if not exists (
      select 1
      from pg_publication_rel pr
      join pg_class c on c.oid = pr.prrelid
      join pg_publication p on p.oid = pr.prpubid
      where p.pubname = 'supabase_realtime'
        and c.relname = 'post_comments'
        and c.relnamespace = 'public'::regnamespace
    ) then
      execute 'alter publication supabase_realtime add table public.post_comments';
    end if;
  end $$;

  do $$
  begin
    if not exists (
      select 1
      from pg_publication_rel pr
      join pg_class c on c.oid = pr.prrelid
      join pg_publication p on p.oid = pr.prpubid
      where p.pubname = 'supabase_realtime'
        and c.relname = 'post_likes'
        and c.relnamespace = 'public'::regnamespace
    ) then
      execute 'alter publication supabase_realtime add table public.post_likes';
    end if;
  end $$;