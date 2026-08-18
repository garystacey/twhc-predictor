create or replace function public.team_name_exists(check_team_name text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where lower(trim(team_name)) = lower(trim(check_team_name))
  );
$$;

revoke execute on function public.team_name_exists(text) from public;
revoke execute on function public.team_name_exists(text) from authenticated;

grant execute on function public.team_name_exists(text) to anon;
