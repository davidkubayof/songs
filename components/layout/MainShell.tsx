import { TabBar } from '@/components/tab-bar/TabBar';

interface MainShellProps {
  children: React.ReactNode;
}

export function MainShell({ children }: MainShellProps) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 tab-bar-offset">{children}</div>
      <TabBar />
    </div>
  );
}
