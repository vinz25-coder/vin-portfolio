begin;

create type public.guestbook_entry_type as enum ('discussion', 'review', 'reply');
create type public.guestbook_reaction_type as enum ('thumb', 'heart', 'fire', 'clap', 'rocket');
create type public.guestbook_report_reason as enum (
  'spam',
  'harassment',
  'irrelevant',
  'inappropriate',
  'other'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 120),
  avatar_url text,
  is_author boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete restrict,
  parent_id uuid references public.guestbook_entries (id) on delete restrict,
  root_id uuid references public.guestbook_entries (id) on delete restrict,
  entry_type public.guestbook_entry_type not null,
  depth smallint not null default 0 check (depth between 0 and 2),
  body text not null,
  rating smallint,
  image_path text,
  is_pinned boolean not null default false,
  is_hidden boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guestbook_entries_body_check check (
    deleted_at is not null
    or (char_length(btrim(body)) between 1 and 1000)
  ),
  constraint guestbook_entries_shape_check check (
    (
      parent_id is null
      and root_id is null
      and depth = 0
      and entry_type in ('discussion', 'review')
    )
    or (
      parent_id is not null
      and root_id is not null
      and depth in (1, 2)
      and entry_type = 'reply'
      and rating is null
      and not is_pinned
    )
  ),
  constraint guestbook_entries_rating_check check (
    deleted_at is not null
    or (entry_type = 'review' and rating between 1 and 5)
    or (entry_type <> 'review' and rating is null)
  ),
  constraint guestbook_entries_image_path_check check (
    image_path is null
    or (
      image_path !~ '(^|/)\.\.(/|$)'
      and lower(image_path) ~ '^[0-9a-f-]{36}/[^/].*\.(jpe?g|png|webp)$'
    )
  )
);

