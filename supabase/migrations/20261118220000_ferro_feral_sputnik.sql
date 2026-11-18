begin;

alter table public.ferro_feral_world_progress
 drop constraint ferro_feral_world_progress_world_index_check,
 add constraint ferro_feral_world_progress_world_index_check check (world_index between 0 and 5);

create or replace function public.ferro_feral_save_world_progress(completed_level integer)
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
 if completed_level is null or completed_level not between 0 and 29 then
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
commit;
