import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-full bg-gradient-to-b from-zinc-950 to-black">
      <div className="mx-auto max-w-3xl px-4 pt-safe pb-8">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-2 pt-4 text-sm text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to app
        </Link>
        {children}
      </div>
    </div>
  );
}
