begin;

alter table public.guestbook_entries
  drop constraint guestbook_review_category_check;

alter table public.guestbook_entries
  rename column review_category to review_categories;

alter table public.guestbook_entries
  alter column review_categories type text[]
  using case when review_categories is null then null else array[review_categories] end;

create function public.guestbook_review_categories_valid(p_categories text[])
returns boolean
language sql immutable
set search_path = pg_catalog, public
as $$
  select p_categories is not null
    and cardinality(p_categories) between 1 and 6
    and p_categories = array(
      select category from unnest(array[
        'portfolio', 'ui_ux_design', 'code_quality', 'communication',
        'collaboration', 'overall_experience'
      ]::text[]) category
      where category = any(p_categories)
    );
$$;

alter table public.guestbook_entries
  add constraint guestbook_review_categories_check check (
    (entry_type = 'review' and parent_id is null
      and public.guestbook_review_categories_valid(review_categories))
    or (entry_type <> 'review' and review_categories is null)
  );

drop function public.create_guestbook_entry(text, public.guestbook_entry_type, smallint, uuid, text, text);
drop function public.update_guestbook_entry(uuid, text, public.guestbook_entry_type, smallint, text, text);

create function public.create_guestbook_entry(
  p_body text,
  p_entry_type public.guestbook_entry_type,
  p_rating smallint default null,
  p_parent_id uuid default null,
  p_image_path text default null,
  p_review_categories text[] default array['portfolio']::text[]
)
returns public.guestbook_entries
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  actor_id uuid := public.assert_guestbook_actor_allowed();
  created_entry public.guestbook_entries;
  classification jsonb;
  normalized_body text;
  next_reasons text[];
begin
  if not exists (select 1 from public.profiles where id = actor_id) then
    raise exception 'A Google profile is required' using errcode = '42501';
  end if;
  perform public.consume_guestbook_rate_limit(case when p_parent_id is null then 'root' else 'reply' end);
  if p_parent_id is null and p_entry_type not in ('discussion', 'review') then
    raise exception 'Root entries must be discussions or reviews' using errcode = '22023';
  end if;
  if p_parent_id is not null and p_entry_type <> 'reply' then
    raise exception 'Replies must use the reply type' using errcode = '22023';
  end if;
  if p_entry_type = 'review' and (p_rating is null or p_rating not between 1 and 5) then
    raise exception 'Review rating is required' using errcode = '23514';
  end if;
  if p_entry_type = 'review' and not public.guestbook_review_categories_valid(p_review_categories) then
    raise exception 'At least one unique review category is required' using errcode = '23514';
  end if;
  if p_image_path is not null and split_part(p_image_path, '/', 1) <> actor_id::text then
    raise exception 'Image must be stored in the current user folder' using errcode = '42501';
  end if;
  classification := public.classify_guestbook_body(p_body);
  normalized_body := classification ->> 'body';
  select coalesce(array_agg(value), '{}'::text[]) into next_reasons
  from jsonb_array_elements_text(classification -> 'reasons') value;
  if normalized_body = '' then
    raise exception 'Guestbook body is required' using errcode = '23514';
  end if;
  if exists (
    select 1 from public.guestbook_entries duplicate
    where duplicate.author_id = actor_id and duplicate.deleted_at is null
      and duplicate.created_at >= now() - interval '24 hours'
      and lower(replace(public.normalize_guestbook_body(duplicate.body), chr(8205), ''))
        = lower(replace(normalized_body, chr(8205), ''))
  ) then
    raise exception 'Duplicate Guestbook body within 24 hours'
      using errcode = '23505', detail = 'GUESTBOOK_DUPLICATE_BODY';
  end if;
  insert into public.guestbook_entries(
    author_id, parent_id, entry_type, body, rating, image_path, review_categories,
    moderation_status, moderation_reasons
  ) values (
    actor_id, p_parent_id, p_entry_type, normalized_body, p_rating, p_image_path,
    case when p_entry_type = 'review' then p_review_categories else null end,
    (classification ->> 'status')::public.guestbook_moderation_status, next_reasons
  ) returning * into created_entry;
  return created_entry;
