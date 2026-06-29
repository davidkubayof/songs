alter publication supabase_realtime add table public.listening_rooms;

create or replace function public.touch_room_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listening_rooms_updated_at
  before update on public.listening_rooms
  for each row execute function public.touch_room_updated_at();
