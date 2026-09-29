import Link from 'next/link';
import { FamilyBadge } from '@/components/common/badges';
import { ProgressSegments } from '@/components/common/ProgressSegments';
import { fmtDateTime } from '@/lib/clock';
import { cn } from '@/lib/utils';

export function UseCaseCard(p: {
  href: string; title: string; subtitle: string; family: string; stage: string; completed?: boolean;
  states: ('done' | 'current' | 'todo')[]; labels: readonly string[]; updatedAt?: string;
}) {
  return (
    <Link href={p.href} className={cn('flex flex-col gap-2 rounded-[12px] border border-line bg-white p-4 transition-shadow hover:shadow-md focus-visible:outline-green-600', p.completed && 'bg-bg/40')}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold leading-snug text-ink">{p.title}</p>
        <FamilyBadge family={p.family} />
      </div>
      <p className="text-xs text-ink-2">{p.subtitle}</p>
      <p className="text-sm font-medium text-ink">{p.stage}</p>
      <ProgressSegments states={p.states} labels={p.labels} />
      {p.updatedAt && <p className="text-xs text-ink-3">Last activity {fmtDateTime(p.updatedAt)}</p>}
    </Link>
  );
}
