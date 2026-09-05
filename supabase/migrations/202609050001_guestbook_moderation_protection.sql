begin;

alter type public.guestbook_report_reason add value if not exists 'hate';
alter type public.guestbook_report_reason add value if not exists 'threat';
alter type public.guestbook_report_reason add value if not exists 'illegal';
alter type public.guestbook_report_reason add value if not exists 'phishing';
alter type public.guestbook_report_reason add value if not exists 'personal_data';

commit;

begin;

create type public.guestbook_moderation_status
as enum ('visible', 'pending', 'quarantined');

alter table public.guestbook_entries
  add column moderation_status public.guestbook_moderation_status,
  add column moderation_reasons text[] not null default '{}'::text[];

update public.guestbook_entries
set moderation_status = case
  when is_hidden then 'quarantined'::public.guestbook_moderation_status
  else 'visible'::public.guestbook_moderation_status
end,
moderation_reasons = case when is_hidden then array['legacy_hidden'] else '{}'::text[] end;

alter table public.guestbook_entries
  alter column moderation_status set default 'visible',
  alter column moderation_status set not null;

create table public.guestbook_blocked_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reason text check (reason is null or char_length(btrim(reason)) between 1 and 500),
  blocked_by uuid references auth.users(id) on delete set null,
  blocked_at timestamptz not null default now()
);

create table public.guestbook_mutation_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket text not null check (bucket in ('root', 'reply', 'report', 'reaction')),
  created_at timestamptz not null default now()
);

create index guestbook_mutation_events_window_idx
  on public.guestbook_mutation_events(user_id, bucket, created_at desc);
create index guestbook_entries_moderation_queue_idx
  on public.guestbook_entries(moderation_status, created_at desc)
  where moderation_status <> 'visible' and deleted_at is null;

alter table public.guestbook_blocked_users enable row level security;
alter table public.guestbook_mutation_events enable row level security;
revoke all on public.guestbook_blocked_users from public, anon, authenticated;
revoke all on public.guestbook_mutation_events from public, anon, authenticated;
grant all on public.guestbook_blocked_users to service_role;
grant all on public.guestbook_mutation_events to service_role;
grant usage, select on sequence public.guestbook_mutation_events_id_seq to service_role;

create function public.assert_guestbook_actor_allowed()
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare actor_id uuid := auth.uid();
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if exists (select 1 from public.guestbook_blocked_users where user_id = actor_id) then
    raise exception 'Guestbook access is blocked'
      using errcode = '42501', detail = 'GUESTBOOK_USER_BLOCKED';
  end if;
  return actor_id;
end;
$$;

