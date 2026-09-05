begin;

create table public.guestbook_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique check (char_length(endpoint) between 16 and 2048),
  p256dh text not null check (char_length(p256dh) between 16 and 512),
  auth text not null check (char_length(auth) between 8 and 256),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.guestbook_push_deliveries (
  id uuid primary key default gen_random_uuid(),
  reply_id uuid not null references public.guestbook_entries (id) on delete cascade,
  subscription_id uuid not null references public.guestbook_push_subscriptions (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (reply_id, subscription_id)
);

alter table public.guestbook_entries
add column reply_recipient_id uuid references public.profiles (id) on delete set null;

create or replace function public.prepare_guestbook_entry()
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
    new.reply_recipient_id := null;
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

  new.reply_recipient_id := parent_entry.author_id;
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

create function public.guestbook_community_summary()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'total_reviews', count(*) filter (where entry_type = 'review'),
    'total_discussions', count(*) filter (where entry_type = 'discussion'),
    'average_rating', coalesce(
      avg(rating) filter (where entry_type = 'review'),
      0
    )::numeric(3, 2)
  )
  from public.guestbook_entries
  where parent_id is null
    and not is_hidden
    and deleted_at is null;
$$;

create trigger guestbook_push_subscriptions_set_updated_at
before update on public.guestbook_push_subscriptions
for each row execute function public.set_updated_at();

alter table public.guestbook_push_subscriptions enable row level security;
alter table public.guestbook_push_deliveries enable row level security;

revoke all on public.guestbook_push_subscriptions from anon, authenticated;
revoke all on public.guestbook_push_deliveries from anon, authenticated;
revoke all on function public.guestbook_community_summary() from public;
grant execute on function public.guestbook_community_summary() to anon, authenticated;

commit;