create table public.guestbook_reactions (
  entry_id uuid not null references public.guestbook_entries (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reaction_type public.guestbook_reaction_type not null,
  created_at timestamptz not null default now(),
  primary key (entry_id, user_id, reaction_type)
);

create table public.guestbook_mentions (
  entry_id uuid not null references public.guestbook_entries (id) on delete cascade,
  mentioned_user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (entry_id, mentioned_user_id)
);

create table public.guestbook_reports (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.guestbook_entries (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason public.guestbook_report_reason not null,
  note text check (note is null or char_length(note) between 1 and 500),
  created_at timestamptz not null default now(),
  unique (entry_id, reporter_id)
);

create table public.guestbook_visits (
  id bigint generated always as identity primary key,
  browser_hash bytea not null check (octet_length(browser_hash) = 32),
  visited_on date not null default ((now() at time zone 'Asia/Jakarta')::date),
  created_at timestamptz not null default now(),
  unique (browser_hash, visited_on)
);

create index guestbook_entries_root_feed_idx
  on public.guestbook_entries (is_hidden, is_pinned desc, created_at desc)
  where parent_id is null;
create index guestbook_entries_root_id_idx
  on public.guestbook_entries (root_id, created_at);
create index guestbook_entries_author_id_idx
  on public.guestbook_entries (author_id, created_at desc);
create index guestbook_reactions_user_id_idx
  on public.guestbook_reactions (user_id);
create index guestbook_mentions_user_id_idx
  on public.guestbook_mentions (mentioned_user_id);
create index guestbook_reports_created_at_idx
  on public.guestbook_reports (created_at desc);
create index guestbook_visits_visited_on_idx
  on public.guestbook_visits (visited_on);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.sync_google_profile()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  google_identity jsonb;
  profile_name text;
  profile_avatar text;
begin
  select identity_data into google_identity
  from auth.identities
  where user_id = new.id and provider = 'google'
  order by created_at
  limit 1;

  if google_identity is null and coalesce(new.raw_app_meta_data ->> 'provider', '') = 'google' then
    google_identity := new.raw_user_meta_data;
  end if;

  if google_identity is null then
    return new;
  end if;

  profile_name := nullif(btrim(coalesce(
    google_identity ->> 'full_name',
    google_identity ->> 'name'
  )), '');
  profile_avatar := nullif(btrim(coalesce(
    google_identity ->> 'avatar_url',
    google_identity ->> 'picture'
  )), '');

  if profile_name is null then
    raise exception 'Google profile name is required' using errcode = '23514';
  end if;

  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, left(profile_name, 120), profile_avatar)
  on conflict (id) do update
  set display_name = excluded.display_name,
      avatar_url = excluded.avatar_url,
      updated_at = now();

  return new;
end;
$$;

create function public.prepare_guestbook_entry()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  parent_entry public.guestbook_entries%rowtype;
begin
  if new.parent_id is null then
    new.root_id := null;
    new.depth := 0;
    return new;
  end if;

  select * into parent_entry
  from public.guestbook_entries
  where id = new.parent_id;

  if not found
    or parent_entry.id = new.id
    or parent_entry.is_hidden
    or parent_entry.deleted_at is not null
    or (
      parent_entry.root_id is not null
      and not exists (
        select 1
        from public.guestbook_entries root
        where root.id = parent_entry.root_id and not root.is_hidden
      )
    )
  then
    raise exception 'Reply target is unavailable' using errcode = '23503';
  end if;

  if parent_entry.depth >= 2 then
    new.parent_id := parent_entry.parent_id;
    new.root_id := parent_entry.root_id;
    new.depth := 2;
  else
    new.root_id := coalesce(parent_entry.root_id, parent_entry.id);
    new.depth := parent_entry.depth + 1;
  end if;

  new.entry_type := 'reply';
  new.rating := null;
  new.is_pinned := false;
  return new;
end;
$$;

create function public.is_guestbook_root_visible(p_root_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.guestbook_entries
    where id = p_root_id
      and parent_id is null
      and not is_hidden
  );
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger guestbook_entries_set_updated_at
before update on public.guestbook_entries
for each row execute function public.set_updated_at();

create trigger guestbook_entries_prepare
before insert or update of parent_id on public.guestbook_entries
for each row execute function public.prepare_guestbook_entry();

create trigger auth_users_sync_google_profile
after insert or update of raw_user_meta_data, raw_app_meta_data on auth.users
for each row execute function public.sync_google_profile();

insert into public.profiles (id, display_name, avatar_url)
select
  google_identity.user_id,
  left(btrim(coalesce(google_identity.identity_data ->> 'full_name', google_identity.identity_data ->> 'name')), 120),
  nullif(btrim(coalesce(google_identity.identity_data ->> 'avatar_url', google_identity.identity_data ->> 'picture')), '')
from (
  select distinct on (identity.user_id) identity.user_id, identity.identity_data
  from auth.identities identity
  where identity.provider = 'google'
  order by identity.user_id, identity.created_at
) google_identity
where nullif(btrim(coalesce(google_identity.identity_data ->> 'full_name', google_identity.identity_data ->> 'name')), '') is not null
on conflict (id) do update
set display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    updated_at = now();

alter table public.profiles enable row level security;
alter table public.guestbook_entries enable row level security;
alter table public.guestbook_reactions enable row level security;
alter table public.guestbook_mentions enable row level security;
alter table public.guestbook_reports enable row level security;
alter table public.guestbook_visits enable row level security;

create policy profiles_public_read
on public.profiles for select
to anon, authenticated
using (
  id = (select auth.uid())
  or exists (
    select 1
    from public.guestbook_entries entry
    where entry.author_id = profiles.id
      and not entry.is_hidden
      and (
        entry.root_id is null
        or public.is_guestbook_root_visible(entry.root_id)
      )
  )
);

create policy guestbook_entries_visible_read
on public.guestbook_entries for select
to anon, authenticated
using (
  not is_hidden
  and (
    root_id is null
    or public.is_guestbook_root_visible(root_id)
  )
);

create policy guestbook_reactions_visible_read
on public.guestbook_reactions for select
to anon, authenticated
using (
  exists (
    select 1
    from public.guestbook_entries entry
    where entry.id = entry_id
      and not entry.is_hidden
      and entry.deleted_at is null
      and (
        entry.root_id is null
        or public.is_guestbook_root_visible(entry.root_id)
      )
  )
);

create policy guestbook_mentions_visible_read
on public.guestbook_mentions for select
to anon, authenticated
using (
  exists (
    select 1
    from public.guestbook_entries entry
    where entry.id = entry_id
      and not entry.is_hidden
      and entry.deleted_at is null
      and (
        entry.root_id is null
        or public.is_guestbook_root_visible(entry.root_id)
      )
  )
);

create policy guestbook_reports_own_read
on public.guestbook_reports for select
to authenticated
using (reporter_id = (select auth.uid()));

create function public.guestbook_feed(
  p_filter text default 'all',
  p_sort text default 'newest',
  p_limit integer default 10,
  p_offset integer default 0
)
returns table (thread jsonb)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if p_filter not in ('all', 'discussions', 'reviews') then
    raise exception 'Invalid guestbook filter' using errcode = '22023';
  end if;
  if p_sort not in ('newest', 'popular', 'highest_rated') then
    raise exception 'Invalid guestbook sort' using errcode = '22023';
  end if;
  if p_limit < 1 or p_limit > 50 or p_offset < 0 then
    raise exception 'Invalid pagination' using errcode = '22023';
  end if;

  return query
  with roots as (
    select
      root.*,
      (
        select count(*)
        from public.guestbook_entries reply
        where reply.root_id = root.id
          and not reply.is_hidden
          and reply.deleted_at is null
      )::integer as reply_count,
      (
        select count(*)
        from public.guestbook_reactions reaction
        join public.guestbook_entries reacted_entry on reacted_entry.id = reaction.entry_id
        where (reacted_entry.id = root.id or reacted_entry.root_id = root.id)
          and not reacted_entry.is_hidden
          and reacted_entry.deleted_at is null
      )::integer as reaction_count
    from public.guestbook_entries root
    where root.parent_id is null
      and not root.is_hidden
      and (
        p_sort = 'highest_rated'
        or p_filter = 'all'
        or (p_filter = 'discussions' and root.entry_type = 'discussion')
        or (p_filter = 'reviews' and root.entry_type = 'review')
      )
      and (p_sort <> 'highest_rated' or root.entry_type = 'review')
  ),
  paged_roots as (
    select *
    from roots
    order by
      is_pinned desc,
      case when p_sort = 'highest_rated' then rating end desc nulls last,
      case when p_sort in ('popular', 'highest_rated') then reaction_count + reply_count end desc,
      created_at desc,
      id desc
    limit p_limit offset p_offset
  )
  select jsonb_build_object(
    'id', root.id,
    'author', jsonb_build_object(
      'id', author.id,
      'display_name', author.display_name,
      'avatar_url', author.avatar_url
      , 'is_author', author.is_author
    ),
    'entry_type', root.entry_type,
    'body', case when root.deleted_at is null then root.body else null end,
    'rating', case when root.deleted_at is null then root.rating else null end,
    'image_path', case when root.deleted_at is null then root.image_path else null end,
    'is_pinned', root.is_pinned,
    'is_deleted', root.deleted_at is not null,
    'created_at', root.created_at,
    'updated_at', root.updated_at,
    'reply_count', root.reply_count,
    'reaction_count', root.reaction_count,
    'mentions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', mentioned.id,
        'display_name', mentioned.display_name,
        'avatar_url', mentioned.avatar_url
      ) order by mentioned.display_name, mentioned.id)
      from public.guestbook_mentions mention
      join public.profiles mentioned on mentioned.id = mention.mentioned_user_id
      where mention.entry_id = root.id
        and root.deleted_at is null
    ), '[]'::jsonb),
    'reactions', coalesce((
      select jsonb_object_agg(reaction_type, reaction_total)
      from (
        select reaction.reaction_type::text as reaction_type, count(*)::integer as reaction_total
        from public.guestbook_reactions reaction
        where reaction.entry_id = root.id
          and root.deleted_at is null
        group by reaction.reaction_type
      ) reaction_counts
    ), '{}'::jsonb),
    'my_reactions', coalesce((
      select jsonb_agg(reaction.reaction_type order by reaction.reaction_type)
      from public.guestbook_reactions reaction
      where reaction.entry_id = root.id
        and reaction.user_id = auth.uid()
        and root.deleted_at is null
    ), '[]'::jsonb),
    'replies', coalesce((
      select jsonb_agg(reply_payload.payload order by reply_payload.created_at, reply_payload.id)
      from (
        select
          reply.id,
          reply.created_at,
          jsonb_build_object(
            'id', reply.id,
            'parent_id', reply.parent_id,
            'depth', reply.depth,
            'author', jsonb_build_object(
              'id', reply_author.id,
              'display_name', reply_author.display_name,
                'avatar_url', reply_author.avatar_url
                , 'is_author', reply_author.is_author
            ),
            'body', case when reply.deleted_at is null then reply.body else null end,
            'image_path', case when reply.deleted_at is null then reply.image_path else null end,
            'is_deleted', reply.deleted_at is not null,
            'created_at', reply.created_at,
            'updated_at', reply.updated_at,
            'mentions', coalesce((
              select jsonb_agg(jsonb_build_object(
                'id', mentioned.id,
                'display_name', mentioned.display_name,
                'avatar_url', mentioned.avatar_url
              ) order by mentioned.display_name, mentioned.id)
              from public.guestbook_mentions mention
              join public.profiles mentioned on mentioned.id = mention.mentioned_user_id
              where mention.entry_id = reply.id
                and reply.deleted_at is null
            ), '[]'::jsonb),
            'reactions', coalesce((
              select jsonb_object_agg(reaction_type, reaction_total)
              from (
                select reaction.reaction_type::text as reaction_type, count(*)::integer as reaction_total
                from public.guestbook_reactions reaction
                where reaction.entry_id = reply.id
                  and reply.deleted_at is null
                group by reaction.reaction_type
              ) reply_reaction_counts
            ), '{}'::jsonb),
            'my_reactions', coalesce((
              select jsonb_agg(reaction.reaction_type order by reaction.reaction_type)
              from public.guestbook_reactions reaction
              where reaction.entry_id = reply.id
                and reaction.user_id = auth.uid()
                and reply.deleted_at is null
            ), '[]'::jsonb)
          ) as payload
        from public.guestbook_entries reply
        join public.profiles reply_author on reply_author.id = reply.author_id
        where reply.root_id = root.id
          and not reply.is_hidden
      ) reply_payload
    ), '[]'::jsonb)
  )
  from paged_roots root
  join public.profiles author on author.id = root.author_id
  order by
    root.is_pinned desc,
    case when p_sort = 'highest_rated' then root.rating end desc nulls last,
    case when p_sort in ('popular', 'highest_rated') then root.reaction_count + root.reply_count end desc,
    root.created_at desc,
    root.id desc;
