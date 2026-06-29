'use client';

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-safe">
      <header className="pt-4">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-1 text-sm text-zinc-400">Protected admin area</p>
      </header>
    </div>
  );
}
