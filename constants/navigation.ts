import { Home, Library, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface TabItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const TAB_ITEMS: TabItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/library', label: 'Library', icon: Library },
];