end;
$$;

create function public.guestbook_rating_summary()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  with ratings as (
    select rating
    from public.guestbook_entries
    where parent_id is null
      and entry_type = 'review'
      and not is_hidden
      and deleted_at is null
  ),
  total as (
    select count(*)::integer as review_count, coalesce(avg(rating), 0)::numeric(3, 2) as average_rating
    from ratings
  )
  select jsonb_build_object(
    'average_rating', total.average_rating,
    'total_reviews', total.review_count,
    'distribution', (
      select jsonb_object_agg(
        stars,
        jsonb_build_object(
          'count', rating_count,
          'percentage', case
            when total.review_count = 0 then 0
            else round((rating_count * 100.0 / total.review_count)::numeric, 2)
          end
        )
        order by stars desc
      )
      from (
        select stars, count(ratings.rating)::integer as rating_count
        from generate_series(1, 5) stars
        left join ratings on ratings.rating = stars
        group by stars
      ) distribution_rows
    )
  )
  from total;
$$;

create function public.guestbook_statistics()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  with jakarta_today as (
    select (now() at time zone 'Asia/Jakarta')::date as value
  )
  select jsonb_build_object(
    'total_visitors', (select count(distinct browser_hash) from public.guestbook_visits),
    'total_comments', (
      select count(*)
      from public.guestbook_entries
      where not is_hidden and deleted_at is null
    ),
    'today_visitors', (
      select count(distinct browser_hash)
      from public.guestbook_visits, jakarta_today
      where visited_on = jakarta_today.value
    ),
    'this_week', (
      select count(distinct browser_hash)
      from public.guestbook_visits, jakarta_today
      where visited_on between jakarta_today.value - 6 and jakarta_today.value
    )
  );
