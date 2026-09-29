import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SCOPE_STEPS = ['Requirements', 'Documents', 'Review and lock'] as const;

export function ScopeStepper({ step, onStep, done }: { step: number; onStep: (n: number) => void; done: boolean[] }) {
  return (
    <ol className="mb-5 flex items-center gap-3" aria-label="Scoping steps">
      {SCOPE_STEPS.map((label, i) => (
        <li key={label} className="flex flex-1 items-center gap-3">
          <button
            type="button"
            onClick={() => onStep(i)}
            aria-current={step === i ? 'step' : undefined}
            className={cn('flex items-center gap-2 rounded-lg px-2 py-1 text-sm', step === i ? 'font-semibold text-green-900' : 'text-ink-2 hover:text-ink')}
          >
            <span className={cn('flex size-6 items-center justify-center rounded-full border text-xs', done[i] ? 'border-green-600 bg-green-600 text-white' : step === i ? 'border-green-600 text-green-700' : 'border-[#b9c3c3]')}>
              {done[i] ? <Check className="size-3.5" aria-hidden /> : i + 1}
            </span>
            {label}
          </button>
          {i < SCOPE_STEPS.length - 1 && <span className="h-px flex-1 bg-line" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}
