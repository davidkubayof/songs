import { MiniPlayer } from '@/components/player/MiniPlayer';
import { PlayerShell } from '@/components/player/PlayerShell';
import { RoomSyncProvider } from '@/components/providers/RoomSyncProvider';
import { StoreHydrator } from '@/components/providers/StoreHydrator';
import { TabBar } from '@/components/tab-bar/TabBar';

interface MainShellProps {
  children: React.ReactNode;
}

export function MainShell({ children }: MainShellProps) {
  return (
    <div className="flex min-h-full flex-col">
      <StoreHydrator />
      <RoomSyncProvider />
      <div className="flex-1 tab-bar-offset">{children}</div>
      <PlayerShell />
      <MiniPlayer />
      <TabBar />
    </div>
  );
}
