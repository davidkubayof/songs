'use client';

import { usePathname } from 'next/navigation';

import { TAB_ITEMS } from '@/constants/navigation';
import { TabBarItem } from '@/components/tab-bar/TabBarItem';

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-50 border-t border-white/10 px-safe pb-safe shadow-[0_-8px_32px_rgba(0,0,0,0.4)]"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-[4.5rem] max-w-lg items-center gap-1 px-2">
        {TAB_ITEMS.map((tab) => (
          <TabBarItem
            key={tab.href}
            href={tab.href}
            label={tab.label}
            icon={tab.icon}
            active={
              tab.href === '/'
                ? pathname === '/'
                : pathname.startsWith(tab.href)
            }
          />
        ))}
      </div>
    </nav>
  );
}
