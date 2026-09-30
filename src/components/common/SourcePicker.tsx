'use client';
import { ChevronDown, Lock, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BindingBadge } from '@/components/common/badges';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { libraryLoaded, libraryReqs } from '@/lib/content';
import { MANDATORY_SOURCES, SELECTABLE_SOURCES, SOURCE_GROUPS } from '@/lib/engine/sources';
import { cn } from '@/lib/utils';

/** The user selects the requirement sources; nothing is decided by the AI (spec §12.2). */
export function SourcePicker({ selected, onToggle, readOnly }: { selected: string[]; onToggle: (docId: string, on: boolean) => void; readOnly?: boolean }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Set<string>>(new Set(['pol', 'std']));
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    if (libraryLoaded()) for (const r of libraryReqs()) if (r.layer !== '2lod') m.set(r.docId, (m.get(r.docId) ?? 0) + 1);
    return m;
  }, []);
  const ql = q.trim().toLowerCase();
  const docs = SELECTABLE_SOURCES.filter((d) => !ql || `${d.title} ${d.reference} ${d.issuer} ${d.key_topics.join(' ')}`.toLowerCase().includes(ql));
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search regulation, guideline, standard or topic" className="pl-8" aria-label="Search requirement sources" />
      </div>
      {SOURCE_GROUPS.map((g) => {
        const list = docs.filter(g.match);
        if (!list.length) return null;
        const isOpen = open.has(g.key) || !!ql;
        const nSel = list.filter((d) => selected.includes(d.id)).length;
        return (
          <div key={g.key} className="rounded-lg border border-line">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen((s) => { const n = new Set(s); if (n.has(g.key)) n.delete(g.key); else n.add(g.key); return n; })}
              className="flex w-full items-center gap-2 bg-bg/70 px-3 py-2 text-left text-sm font-semibold text-ink"
            >
              <ChevronDown className={cn('size-4 text-ink-3 transition-transform', !isOpen && '-rotate-90')} aria-hidden />
              {g.label}
              <span className="ml-auto text-xs font-normal text-ink-2">
                {nSel} of {list.length} selected
              </span>
            </button>
            {isOpen && (
              <ul className="divide-y divide-line">
                {list.map((d) => {
                  const mandatory = MANDATORY_SOURCES.includes(d.id);
                  const checked = selected.includes(d.id) || mandatory;
                  return (
                    <li key={d.id}>
                      <label className={cn('flex cursor-pointer items-start gap-3 px-3 py-2.5', checked && 'bg-green-50/60', (readOnly || mandatory) && 'cursor-default')}>
                        <Checkbox checked={checked} disabled={readOnly || mandatory} onCheckedChange={(v) => onToggle(d.id, !!v)} className="mt-0.5" aria-label={d.title} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-ink">{d.title}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-2">
                            <BindingBadge level={d.binding_level} />
                            {d.reference} · {d.version_date}
                            {counts.get(d.id) ? <span className="text-ink-3">· {counts.get(d.id)} requirements in library</span> : null}
                          </span>
                        </span>
                        {mandatory && (
                          <span className="flex shrink-0 items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-medium text-yellow-ink">
                            <Lock className="size-3" aria-hidden /> Mandatory internal base
                          </span>
                        )}
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
