create table public.playlist_tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  track_id text not null,
  track_data jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, track_id)
);

alter table public.playlist_tracks enable row level security;

create policy playlist_tracks_select_own
  on public.playlist_tracks for select
  using (auth.uid() = user_id);

create policy playlist_tracks_insert_own
  on public.playlist_tracks for insert
  with check (auth.uid() = user_id);

create policy playlist_tracks_delete_own
  on public.playlist_tracks for delete
  using (auth.uid() = user_id);

create index playlist_tracks_user_id_idx on public.playlist_tracks (user_id);
