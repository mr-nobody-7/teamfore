"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="font-display text-2xl tracking-tight">TeamFore</span>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">You&apos;re offline</h1>
        <p className="text-zinc-400 max-w-sm">
          No internet connection. Your last-viewed pages are still available —
          try navigating to /dashboard or /leaves.
        </p>
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-lg bg-[#0F6E56] px-5 py-2.5 text-sm font-medium hover:bg-[#0d5e48] transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
