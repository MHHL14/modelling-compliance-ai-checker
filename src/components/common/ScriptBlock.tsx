import { Terminal } from 'lucide-react';
import type { ScriptResult } from '@/lib/types';
import { ScriptBadge } from './badges';

export function ScriptBlock({ script }: { script: ScriptResult }) {
  return (
    <div className="rounded-lg border border-[#d6d6d6] bg-[#f4f4f4] p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <ScriptBadge id={script.id} result={script.result} />
        <span className="text-xs text-ink-3">Deterministic check — not AI judgement</span>
      </div>
      <p className="flex items-start gap-2 font-mono text-xs text-[#333]">
        <Terminal className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {script.detail}
      </p>
    </div>
  );
}
