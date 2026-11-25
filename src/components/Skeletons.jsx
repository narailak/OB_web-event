import { Radio } from 'lucide-react';

export function BootLoadingScreen({ message = 'กำลังเชื่อมต่อระบบ OB Livestreaming...' }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 px-6 text-center">
      <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg shadow-red-950/20">
        <Radio className="h-8 w-8 text-red-500" />
        <span className="animate-live-dot absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-zinc-950 bg-red-500" />
      </div>
      <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1">
        <span className="animate-live-dot h-2 w-2 rounded-full bg-red-500" />
        <span className="font-mono-tech text-[11px] font-semibold tracking-wider text-red-400 uppercase">
          OB STUDIO INIT
        </span>
      </div>
      <p className="mt-2 text-sm font-medium text-zinc-300">{message}</p>
      <div className="mt-6 h-1 w-48 overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-red-600 to-rose-400" />
      </div>
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="h-5 w-24 rounded-md bg-zinc-800" />
        <div className="h-5 w-16 rounded-full bg-zinc-800" />
      </div>
      <div className="mt-3 h-6 w-3/4 rounded-lg bg-zinc-800" />
      <div className="mt-3 space-y-2">
        <div className="h-4 w-1/2 rounded bg-zinc-800/80" />
        <div className="h-4 w-2/3 rounded bg-zinc-800/80" />
      </div>
      <div className="mt-4 h-10 w-full rounded-xl bg-zinc-800" />
    </div>
  );
}
