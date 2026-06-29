import { GlassPanel } from '@/components/ui/GlassPanel';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6 px-4 pt-safe">
      <header className="pt-4">
        <h1 className="text-2xl font-semibold tracking-tight">Songs</h1>
        <p className="mt-1 text-sm text-zinc-400">Your music, anywhere</p>
      </header>
      <GlassPanel className="p-6">
        <h2 className="text-lg font-medium">Welcome back</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Search for tracks or browse your library.
        </p>
      </GlassPanel>
    </div>
  );
}
