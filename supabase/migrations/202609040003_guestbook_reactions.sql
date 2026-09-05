begin;

alter type public.guestbook_reaction_type add value if not exists 'dislike';

commit;

begin;

delete from public.guestbook_reactions;

alter table public.guestbook_reactions
  add constraint guestbook_reactions_one_vote_per_user
  unique (entry_id, user_id);

create or replace function public.toggle_guestbook_reaction(
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
  existing_type public.guestbook_reaction_type;
  is_active boolean;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_reaction_type not in ('thumb', 'dislike') then
    raise exception 'Unsupported reaction type' using errcode = '22023';
  end if;
  if not exists (
    select 1
    from public.guestbook_entries entry
    where entry.id = p_entry_id
      and not entry.is_hidden
      and entry.deleted_at is null
      and (
        entry.root_id is null
        or public.is_guestbook_root_visible(entry.root_id)
      )
  ) then
    raise exception 'Entry not found' using errcode = 'P0002';
  end if;

  select reaction_type into existing_type
  from public.guestbook_reactions
  where entry_id = p_entry_id and user_id = actor_id;

  delete from public.guestbook_reactions
  where entry_id = p_entry_id and user_id = actor_id;

  if existing_type is distinct from p_reaction_type then
    insert into public.guestbook_reactions (entry_id, user_id, reaction_type)
    values (p_entry_id, actor_id, p_reaction_type);
    is_active := true;
  else
    is_active := false;
  end if;

  return jsonb_build_object(
    'entry_id', p_entry_id,
    'reaction_type', p_reaction_type,
    'active', is_active
  );
end;
$$;

create or replace function public.guestbook_feed(
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
          and reaction.reaction_type = 'thumb'
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
      'avatar_url', author.avatar_url,
      'is_author', author.is_author
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
          and reaction.reaction_type in ('thumb', 'dislike')
          and root.deleted_at is null
        group by reaction.reaction_type
      ) reaction_counts
    ), '{}'::jsonb),
    'my_reactions', coalesce((
      select jsonb_agg(reaction.reaction_type order by reaction.reaction_type)
      from public.guestbook_reactions reaction
      where reaction.entry_id = root.id
        and reaction.user_id = auth.uid()
        and reaction.reaction_type in ('thumb', 'dislike')
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
              'avatar_url', reply_author.avatar_url,
              'is_author', reply_author.is_author
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
                  and reaction.reaction_type in ('thumb', 'dislike')
                  and reply.deleted_at is null
                group by reaction.reaction_type
              ) reply_reaction_counts
            ), '{}'::jsonb),
            'my_reactions', coalesce((
              select jsonb_agg(reaction.reaction_type order by reaction.reaction_type)
              from public.guestbook_reactions reaction
              where reaction.entry_id = reply.id
                and reaction.user_id = auth.uid()
                and reaction.reaction_type in ('thumb', 'dislike')
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

create table public.portfolio_reactions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null check (reaction_type in (
    'thumbs_up', 'heart', 'fire', 'wave',
    'rocket', 'sparkle', 'smile', 'hundred'
  )),
  created_at timestamptz not null default now(),
  primary key (user_id, reaction_type)
);

alter table public.portfolio_reactions enable row level security;

create function public.guestbook_portfolio_reaction_summary()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  with reaction_types(reaction_type, sort_order) as (
    values
      ('thumbs_up', 1), ('heart', 2), ('fire', 3), ('wave', 4),
      ('rocket', 5), ('sparkle', 6), ('smile', 7), ('hundred', 8)
  )
  select jsonb_build_object(
    'counts', jsonb_object_agg(
      types.reaction_type,
      coalesce(reaction_counts.reaction_total, 0)
      order by types.sort_order
    ),
    'my_reactions', coalesce((
      select jsonb_agg(reaction.reaction_type order by types_inner.sort_order)
      from public.portfolio_reactions reaction
      join reaction_types types_inner
        on types_inner.reaction_type = reaction.reaction_type
      where reaction.user_id = auth.uid()
    ), '[]'::jsonb)
  )
  from reaction_types types
  left join (
    select reaction_type, count(*)::integer as reaction_total
    from public.portfolio_reactions
    group by reaction_type
  ) reaction_counts on reaction_counts.reaction_type = types.reaction_type;
$$;

create function public.toggle_guestbook_portfolio_reaction(p_reaction_type text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  actor_id uuid := auth.uid();
  removed_count integer;
  reaction_total integer;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_reaction_type not in (
    'thumbs_up', 'heart', 'fire', 'wave',
    'rocket', 'sparkle', 'smile', 'hundred'
  ) then
    raise exception 'Unsupported reaction type' using errcode = '22023';
  end if;

  delete from public.portfolio_reactions
  where user_id = actor_id and reaction_type = p_reaction_type;
  get diagnostics removed_count = row_count;

  if removed_count = 0 then
    insert into public.portfolio_reactions (user_id, reaction_type)
    values (actor_id, p_reaction_type);
  end if;

  select count(*)::integer into reaction_total
  from public.portfolio_reactions
  where reaction_type = p_reaction_type;

  return jsonb_build_object(
    'reaction_type', p_reaction_type,
    'active', removed_count = 0,
    'count', reaction_total
  );
end;
$$;

revoke all on public.portfolio_reactions from anon, authenticated;
grant all on public.portfolio_reactions to service_role;
revoke all on function public.guestbook_portfolio_reaction_summary() from public;
revoke all on function public.toggle_guestbook_portfolio_reaction(text) from public;
grant execute on function public.guestbook_portfolio_reaction_summary() to anon, authenticated;
grant execute on function public.toggle_guestbook_portfolio_reaction(text) to authenticated;

commit;
