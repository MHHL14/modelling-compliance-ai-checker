import { cn } from '@/lib/utils';

export function ProgressSegments({ states, labels }: { states: ('done' | 'current' | 'todo')[]; labels: readonly string[] }) {
  return (
    <div className="flex gap-1" role="img" aria-label={labels.map((l, i) => `${l}: ${states[i]}`).join(', ')}>
      {states.map((s, i) => (
        <span key={labels[i]} title={labels[i]} className={cn('h-1.5 flex-1 rounded-full', s === 'done' ? 'bg-green-600' : s === 'current' ? 'bg-yellow' : 'bg-line')} />
      ))}
    </div>
  );
}
