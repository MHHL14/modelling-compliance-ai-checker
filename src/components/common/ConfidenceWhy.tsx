'use client';
import { ChevronDown, CircleCheck, CircleMinus, CircleX } from 'lucide-react';
import { useState } from 'react';
import { FACTOR_DESCRIPTION, FACTOR_KEYS, FACTOR_LABEL } from '@/lib/confidence';
import { cn } from '@/lib/utils';
import type { Confidence, ConfidenceFactors } from '@/lib/types';
import { ConfidencePill } from './badges';

const ICON = { good: CircleCheck, weak: CircleMinus, bad: CircleX };
const COLOR = { good: 'text-green-600', weak: 'text-amber', bad: 'text-red' };

export function FactorList({ factors }: { factors: ConfidenceFactors }) {
  return (
    <ul className="space-y-1.5">
      {FACTOR_KEYS.map((k) => {
        const lvl = factors.levels[k];
        const Icon = ICON[lvl];
        return (
          <li key={k} className="flex gap-2 text-sm">
            <Icon className={cn('mt-0.5 size-4 shrink-0', COLOR[lvl])} aria-hidden />
            <div>
              <span className="font-medium">{FACTOR_LABEL[k]}</span>
              <span className={cn('ml-1 text-xs font-semibold uppercase', COLOR[lvl])}>{lvl}</span>
              <span className="text-ink-2"> — {factors.notes[k] ?? FACTOR_DESCRIPTION[k][lvl]}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function ConfidenceWhy({ confidence, factors, defaultOpen = false }: { confidence: Confidence; factors: ConfidenceFactors; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-line bg-white">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left">
        <span className="flex items-center gap-2 text-sm font-medium">
          Confidence: <ConfidencePill confidence={confidence} /> <span className="text-green-800 underline underline-offset-2">Why?</span>
        </span>
        <ChevronDown className={cn('size-4 text-ink-3 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div className="border-t border-line px-3 py-3">
          <FactorList factors={factors} />
          <p className="mt-3 text-xs text-ink-3">
            Rule: High = all factors good (or only verifiability weak) · Medium = exactly one other factor weak · Low = any factor bad, or two or more weak.
          </p>
        </div>
      )}
    </div>
  );
}
