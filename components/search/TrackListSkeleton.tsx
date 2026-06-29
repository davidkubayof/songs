function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-1 py-3">
      <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-zinc-800" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-800" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-800" />
      </div>
    </div>
  );
}

interface TrackListSkeletonProps {
  count?: number;
}

export function TrackListSkeleton({ count = 6 }: TrackListSkeletonProps) {
  return (
    <div className="flex flex-col" aria-busy="true" aria-label="Loading results">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
