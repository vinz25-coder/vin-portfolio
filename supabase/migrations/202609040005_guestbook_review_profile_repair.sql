begin;

insert into public.profiles (id, display_name, avatar_url)
select
  users.id,
  left(nullif(btrim(coalesce(
    users.raw_user_meta_data ->> 'full_name',
    users.raw_user_meta_data ->> 'name'
  )), ''), 120),
  nullif(btrim(coalesce(
    users.raw_user_meta_data ->> 'avatar_url',
    users.raw_user_meta_data ->> 'picture'
  )), '')
from auth.users users
where coalesce(users.raw_app_meta_data ->> 'provider', '') = 'google'
  and nullif(btrim(coalesce(
    users.raw_user_meta_data ->> 'full_name',
    users.raw_user_meta_data ->> 'name'
  )), '') is not null
on conflict (id) do update
set display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    updated_at = now();

create function public.ensure_guestbook_profile()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  actor_id uuid := auth.uid();
  actor auth.users%rowtype;
  profile_name text;
  profile_avatar text;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into actor from auth.users where id = actor_id;
  if not found or coalesce(actor.raw_app_meta_data ->> 'provider', '') <> 'google' then
    raise exception 'A Google profile is required' using errcode = '42501';
  end if;

  profile_name := nullif(btrim(coalesce(
    actor.raw_user_meta_data ->> 'full_name',
    actor.raw_user_meta_data ->> 'name'
  )), '');
  profile_avatar := nullif(btrim(coalesce(
    actor.raw_user_meta_data ->> 'avatar_url',
    actor.raw_user_meta_data ->> 'picture'
  )), '');

  if profile_name is null then
    raise exception 'Google profile name is required' using errcode = '23514';
  end if;

  insert into public.profiles (id, display_name, avatar_url)
  values (actor_id, left(profile_name, 120), profile_avatar)
  on conflict (id) do update
  set display_name = excluded.display_name,
      avatar_url = excluded.avatar_url,
      updated_at = now();

  return jsonb_build_object('id', actor_id);
end;
$$;

drop function public.guestbook_my_active_review();

create function public.guestbook_my_active_review()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select to_jsonb(entry)
  from public.guestbook_entries entry
  where entry.author_id = auth.uid()
    and entry.parent_id is null
    and entry.entry_type = 'review'
    and entry.deleted_at is null
  order by entry.created_at desc, entry.id desc
  limit 1;
$$;

revoke all on function public.ensure_guestbook_profile() from public, anon;
revoke all on function public.guestbook_my_active_review() from public, anon;
grant execute on function public.ensure_guestbook_profile() to authenticated;
grant execute on function public.guestbook_my_active_review() to authenticated;

commit;
