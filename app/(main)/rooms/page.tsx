import { RoomPanel } from '@/components/rooms/RoomPanel';

export default function RoomsPage() {
  return (
    <div className="flex flex-col gap-6 px-4 pt-safe">
      <header className="pt-4">
        <h1 className="text-2xl font-semibold tracking-tight">Rooms</h1>
        <p className="mt-1 text-sm text-zinc-400">Listen together in real time</p>
      </header>
      <RoomPanel />
    </div>
  );
}
