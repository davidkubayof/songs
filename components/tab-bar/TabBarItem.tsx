import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface TabBarItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}

export function TabBarItem({ href, label, icon: Icon, active }: TabBarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex flex-1 flex-col items-center gap-1 py-2 transition-colors',
        active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </Link>
  );
}
