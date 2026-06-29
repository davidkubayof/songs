'use client';

import { LayoutGrid, List } from 'lucide-react';

import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="flex gap-1 rounded-xl bg-white/5 p-1">
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={cn(
          'rounded-lg p-2',
          mode === 'grid' ? 'bg-white/15 text-white' : 'text-zinc-500',
        )}
        aria-label="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={cn(
          'rounded-lg p-2',
          mode === 'list' ? 'bg-white/15 text-white' : 'text-zinc-500',
        )}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