end;
$$;

create function public.update_guestbook_entry(
  p_entry_id uuid,
  p_body text,
  p_entry_type public.guestbook_entry_type,
  p_rating smallint default null,
  p_image_path text default null,
  p_review_categories text[] default null
)
returns public.guestbook_entries
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  actor_id uuid := public.assert_guestbook_actor_allowed();
  existing_entry public.guestbook_entries;
  updated_entry public.guestbook_entries;
  classification jsonb;
  normalized_body text;
  next_status public.guestbook_moderation_status;
  next_reasons text[];
begin
  select * into existing_entry from public.guestbook_entries where id = p_entry_id for update;
  if not found or existing_entry.author_id <> actor_id then
    raise exception 'Entry not found' using errcode = 'P0002';
  end if;
  if existing_entry.deleted_at is not null or existing_entry.is_hidden then
    raise exception 'Entry is unavailable' using errcode = '55000';
  end if;
  if p_entry_type is distinct from existing_entry.entry_type then
    raise exception 'Entry type cannot be changed' using errcode = '22023';
  end if;
  if p_entry_type = 'review' and (p_rating is null or p_rating not between 1 and 5) then
    raise exception 'Review rating is required' using errcode = '23514';
  end if;
  if p_entry_type = 'review' and not public.guestbook_review_categories_valid(
    coalesce(p_review_categories, existing_entry.review_categories)
  ) then
    raise exception 'At least one unique review category is required' using errcode = '23514';
  end if;
  if p_image_path is not null and split_part(p_image_path, '/', 1) <> actor_id::text then
    raise exception 'Image must be stored in the current user folder' using errcode = '42501';
  end if;
  classification := public.classify_guestbook_body(p_body);
  normalized_body := classification ->> 'body';
  next_status := (classification ->> 'status')::public.guestbook_moderation_status;
  select coalesce(array_agg(value), '{}'::text[]) into next_reasons
  from jsonb_array_elements_text(classification -> 'reasons') value;
  if normalized_body = '' then
    raise exception 'Guestbook body is required' using errcode = '23514';
  end if;
  if exists (
    select 1 from public.guestbook_entries duplicate
    where duplicate.author_id = actor_id and duplicate.id <> p_entry_id
      and duplicate.deleted_at is null and duplicate.created_at >= now() - interval '24 hours'
      and lower(replace(public.normalize_guestbook_body(duplicate.body), chr(8205), ''))
        = lower(replace(normalized_body, chr(8205), ''))
  ) then
    raise exception 'Duplicate Guestbook body within 24 hours'
      using errcode = '23505', detail = 'GUESTBOOK_DUPLICATE_BODY';
  end if;
  update public.guestbook_entries
  set body = normalized_body, rating = p_rating, image_path = p_image_path,
      review_categories = case when p_entry_type = 'review'
        then coalesce(p_review_categories, existing_entry.review_categories) else null end,
      moderation_status = next_status, moderation_reasons = next_reasons,
      is_pinned = case when next_status = 'visible' then is_pinned else false end
  where id = p_entry_id returning * into updated_entry;
  delete from public.guestbook_mentions where entry_id = p_entry_id;
  return updated_entry;
end;
$$;

