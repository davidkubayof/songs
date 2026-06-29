create table public.listening_rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  current_track jsonb,
  position double precision not null default 0,
  is_playing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.room_members (
  room_id uuid not null references public.listening_rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

alter table public.listening_rooms enable row level security;
alter table public.room_members enable row level security;

create or replace function public.is_premium_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('PremiumUser', 'Admin')
  );
$$;

create or replace function public.is_room_member(room uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.room_members
    where room_id = room and user_id = auth.uid()
  );
$$;

create policy rooms_insert_premium
  on public.listening_rooms for insert
  with check (auth.uid() = host_id and public.is_premium_or_admin());

create policy rooms_select_members
  on public.listening_rooms for select
  using (public.is_room_member(id) or host_id = auth.uid());

create policy rooms_update_host
  on public.listening_rooms for update
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

create policy room_members_select
  on public.room_members for select
  using (public.is_room_member(room_id) or user_id = auth.uid());

create policy room_members_insert_self
  on public.room_members for insert
  with check (auth.uid() = user_id);

create policy room_members_delete_self
  on public.room_members for delete
  using (auth.uid() = user_id);