create function public.consume_guestbook_rate_limit(p_bucket text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  actor_id uuid := auth.uid();
  allowed_count integer;
  window_start timestamptz;
  current_count integer;
begin
  case p_bucket
    when 'root' then allowed_count := 3; window_start := now() - interval '10 minutes';
    when 'reply' then allowed_count := 10; window_start := now() - interval '10 minutes';
    when 'report' then allowed_count := 5; window_start := now() - interval '30 minutes';
    when 'reaction' then allowed_count := 30; window_start := now() - interval '1 minute';
    else raise exception 'Invalid rate-limit bucket' using errcode = '22023';
  end case;
  perform pg_advisory_xact_lock(hashtextextended(actor_id::text || ':' || p_bucket, 0));
  select count(*)::integer into current_count
  from public.guestbook_mutation_events
  where user_id = actor_id and bucket = p_bucket and created_at >= window_start;
  if current_count >= allowed_count then
    raise exception 'Guestbook rate limit exceeded'
      using errcode = 'P0001', detail = 'GUESTBOOK_RATE_LIMIT_' || upper(p_bucket);
  end if;
  insert into public.guestbook_mutation_events(user_id, bucket) values (actor_id, p_bucket);
end;
$$;

create function public.normalize_guestbook_body(p_body text)
returns text
language sql
immutable
strict
set search_path = pg_catalog
as $$
  select btrim(regexp_replace(
    replace(replace(replace(replace(p_body, chr(8203), ''), chr(8204), ''), chr(8288), ''), chr(65279), ''),
    '[[:space:]]+', ' ', 'g'
  ));
$$;

create function public.classify_guestbook_body(p_body text)
returns jsonb
language plpgsql
immutable
strict
set search_path = pg_catalog, public
as $$
declare
  normalized text := public.normalize_guestbook_body(p_body);
  checked text;
  without_urls text;
  url_count integer;
  next_status public.guestbook_moderation_status := 'visible';
  reasons text[] := '{}'::text[];
begin
  checked := replace(normalized, chr(8205), '');
  select count(*)::integer into url_count
  from regexp_matches(checked, '(https?://|www\.)[^[:space:]]+', 'gi');
  without_urls := regexp_replace(checked, '(https?://|www\.)[^[:space:]]+', '', 'gi');
  if url_count > 0 and without_urls ~ '^[[:space:][:punct:]]*$' then
    next_status := 'quarantined'; reasons := array_append(reasons, 'link_only');
  end if;
  if url_count >= 4 then
    next_status := 'quarantined'; reasons := array_append(reasons, 'excessive_urls');
  elsif url_count between 2 and 3 and next_status = 'visible' then
    next_status := 'pending'; reasons := array_append(reasons, 'multiple_urls');
  end if;
  if checked ~ '(?s)([^[:space:]])\1{11,}' then
    next_status := 'quarantined'; reasons := array_append(reasons, 'extreme_repetition');
  elsif checked ~ '(?s)([^[:space:]])\1{7,}' and next_status = 'visible' then
    next_status := 'pending'; reasons := array_append(reasons, 'repetition');
  end if;
  return jsonb_build_object('body', normalized, 'status', next_status, 'reasons', reasons);
end;
$$;

create function public.sync_guestbook_moderation_visibility()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'UPDATE' and new.is_hidden is distinct from old.is_hidden
     and new.moderation_status is not distinct from old.moderation_status then
    new.moderation_status := case when new.is_hidden then 'quarantined' else 'visible' end;
    if new.is_hidden and cardinality(new.moderation_reasons) = 0 then
      new.moderation_reasons := array['manual_hide'];
    end if;
  else
    new.is_hidden := new.moderation_status <> 'visible';
  end if;
  return new;
end;
$$;

create trigger guestbook_entries_sync_moderation_visibility
before insert or update of is_hidden, moderation_status
on public.guestbook_entries
for each row execute function public.sync_guestbook_moderation_visibility();

create function public.reject_blocked_guestbook_entry_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare actor_id uuid := auth.uid();
begin
  if actor_id is not null
     and exists (select 1 from public.guestbook_blocked_users where user_id = actor_id) then
    raise exception 'Guestbook access is blocked'
      using errcode = '42501', detail = 'GUESTBOOK_USER_BLOCKED';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger guestbook_entries_reject_blocked_mutation
before insert or update or delete on public.guestbook_entries
for each row execute function public.reject_blocked_guestbook_entry_mutation();

create or replace function public.create_guestbook_entry(
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
  actor_id uuid := public.assert_guestbook_actor_allowed();
  created_entry public.guestbook_entries;
  classification jsonb;
  normalized_body text;
  next_status public.guestbook_moderation_status;
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
    where duplicate.author_id = actor_id
      and duplicate.deleted_at is null
      and duplicate.created_at >= now() - interval '24 hours'
      and lower(replace(public.normalize_guestbook_body(duplicate.body), chr(8205), ''))
        = lower(replace(normalized_body, chr(8205), ''))
  ) then
    raise exception 'Duplicate Guestbook body within 24 hours'
      using errcode = '23505', detail = 'GUESTBOOK_DUPLICATE_BODY';
  end if;
  insert into public.guestbook_entries(
    author_id, parent_id, entry_type, body, rating, image_path,
    moderation_status, moderation_reasons
  ) values (
    actor_id, p_parent_id, p_entry_type, normalized_body, p_rating, p_image_path,
    next_status, next_reasons
  ) returning * into created_entry;
  insert into public.guestbook_mentions(entry_id, mentioned_user_id)
  select created_entry.id, mentioned_id
  from (select distinct unnest(coalesce(p_mentioned_user_ids, '{}'::uuid[])) mentioned_id) mentions
  join public.profiles profile on profile.id = mentions.mentioned_id
  where mentions.mentioned_id <> actor_id;
  return created_entry;
end;
$$;

create or replace function public.update_guestbook_entry(
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
  actor_id uuid := public.assert_guestbook_actor_allowed();
  existing_entry public.guestbook_entries;
  updated_entry public.guestbook_entries;
  classification jsonb;
  normalized_body text;
  next_status public.guestbook_moderation_status;
  next_reasons text[];
begin
  select * into existing_entry from public.guestbook_entries
  where id = p_entry_id for update;
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
      and duplicate.deleted_at is null
      and duplicate.created_at >= now() - interval '24 hours'
      and lower(replace(public.normalize_guestbook_body(duplicate.body), chr(8205), ''))
        = lower(replace(normalized_body, chr(8205), ''))
  ) then
    raise exception 'Duplicate Guestbook body within 24 hours'
      using errcode = '23505', detail = 'GUESTBOOK_DUPLICATE_BODY';
  end if;
  update public.guestbook_entries
  set body = normalized_body,
      entry_type = p_entry_type,
      rating = p_rating,
      image_path = p_image_path,
      moderation_status = next_status,
      moderation_reasons = next_reasons,
      is_pinned = case when next_status = 'visible' then is_pinned else false end
  where id = p_entry_id returning * into updated_entry;
  delete from public.guestbook_mentions where entry_id = p_entry_id;
  insert into public.guestbook_mentions(entry_id, mentioned_user_id)
  select p_entry_id, mentioned_id
  from (select distinct unnest(coalesce(p_mentioned_user_ids, '{}'::uuid[])) mentioned_id) mentions
  join public.profiles profile on profile.id = mentions.mentioned_id
  where mentions.mentioned_id <> actor_id;
  return updated_entry;
end;
$$;

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
  actor_id uuid := public.assert_guestbook_actor_allowed();
  existing_type public.guestbook_reaction_type;
begin
  perform public.consume_guestbook_rate_limit('reaction');
  if p_reaction_type not in ('thumb', 'dislike') then
    raise exception 'Unsupported reaction type' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.guestbook_entries entry
    where entry.id = p_entry_id and not entry.is_hidden and entry.deleted_at is null
      and (entry.root_id is null or public.is_guestbook_root_visible(entry.root_id))
  ) then raise exception 'Entry not found' using errcode = 'P0002'; end if;
  select reaction_type into existing_type from public.guestbook_reactions
  where entry_id = p_entry_id and user_id = actor_id;
  delete from public.guestbook_reactions where entry_id = p_entry_id and user_id = actor_id;
  if existing_type is distinct from p_reaction_type then
    insert into public.guestbook_reactions(entry_id, user_id, reaction_type)
    values (p_entry_id, actor_id, p_reaction_type);
  end if;
  return jsonb_build_object('entry_id', p_entry_id, 'reaction_type', p_reaction_type,
    'active', existing_type is distinct from p_reaction_type);
