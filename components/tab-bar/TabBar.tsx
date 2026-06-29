'use client';

import { usePathname } from 'next/navigation';

import { TAB_ITEMS } from '@/constants/navigation';
import { TabBarItem } from '@/components/tab-bar/TabBarItem';

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-b-0 px-safe pb-safe"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-[4.5rem] max-w-lg items-center justify-around">
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
