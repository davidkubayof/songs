import { Home, Library, Radio, Search, User } from 'lucide-react';
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
  { href: '/rooms', label: 'Rooms', icon: Radio },
  { href: '/profile', label: 'Profile', icon: User },
];
