-- Run in a disposable Supabase database after applying the migration.
begin;

insert into auth.users (id)
values ('10000000-0000-4000-8000-000000000001'),
       ('10000000-0000-4000-8000-000000000002');

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);

do $$
begin
  begin
    perform public.ferro_feral_save_progress(4);
    raise exception 'A locked level was accepted';
  exception when invalid_parameter_value then null;
  end;
  if public.ferro_feral_save_progress(0) <> 1 then
    raise exception 'First clear did not unlock the next level';
  end if;
  if public.ferro_feral_save_progress(1) <> 2 then
    raise exception 'Second clear did not unlock the next level';
  end if;
  if public.ferro_feral_save_progress(0) <> 2 then
    raise exception 'Repeating a level lowered the unlock';
  end if;
  if (select unlocked_level from public.ferro_feral_progress) is distinct from 2 then
    raise exception 'Owner cannot read saved progress';
  end if;
  begin
    update public.ferro_feral_progress set unlocked_level = 4;
    raise exception 'Direct progress update was accepted';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
do $$
begin
  if exists (select 1 from public.ferro_feral_progress) then
    raise exception 'Another player can read private progress';
  end if;
end;
$$;

reset role;
set local role anon;
do $$
begin
  begin
    perform public.ferro_feral_save_progress(0);
    raise exception 'Anonymous progress write was accepted';
  exception when insufficient_privilege then null;
  end;
end;
$$;

rollback;
