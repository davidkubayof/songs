import { GlassPanel } from '@/components/ui/GlassPanel';

export default function LibraryPage() {
  return (
    <div className="flex flex-col gap-6 px-4 pt-safe">
      <header className="pt-4">
        <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
        <p className="mt-1 text-sm text-zinc-400">Your playlists and saved tracks</p>
      </header>
      <GlassPanel className="flex flex-col items-center p-8 text-center">
        <p className="text-sm text-zinc-400">Your library is empty</p>
        <p className="mt-2 text-xs text-zinc-500">
          Playlists will appear here in a future update
        </p>
      </GlassPanel>
    </div>
  );
}