create or replace function public.guestbook_feed(
  p_filter text default 'all', p_sort text default 'newest',
  p_limit integer default 10, p_offset integer default 0
)
returns table(thread jsonb)
language plpgsql stable security definer set search_path = pg_catalog, public
as $$
begin
  if p_filter not in ('all', 'discussions', 'reviews') or p_sort not in ('newest', 'popular', 'highest_rated')
    or p_limit < 1 or p_limit > 50 or p_offset < 0 then
    raise exception 'Invalid feed parameters' using errcode = '22023';
  end if;
  return query
  with roots as (
    select root.*,
      (select count(*) from public.guestbook_entries reply where reply.root_id = root.id
        and not reply.is_hidden and reply.deleted_at is null)::integer as reply_count,
      (select count(*) from public.guestbook_reactions reaction
        join public.guestbook_entries reacted on reacted.id = reaction.entry_id
        where (reacted.id = root.id or reacted.root_id = root.id) and reaction.reaction_type = 'thumb'
          and not reacted.is_hidden and reacted.deleted_at is null)::integer as reaction_count
    from public.guestbook_entries root
    where root.parent_id is null and not root.is_hidden
      and (p_sort = 'highest_rated' or p_filter = 'all'
        or (p_filter = 'discussions' and root.entry_type = 'discussion')
        or (p_filter = 'reviews' and root.entry_type = 'review'))
      and (p_sort <> 'highest_rated' or (root.entry_type = 'review' and root.deleted_at is null))
  ), paged_roots as (
    select * from roots order by is_pinned desc,
      case when p_sort = 'highest_rated' then rating end desc nulls last,
      case when p_sort in ('popular', 'highest_rated') then reaction_count + reply_count end desc,
      created_at desc, id desc limit p_limit offset p_offset
  ), payloads as (
    select entry.id, entry.root_id, entry.created_at,
      jsonb_build_object(
        'id', entry.id, 'parent_id', entry.parent_id, 'depth', entry.depth, 'entry_type', entry.entry_type,
        'author', jsonb_build_object('id', author.id, 'display_name', author.display_name,
          'avatar_url', author.avatar_url, 'is_author', author.is_author),
        'body', case when entry.deleted_at is null then entry.body end,
        'rating', case when entry.deleted_at is null then entry.rating end,
        'review_categories', case when entry.deleted_at is null then entry.review_categories end,
        'image_path', case when entry.deleted_at is null then entry.image_path end,
        'is_pinned', entry.is_pinned, 'is_deleted', entry.deleted_at is not null,
        'deletion_source', entry.deletion_source, 'created_at', entry.created_at, 'updated_at', entry.updated_at,
        'reactions', coalesce((select jsonb_object_agg(vote.reaction_type, vote.total) from (
          select reaction_type, count(*)::integer total from public.guestbook_reactions
          where entry_id = entry.id and entry.deleted_at is null and reaction_type in ('thumb', 'dislike')
          group by reaction_type) vote), '{}'::jsonb),
        'my_reactions', coalesce((select jsonb_agg(reaction_type order by reaction_type)
          from public.guestbook_reactions where entry_id = entry.id and user_id = auth.uid()
            and entry.deleted_at is null and reaction_type in ('thumb', 'dislike')), '[]'::jsonb)
      ) as payload
    from public.guestbook_entries entry join public.profiles author on author.id = entry.author_id
    where not entry.is_hidden and (entry.id in (select id from paged_roots) or entry.root_id in (select id from paged_roots))
  )
  select payloads.payload || jsonb_build_object('reply_count', root.reply_count, 'reaction_count', root.reaction_count,
    'replies', coalesce((select jsonb_agg(reply.payload order by reply.created_at, reply.id)
      from payloads reply where reply.root_id = root.id), '[]'::jsonb))
  from paged_roots root join payloads on payloads.id = root.id
  order by root.is_pinned desc,
    case when p_sort = 'highest_rated' then root.rating end desc nulls last,
    case when p_sort in ('popular', 'highest_rated') then root.reaction_count + root.reply_count end desc,
    root.created_at desc, root.id desc;
end;
$$;

revoke all on function public.guestbook_review_categories_valid(text[]) from public, anon;
grant execute on function public.guestbook_review_categories_valid(text[]) to authenticated, service_role;
revoke all on function public.create_guestbook_entry(text, public.guestbook_entry_type, smallint, uuid, text, text[]) from public, anon;
revoke all on function public.update_guestbook_entry(uuid, text, public.guestbook_entry_type, smallint, text, text[]) from public, anon;
grant execute on function public.create_guestbook_entry(text, public.guestbook_entry_type, smallint, uuid, text, text[]) to authenticated;
grant execute on function public.update_guestbook_entry(uuid, text, public.guestbook_entry_type, smallint, text, text[]) to authenticated;

commit;
