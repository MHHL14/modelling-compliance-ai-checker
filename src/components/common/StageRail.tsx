'use client';
import { Check, Circle, CircleDot, Lock } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export type StageStatus = 'done' | 'current' | 'todo' | 'locked' | 'optional';
export interface Stage {
  key: string;
  label: string;
  href: string;
  status: StageStatus;
  note?: string;
}

export function StageRail({ title, subtitle, stages, footer }: { title: React.ReactNode; subtitle?: React.ReactNode; stages: Stage[]; footer?: React.ReactNode }) {
  const path = usePathname();
  return (
    <nav aria-label="Stages" className="no-print w-full shrink-0 lg:sticky lg:top-4 lg:w-60">
      <div className="rounded-[12px] border border-line bg-white p-3">
        <div className="px-2 pb-3 pt-1">
          <div className="text-sm font-semibold leading-snug text-ink">{title}</div>
          {subtitle && <div className="mt-0.5 text-xs text-ink-2">{subtitle}</div>}
        </div>
        <ol className="relative space-y-0.5">
          {stages.map((s, i) => {
            const active = path === s.href;
            const Icon = s.status === 'done' ? Check : s.status === 'locked' ? Lock : s.status === 'current' ? CircleDot : Circle;
            return (
              <li key={s.key}>
                <Link
                  href={s.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn('flex items-start gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors', active ? 'bg-green-50 text-green-900' : 'text-ink hover:bg-bg')}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px]',
                      s.status === 'done' && 'border-green-600 bg-green-600 text-white',
                      s.status === 'current' && 'border-green-600 text-green-600',
                      (s.status === 'todo' || s.status === 'optional') && 'border-[#b9c3c3] text-ink-3',
                      s.status === 'locked' && 'border-[#b9c3c3] bg-bg text-ink-3',
                    )}
                  >
                    <Icon className="size-3" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className={cn('block font-medium', active && 'font-semibold')}>
                      {s.key !== 'overview' && <span className="mr-1 text-ink-3">{i + (stages[0]?.key === 'overview' ? 0 : 1)}.</span>}
                      {s.label}
                    </span>
                    {s.note && <span className="block text-xs text-ink-2">{s.note}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
        {footer && <div className="mt-3 border-t border-line px-2 pt-3">{footer}</div>}
      </div>
    </nav>
  );
}
