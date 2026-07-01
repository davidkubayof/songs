alter table public.profiles
  add column is_deleted boolean not null default false;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'Admin' and is_deleted = false
  );
$$;

drop policy profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles for select
  using (auth.uid() = id and is_deleted = false);

drop policy profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles for update
  using (auth.uid() = id and is_deleted = false)
  with check (auth.uid() = id and is_deleted = false);

create or replace function public.restore_own_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set is_deleted = false
  where id = auth.uid() and is_deleted = true;
end;
$$;
