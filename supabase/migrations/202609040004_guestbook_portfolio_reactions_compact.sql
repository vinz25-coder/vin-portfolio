begin;

delete from public.portfolio_reactions
where reaction_type not in ('thumbs_up', 'heart', 'fire', 'clap', 'rocket');

alter table public.portfolio_reactions
  drop constraint portfolio_reactions_reaction_type_check;

alter table public.portfolio_reactions
  add constraint portfolio_reactions_reaction_type_check
  check (reaction_type in ('thumbs_up', 'heart', 'fire', 'clap', 'rocket'));

create or replace function public.guestbook_portfolio_reaction_summary()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  with reaction_types(reaction_type, sort_order) as (
    values
      ('thumbs_up', 1), ('heart', 2), ('fire', 3), ('clap', 4), ('rocket', 5)
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

create or replace function public.toggle_guestbook_portfolio_reaction(p_reaction_type text)
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
  if p_reaction_type not in ('thumbs_up', 'heart', 'fire', 'clap', 'rocket') then
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

commit;