end;
$$;

create or replace function public.toggle_guestbook_portfolio_reaction(p_reaction_type text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare actor_id uuid := public.assert_guestbook_actor_allowed(); removed_count integer; reaction_total integer;
begin
  perform public.consume_guestbook_rate_limit('reaction');
  if p_reaction_type not in ('thumbs_up', 'heart', 'fire', 'clap', 'rocket') then
    raise exception 'Unsupported reaction type' using errcode = '22023';
  end if;
  delete from public.portfolio_reactions where user_id = actor_id and reaction_type = p_reaction_type;
  get diagnostics removed_count = row_count;
  if removed_count = 0 then
    insert into public.portfolio_reactions(user_id, reaction_type) values (actor_id, p_reaction_type);
  end if;
  select count(*)::integer into reaction_total from public.portfolio_reactions
  where reaction_type = p_reaction_type;
  return jsonb_build_object('reaction_type', p_reaction_type, 'active', removed_count = 0, 'count', reaction_total);
end;
$$;

create or replace function public.report_guestbook_entry(
  p_entry_id uuid,
  p_reason public.guestbook_report_reason,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare actor_id uuid := public.assert_guestbook_actor_allowed(); report_id uuid; target public.guestbook_entries;
begin
  perform public.consume_guestbook_rate_limit('report');
  select * into target from public.guestbook_entries where id = p_entry_id for update;
  if not found or target.is_hidden or target.deleted_at is not null
    or (target.root_id is not null and not public.is_guestbook_root_visible(target.root_id)) then
    raise exception 'Entry not found' using errcode = 'P0002';
  end if;
  if target.author_id = actor_id then
    raise exception 'Users cannot report their own content'
      using errcode = '42501', detail = 'GUESTBOOK_SELF_REPORT';
  end if;
  insert into public.guestbook_reports(entry_id, reporter_id, reason, note)
  values (p_entry_id, actor_id, p_reason, nullif(btrim(p_note), '')) returning id into report_id;
  if (select count(distinct reporter_id) from public.guestbook_reports where entry_id = p_entry_id) >= 3 then
    update public.guestbook_entries
    set moderation_status = 'quarantined', moderation_reasons = array['report_threshold'], is_pinned = false
    where id = p_entry_id and not is_hidden and deleted_at is null;
  end if;
  return report_id;
exception when unique_violation then
  raise exception 'Entry has already been reported' using errcode = '23505';
end;
$$;

create or replace function public.ensure_guestbook_profile()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare actor_id uuid := public.assert_guestbook_actor_allowed(); actor auth.users%rowtype; profile_name text; profile_avatar text;
begin
  select * into actor from auth.users where id = actor_id;
  if not found or coalesce(actor.raw_app_meta_data ->> 'provider', '') <> 'google' then
    raise exception 'A Google profile is required' using errcode = '42501';
  end if;
  profile_name := nullif(btrim(coalesce(actor.raw_user_meta_data ->> 'full_name', actor.raw_user_meta_data ->> 'name')), '');
  profile_avatar := nullif(btrim(coalesce(actor.raw_user_meta_data ->> 'avatar_url', actor.raw_user_meta_data ->> 'picture')), '');
  if profile_name is null then raise exception 'Google profile name is required' using errcode = '23514'; end if;
  insert into public.profiles(id, display_name, avatar_url)
  values (actor_id, left(profile_name, 120), profile_avatar)
  on conflict (id) do update set display_name = excluded.display_name, avatar_url = excluded.avatar_url, updated_at = now();
  return jsonb_build_object('id', actor_id);
end;
$$;

revoke all on function public.assert_guestbook_actor_allowed() from public, anon, authenticated;
revoke all on function public.consume_guestbook_rate_limit(text) from public, anon, authenticated;
revoke all on function public.normalize_guestbook_body(text) from public, anon, authenticated;
revoke all on function public.classify_guestbook_body(text) from public, anon, authenticated;
revoke all on function public.sync_guestbook_moderation_visibility() from public, anon, authenticated;
revoke all on function public.reject_blocked_guestbook_entry_mutation() from public, anon, authenticated;

commit;
