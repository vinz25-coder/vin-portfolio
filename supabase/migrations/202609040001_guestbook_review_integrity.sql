begin;

do $$
begin
  if exists (
    select 1
    from public.guestbook_entries
    where parent_id is null
      and entry_type = 'review'
      and deleted_at is null
    group by author_id
    having count(*) > 1
  ) then
    raise exception 'Resolve duplicate active guestbook reviews before applying this migration';
  end if;
end;
$$;

create unique index guestbook_entries_one_active_review_per_author_idx
  on public.guestbook_entries (author_id)
  where parent_id is null
    and entry_type = 'review'
    and deleted_at is null;

create function public.keep_guestbook_entry_type()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.entry_type <> old.entry_type then
    raise exception 'Guestbook entry type cannot be changed' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger guestbook_entries_keep_type
before update of entry_type on public.guestbook_entries
for each row execute function public.keep_guestbook_entry_type();

create function public.guestbook_my_active_review()
returns public.guestbook_entries
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select entry
  from public.guestbook_entries entry
  where entry.author_id = auth.uid()
    and entry.parent_id is null
    and entry.entry_type = 'review'
    and entry.deleted_at is null
  limit 1;
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
  actor_id uuid := auth.uid();
  removed_count integer;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_reaction_type not in ('thumb', 'heart', 'clap') then
    raise exception 'Unsupported reaction type' using errcode = '22023';
  end if;
  if not exists (
    select 1
    from public.guestbook_entries
    where id = p_entry_id and not is_hidden and deleted_at is null
  ) then
    raise exception 'Entry not found' using errcode = 'P0002';
  end if;

  delete from public.guestbook_reactions
  where entry_id = p_entry_id
    and user_id = actor_id
    and reaction_type = p_reaction_type;
  get diagnostics removed_count = row_count;

  if removed_count = 0 then
    insert into public.guestbook_reactions (entry_id, user_id, reaction_type)
    values (p_entry_id, actor_id, p_reaction_type);
  end if;

  return jsonb_build_object(
    'entry_id', p_entry_id,
    'reaction_type', p_reaction_type,
    'active', removed_count = 0
  );
end;
$$;

revoke all on function public.keep_guestbook_entry_type() from public, anon, authenticated;
revoke all on function public.guestbook_my_active_review() from public;
grant execute on function public.guestbook_my_active_review() to authenticated;

commit;
