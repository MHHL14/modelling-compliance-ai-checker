'use client';
import { Bot } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { ViewerDoc } from '@/lib/types';

export interface Highlight {
  section: string;
  quote?: string;
  kind: 'cite' | 'gap';
  active?: boolean;
  id?: string;
}

function renderMarked(text: string) {
  // {{...}} marks numbers that come from a script / data source
  const parts = text.split(/(\{\{.*?\}\})/g);
  return parts.map((p, i) =>
    p.startsWith('{{') ? (
      <span key={i} className="script-num" title="From script (exclusion log / profiling run)">
        {p.slice(2, -2)}
      </span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

function highlightText(text: string, hs: Highlight[]) {
  const ranges: { start: number; end: number; h: Highlight }[] = [];
  for (const h of hs) {
    if (!h.quote) continue;
    const idx = text.indexOf(h.quote);
    if (idx >= 0) ranges.push({ start: idx, end: idx + h.quote.length, h });
  }
  // gap markers win over overlapping citations
  ranges.sort((a, b) => a.start - b.start || (a.h.kind === 'gap' ? -1 : 1) - (b.h.kind === 'gap' ? -1 : 1));
  const out: React.ReactNode[] = [];
  let pos = 0;
  ranges.forEach((r, i) => {
    if (r.start < pos) return;
    if (r.start > pos) out.push(<span key={`t${i}`}>{text.slice(pos, r.start)}</span>);
    out.push(
      <mark
        key={`m${i}`}
        data-active={r.h.active ? 'true' : undefined}
        className={cn(r.h.kind === 'gap' ? 'gap' : 'cite', r.h.active && r.h.kind === 'cite' && 'cite-active')}
        title={r.h.kind === 'gap' ? 'Gap location' : 'Cited evidence'}
      >
        {text.slice(r.start, r.end)}
      </mark>,
    );
    pos = r.end;
  });
  if (pos < text.length) out.push(<span key="end">{text.slice(pos)}</span>);
  return out;
}

export function DocumentPane({
  doc,
  highlights = [],
  className,
  scrollKey,
}: {
  doc: ViewerDoc;
  highlights?: Highlight[];
  className?: string;
  scrollKey?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const active = highlights.find((h) => h.active);
    if (!active) return;
    const target =
      (root.querySelector('mark[data-active="true"]') as HTMLElement | null) ?? (root.querySelector(`[data-section="${CSS.escape(active.section)}"]`) as HTMLElement | null);
    if (target) {
      const top = target.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - 80;
      root.scrollTo({ top, behavior: 'smooth' });
    }
  }, [scrollKey, highlights]);

  return (
    <div ref={ref} className={cn('overflow-y-auto bg-white', className)}>
      <article className="doc-serif mx-auto max-w-[680px] px-8 py-8 text-[15px] leading-7 text-ink">
        <header className="mb-6 border-b border-line pb-4">
          <p className="font-sans text-xs uppercase tracking-wider text-ink-3">{doc.id} · version {doc.version}</p>
          <h2 className="mt-1 text-xl font-semibold leading-snug">{doc.title}</h2>
        </header>
        {doc.sections.map((s) => {
          const hs = highlights.filter((h) => h.section === s.section);
          const sectionGap = hs.some((h) => h.kind === 'gap' && !h.quote);
          const blocks = doc.aiBlocks?.[s.section] ?? [];
          return (
            <section key={s.section} data-section={s.section} className={cn('mb-5 scroll-mt-20', sectionGap && 'rounded bg-red-100/50 ring-1 ring-red/30 -mx-2 px-2')}>
              <h3 className="mb-1 font-semibold">
                <span className="mr-2 text-ink-3">{s.section}</span>
                {s.heading}
              </h3>
              <p>{highlightText(s.text, hs)}</p>
              {blocks.map((b, i) => (
                <div key={i} className="ai-block mt-2 rounded-r px-3 py-2">
                  <p className="mb-1 flex items-center gap-1 font-sans text-xs font-semibold text-blue">
                    <Bot className="size-3" aria-hidden /> AI-drafted — confirm before relying on it
                  </p>
                  <p>{renderMarked(b)}</p>
                </div>
              ))}
            </section>
          );
        })}
      </article>
    </div>
  );
}