$$;

create function public.guestbook_top_contributors(p_limit integer default 5)
returns table (
  profile_id uuid,
  display_name text,
  avatar_url text,
  score bigint,
  entry_count bigint,
  reactions_received bigint
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if p_limit < 1 or p_limit > 5 then
    raise exception 'Contributor limit must be between 1 and 5' using errcode = '22023';
  end if;

  return query
  with active_entries as (
    select entry.id, entry.author_id
    from public.guestbook_entries entry
    where not entry.is_hidden and entry.deleted_at is null
  ),
  entry_totals as (
    select active.author_id, count(*)::bigint as count
    from active_entries active
    group by active.author_id
  ),
  reaction_totals as (
    select active.author_id, count(*)::bigint as count
    from active_entries active
    join public.guestbook_reactions reaction on reaction.entry_id = active.id
    group by active.author_id
  )
  select
    profile.id,
    profile.display_name,
    profile.avatar_url,
    coalesce(entry_totals.count, 0) + coalesce(reaction_totals.count, 0) as score,
    coalesce(entry_totals.count, 0) as entry_count,
    coalesce(reaction_totals.count, 0) as reactions_received
  from public.profiles profile
  left join entry_totals on entry_totals.author_id = profile.id
  left join reaction_totals on reaction_totals.author_id = profile.id
  where coalesce(entry_totals.count, 0) > 0
  order by
    (coalesce(entry_totals.count, 0) + coalesce(reaction_totals.count, 0)) desc,
    coalesce(entry_totals.count, 0) desc,
    profile.display_name,
    profile.id
  limit p_limit;
end;
$$;

create function public.create_guestbook_entry(
  p_body text,
  p_entry_type public.guestbook_entry_type,
  p_rating smallint default null,
  p_parent_id uuid default null,
  p_image_path text default null,
  p_mentioned_user_ids uuid[] default '{}'::uuid[]
)
returns public.guestbook_entries
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  actor_id uuid := auth.uid();
  created_entry public.guestbook_entries;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = actor_id) then
    raise exception 'A Google profile is required' using errcode = '42501';
  end if;
  if p_parent_id is null and p_entry_type not in ('discussion', 'review') then
    raise exception 'Root entries must be discussions or reviews' using errcode = '22023';
  end if;
  if p_parent_id is not null and p_entry_type <> 'reply' then
    raise exception 'Replies must use the reply type' using errcode = '22023';
  end if;
  if p_image_path is not null and split_part(p_image_path, '/', 1) <> actor_id::text then
    raise exception 'Image must be stored in the current user folder' using errcode = '42501';
  end if;

  insert into public.guestbook_entries (
    author_id, parent_id, entry_type, body, rating, image_path
  ) values (
    actor_id, p_parent_id, p_entry_type, p_body, p_rating, p_image_path
  )
  returning * into created_entry;

  insert into public.guestbook_mentions (entry_id, mentioned_user_id)
  select created_entry.id, mentioned_id
  from (
    select distinct unnest(coalesce(p_mentioned_user_ids, '{}'::uuid[])) as mentioned_id
  ) mentions
  join public.profiles profile on profile.id = mentions.mentioned_id
  where mentions.mentioned_id <> actor_id;

  return created_entry;
