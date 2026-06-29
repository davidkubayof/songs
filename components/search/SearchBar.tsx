'use client';

import { Search } from 'lucide-react';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SearchBar({ value, onChange, className }: SearchBarProps) {
  return (
    <GlassPanel className={cn('flex items-center gap-3 px-4 py-3', className)}>
      <Search className="h-5 w-5 shrink-0 text-zinc-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search songs, artists..."
        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
        autoComplete="off"
        enterKeyHint="search"
      />
    </GlassPanel>
  );
}
