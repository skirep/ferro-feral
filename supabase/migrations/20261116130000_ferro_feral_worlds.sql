begin;

alter table public.ferro_feral_progress
  drop constraint ferro_feral_progress_unlocked_level_check,
  add constraint ferro_feral_progress_unlocked_level_check check (unlocked_level between 0 and 24);

create or replace function public.ferro_feral_save_progress(completed_level integer)
returns smallint
language plpgsql
security definer
set search_path = ''
as $$
declare
  player uuid := auth.uid();
  saved_level smallint;
begin
  if player is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if completed_level is null or completed_level not between 0 and 24 then
    raise exception 'Invalid level' using errcode = '22023';
  end if;

  insert into public.ferro_feral_progress as progress (user_id, unlocked_level)
  values (player, case when completed_level = 0 then 1 else 0 end)
  on conflict (user_id) do update
  set unlocked_level = greatest(progress.unlocked_level, least(24, completed_level + 1)),
      updated_at = now()
  where completed_level <= progress.unlocked_level
  returning unlocked_level into saved_level;

  if saved_level is null or saved_level < least(24, completed_level + 1) then
    raise exception 'Level locked' using errcode = '22023';
  end if;
  return saved_level;
end;
$$;

revoke all on function public.ferro_feral_save_progress(integer) from public, anon;
grant execute on function public.ferro_feral_save_progress(integer) to authenticated;

commit;