end;
$$;

create function public.update_guestbook_entry(
  p_entry_id uuid,
  p_body text,
  p_entry_type public.guestbook_entry_type,
  p_rating smallint default null,
  p_image_path text default null,
  p_mentioned_user_ids uuid[] default '{}'::uuid[]
)
returns public.guestbook_entries
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  actor_id uuid := auth.uid();
  existing_entry public.guestbook_entries;
  updated_entry public.guestbook_entries;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into existing_entry
  from public.guestbook_entries
  where id = p_entry_id
  for update;

  if not found or existing_entry.author_id <> actor_id then
    raise exception 'Entry not found' using errcode = 'P0002';
  end if;
  if existing_entry.deleted_at is not null or existing_entry.is_hidden then
    raise exception 'Entry is unavailable' using errcode = '55000';
  end if;
  if existing_entry.parent_id is null and p_entry_type not in ('discussion', 'review') then
    raise exception 'Root entries must be discussions or reviews' using errcode = '22023';
  end if;
  if existing_entry.parent_id is not null and p_entry_type <> 'reply' then
    raise exception 'Reply type cannot be changed' using errcode = '22023';
  end if;
  if p_image_path is not null and split_part(p_image_path, '/', 1) <> actor_id::text then
    raise exception 'Image must be stored in the current user folder' using errcode = '42501';
  end if;

  update public.guestbook_entries
  set body = p_body,
      entry_type = p_entry_type,
      rating = p_rating,
      image_path = p_image_path
  where id = p_entry_id
  returning * into updated_entry;

  delete from public.guestbook_mentions where entry_id = p_entry_id;
  insert into public.guestbook_mentions (entry_id, mentioned_user_id)
  select p_entry_id, mentioned_id
  from (
    select distinct unnest(coalesce(p_mentioned_user_ids, '{}'::uuid[])) as mentioned_id
  ) mentions
  join public.profiles profile on profile.id = mentions.mentioned_id
  where mentions.mentioned_id <> actor_id;

  return updated_entry;
