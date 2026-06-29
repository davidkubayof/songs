export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-semibold">You are offline</h1>
      <p className="text-sm text-zinc-400">
        Your guest playlist is still available when you reconnect.
      </p>
    </main>
  );
}
