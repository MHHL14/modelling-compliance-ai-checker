'use client';
import { Loader2 } from 'lucide-react';
import { useRunProgress } from '@/lib/ai/provider';

export function RunProgressOverlay() {
  const { open, title, step, pct } = useRunProgress();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-green-900/25 backdrop-blur-[1px]" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-[420px] max-w-[92vw] rounded-[12px] border border-line bg-white p-5 shadow-xl">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Loader2 className="size-4 animate-spin text-green-600" aria-hidden /> {title}
        </div>
        <p className="mt-2 font-mono text-xs text-ink-2" aria-live="polite">{step}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-green-50">
          <div className="h-full rounded-full bg-green-600 transition-[width] duration-200" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-ink-3">AI output will be labelled “AI draft” until a human decides.</p>
      </div>
    </div>
  );
}
