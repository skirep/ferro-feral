begin;

create table public.ferro_feral_world_progress (
 user_id uuid not null references auth.users(id) on delete cascade,
 world_index smallint not null check (world_index between 0 and 4),
 unlocked_stage smallint not null check (unlocked_stage between 0 and 4),
 primary key (user_id, world_index)
);

insert into public.ferro_feral_world_progress (user_id, world_index, unlocked_stage)
select user_id, world, greatest(0, least(4, unlocked_level - world * 5))
from public.ferro_feral_progress
cross join generate_series(0,4) as stages(world);

alter table public.ferro_feral_world_progress enable row level security;
revoke all on public.ferro_feral_world_progress from public, anon, authenticated;
grant select on public.ferro_feral_world_progress to authenticated;
create policy "Players read their own world progress"
on public.ferro_feral_world_progress
for select to authenticated using ((select auth.uid()) = user_id);

create function public.ferro_feral_save_world_progress(completed_level integer)
returns smallint language plpgsql security definer set search_path = ''
as $$
declare
 player uuid := auth.uid();
 stage integer := completed_level % 5;
 world integer := completed_level / 5;
 saved smallint;
begin
 if player is null then
  raise exception 'Authentication required' using errcode = '42501';
 end if;
 if completed_level is null or completed_level not between 0 and 24 then
  raise exception 'Invalid level' using errcode = '22023';
 end if;
 insert into public.ferro_feral_world_progress as progress (user_id, world_index, unlocked_stage)
 values (player, world, case when stage = 0 then 1 else 0 end)
 on conflict (user_id, world_index) do update
 set unlocked_stage = greatest(progress.unlocked_stage, least(4, stage + 1))
 where stage <= progress.unlocked_stage
 returning unlocked_stage into saved;
 if saved is null or saved < least(4, stage + 1) then
  raise exception 'Level locked' using errcode = '22023';
 end if;
 return saved;
end;
$$;
revoke all on function public.ferro_feral_save_world_progress(integer) from public, anon;
grant execute on function public.ferro_feral_save_world_progress(integer) to authenticated;

commit;