end;
$$;

create function public.tombstone_guestbook_entry(p_entry_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  actor_id uuid := auth.uid();
  existing_entry public.guestbook_entries;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into existing_entry
  from public.guestbook_entries
  where id = p_entry_id
  for update;

  if not found or existing_entry.author_id <> actor_id then
    raise exception 'Entry not found' using errcode = 'P0002';
  end if;
  if existing_entry.deleted_at is null then
    update public.guestbook_entries
    set body = '',
        rating = null,
        image_path = null,
        is_pinned = false,
        deleted_at = now()
    where id = p_entry_id;

    delete from public.guestbook_mentions where entry_id = p_entry_id;
    delete from public.guestbook_reactions where entry_id = p_entry_id;
  end if;

  return jsonb_build_object(
    'id', existing_entry.id,
    'image_path', existing_entry.image_path,
    'deleted', true
  );
end;
$$;

create function public.toggle_guestbook_reaction(
  p_entry_id uuid,
  p_reaction_type public.guestbook_reaction_type
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  actor_id uuid := auth.uid();
  is_active boolean;
  reaction_total bigint;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = actor_id) then
    raise exception 'A Google profile is required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.guestbook_entries
    where id = p_entry_id and not is_hidden and deleted_at is null
  ) then
    raise exception 'Entry not found' using errcode = 'P0002';
  end if;

  delete from public.guestbook_reactions
  where entry_id = p_entry_id
    and user_id = actor_id
    and reaction_type = p_reaction_type;

  if found then
    is_active := false;
  else
    insert into public.guestbook_reactions (entry_id, user_id, reaction_type)
    values (p_entry_id, actor_id, p_reaction_type);
    is_active := true;
  end if;

  select count(*) into reaction_total
  from public.guestbook_reactions
  where entry_id = p_entry_id and reaction_type = p_reaction_type;

  return jsonb_build_object('active', is_active, 'count', reaction_total);
end;
$$;

create function public.report_guestbook_entry(
  p_entry_id uuid,
  p_reason public.guestbook_report_reason,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  actor_id uuid := auth.uid();
  report_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = actor_id) then
    raise exception 'A Google profile is required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.guestbook_entries
    where id = p_entry_id and not is_hidden and deleted_at is null
  ) then
    raise exception 'Entry not found' using errcode = 'P0002';
  end if;

  insert into public.guestbook_reports (entry_id, reporter_id, reason, note)
  values (p_entry_id, actor_id, p_reason, nullif(btrim(p_note), ''))
  returning id into report_id;

  return report_id;
