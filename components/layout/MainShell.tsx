import { NowPlayingBar } from '@/components/player/NowPlayingBar';
import { PageMotion } from '@/components/layout/PageMotion';
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
      <PageMotion>
        <div className="flex-1 shell-offset">{children}</div>
      </PageMotion>
      <NowPlayingBar />
      <TabBar />
    </div>
  );
}
