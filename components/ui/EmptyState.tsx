import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  variant?: 'violet' | 'blue' | 'rose';
}

const GLOW: Record<string, string> = {
  violet: 'from-violet-600/30 via-fuchsia-500/10 to-transparent',
  blue: 'from-blue-600/30 via-cyan-500/10 to-transparent',
  rose: 'from-rose-600/30 via-orange-500/10 to-transparent',
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'violet',
}: EmptyStateProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl px-4 py-12 text-center">
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${GLOW[variant]}`}
      />
      <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/5 shadow-lg shadow-violet-500/10">
        <Icon className="h-9 w-9 text-violet-200" strokeWidth={1.25} />
      </div>
      <h3 className="relative text-lg font-semibold tracking-tight text-white">
        {title}
      </h3>
      <p className="relative mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">
        {description}
      </p>
      {action && <div className="relative mt-6">{action}</div>}
    </div>
  );
}