exception
  when unique_violation then
    raise exception 'Entry has already been reported' using errcode = '23505';
end;
$$;

revoke all on public.profiles from anon, authenticated;
revoke all on public.guestbook_entries from anon, authenticated;
revoke all on public.guestbook_reactions from anon, authenticated;
revoke all on public.guestbook_mentions from anon, authenticated;
revoke all on public.guestbook_reports from anon, authenticated;
revoke all on public.guestbook_visits from anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant select on public.guestbook_entries to anon, authenticated;
grant select on public.guestbook_reactions to anon, authenticated;
grant select on public.guestbook_mentions to anon, authenticated;
grant select on public.guestbook_reports to authenticated;
grant all on public.profiles to service_role;
grant all on public.guestbook_entries to service_role;
grant all on public.guestbook_reactions to service_role;
grant all on public.guestbook_mentions to service_role;
grant all on public.guestbook_reports to service_role;
grant all on public.guestbook_visits to service_role;
grant usage, select on sequence public.guestbook_visits_id_seq to service_role;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.sync_google_profile() from public, anon, authenticated;
revoke all on function public.prepare_guestbook_entry() from public, anon, authenticated;
revoke all on function public.is_guestbook_root_visible(uuid) from public;
revoke all on function public.guestbook_feed(text, text, integer, integer) from public;
revoke all on function public.guestbook_rating_summary() from public;
revoke all on function public.guestbook_statistics() from public;
revoke all on function public.guestbook_top_contributors(integer) from public;
revoke all on function public.create_guestbook_entry(text, public.guestbook_entry_type, smallint, uuid, text, uuid[]) from public;
revoke all on function public.update_guestbook_entry(uuid, text, public.guestbook_entry_type, smallint, text, uuid[]) from public;
revoke all on function public.tombstone_guestbook_entry(uuid) from public;
revoke all on function public.toggle_guestbook_reaction(uuid, public.guestbook_reaction_type) from public;
revoke all on function public.report_guestbook_entry(uuid, public.guestbook_report_reason, text) from public;

grant execute on function public.guestbook_feed(text, text, integer, integer) to anon, authenticated;
grant execute on function public.is_guestbook_root_visible(uuid) to anon, authenticated;
grant execute on function public.guestbook_rating_summary() to anon, authenticated;
grant execute on function public.guestbook_statistics() to anon, authenticated;
grant execute on function public.guestbook_top_contributors(integer) to anon, authenticated;
grant execute on function public.create_guestbook_entry(text, public.guestbook_entry_type, smallint, uuid, text, uuid[]) to authenticated;
grant execute on function public.update_guestbook_entry(uuid, text, public.guestbook_entry_type, smallint, text, uuid[]) to authenticated;
grant execute on function public.tombstone_guestbook_entry(uuid) to authenticated;
grant execute on function public.toggle_guestbook_reaction(uuid, public.guestbook_reaction_type) to authenticated;
grant execute on function public.report_guestbook_entry(uuid, public.guestbook_report_reason, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'guestbook-images',
  'guestbook-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy guestbook_images_public_read
on storage.objects for select
to anon, authenticated
using (bucket_id = 'guestbook-images');

create policy guestbook_images_own_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'guestbook-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
  and coalesce((metadata ->> 'size')::bigint, 0) between 1 and 5242880
  and metadata ->> 'mimetype' in ('image/jpeg', 'image/png', 'image/webp')
);

create policy guestbook_images_own_update
on storage.objects for update
to authenticated
using (
  bucket_id = 'guestbook-images'
  and owner_id = (select auth.uid())::text
)
with check (
  bucket_id = 'guestbook-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
  and coalesce((metadata ->> 'size')::bigint, 0) between 1 and 5242880
  and metadata ->> 'mimetype' in ('image/jpeg', 'image/png', 'image/webp')
);

create policy guestbook_images_own_delete
on storage.objects for delete
to authenticated
using (
  bucket_id = 'guestbook-images'
  and owner_id = (select auth.uid())::text
);

commit;
