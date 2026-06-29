import Link from 'next/link';

import { cn } from '@/lib/utils';

interface TabBarItemProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  active: boolean;
}

export function TabBarItem({ href, label, icon: Icon, active }: TabBarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 transition-all',
        active ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </Link>
  );
}
