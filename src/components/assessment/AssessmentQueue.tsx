'use client';
import { CheckCheck, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AiDraftBadge, Chip, ConfidencePill, HumanDecisionBadge, MitigationBadge, VerdictBadge } from '@/components/common/badges';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CONFIDENCE_RANK } from '@/lib/confidence';
import { seeded } from '@/lib/rng';
import { cn } from '@/lib/utils';
import type { AssessmentRow, Requirement, RowDecision } from '@/lib/types';
import { RowDetail, type RowDetailProps } from './RowDetail';

export type QueueFilter = 'attention' | 'not_found' | 'high_compliant' | 'decided' | 'all';

export function needsAttention(r: AssessmentRow) {
  return r.verdict === 'not_found' || r.verdict === 'partial' || r.verdict === 'non_compliant' || r.confidence !== 'high';
}

const isHighCompliant = (r: AssessmentRow) => r.verdict === 'compliant' && r.confidence === 'high';

export interface AssessmentQueueProps extends Omit<RowDetailProps, 'row' | 'requirement'> {
  rows: AssessmentRow[];
  requirements: Requirement[];
  rowBadges?: (row: AssessmentRow) => React.ReactNode;
  toolbar?: React.ReactNode;
  initialFilter?: QueueFilter;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  decisionLabel?: string;
  /** rows that need attention regardless of their decision (e.g. library changed) */
  flagged?: (row: AssessmentRow) => boolean;
}

export function AssessmentQueue(props: AssessmentQueueProps) {
  const { rows, requirements, rowBadges, toolbar, initialFilter = 'attention', readOnly, onDecide, decisionLabel = 'Your decision', flagged } = props;
  const attention = (r: AssessmentRow) => (needsAttention(r) && !r.decision) || !!flagged?.(r);
  const [filter, setFilter] = useState<QueueFilter>(initialFilter);
  const [q, setQ] = useState('');
  const [internalSel, setInternalSel] = useState<string | null>(null);
  const selectedId = props.selectedId !== undefined ? props.selectedId : internalSel;
  const select = (id: string | null) => (props.onSelect ? props.onSelect(id) : setInternalSel(id));
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);

  const reqById = useMemo(() => new Map(requirements.map((r) => [r.id, r])), [requirements]);

  const counts = {
    attention: rows.filter(attention).length,
    not_found: rows.filter((r) => r.verdict === 'not_found').length,
    high_compliant: rows.filter(isHighCompliant).length,
    decided: rows.filter((r) => r.decision).length,
    all: rows.length,
  };

  const visible = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (filter === 'attention') return attention(r);
        if (filter === 'not_found') return r.verdict === 'not_found';
        if (filter === 'high_compliant') return isHighCompliant(r);
        if (filter === 'decided') return !!r.decision;
        return true;
      })
      .filter((r) => !ql || r.requirementId.toLowerCase().includes(ql) || (reqById.get(r.requirementId)?.text.toLowerCase().includes(ql) ?? false))
      .sort((a, b) => {
        const na = needsAttention(a) ? 0 : 1;
        const nb = needsAttention(b) ? 0 : 1;
        if (na !== nb) return na - nb;
        return CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence];
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, filter, q, reqById, flagged]);

  const selected = rows.find((r) => r.requirementId === selectedId) ?? null;

  // Bulk accept (rule 9): only undecided high-confidence compliant rows, after opening a random sample of 3
  const bulkCandidates = rows.filter((r) => isHighCompliant(r) && !r.decision);
  const sample = useMemo(() => {
    const ids = bulkCandidates.map((r) => r.requirementId).sort();
    const rnd = seeded(ids.join('|'));
    const shuffled = [...ids].sort(() => rnd() - 0.5);
    return shuffled.slice(0, Math.min(3, ids.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkCandidates.map((r) => r.requirementId).join('|')]);
  const sampleOpened = sample.filter((id) => opened.has(id)).length;

  function openRow(id: string) {
    select(id);
    setOpened((s) => new Set(s).add(id));
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="min-w-0 rounded-[12px] border border-line bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <Chip active={filter === 'attention'} onClick={() => setFilter('attention')} count={counts.attention}>
            Needs attention
          </Chip>
          <Chip active={filter === 'not_found'} onClick={() => setFilter('not_found')} count={counts.not_found}>
            Not found
          </Chip>
          <Chip active={filter === 'high_compliant'} onClick={() => setFilter('high_compliant')} count={counts.high_compliant}>
            High-confidence compliant
          </Chip>
          <Chip active={filter === 'decided'} onClick={() => setFilter('decided')} count={counts.decided}>
            Decided
          </Chip>
          <Chip active={filter === 'all'} onClick={() => setFilter('all')} count={counts.all}>
            All
          </Chip>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-ink-3" aria-hidden />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search requirement" className="h-8 w-44 pl-7" aria-label="Search requirements" />
            </div>
            {!readOnly && (
              <Button variant="outline" size="sm" disabled={bulkCandidates.length === 0} onClick={() => setBulkOpen(true)}>
                <CheckCheck aria-hidden /> Bulk accept high-confidence ({bulkCandidates.length})
              </Button>
            )}
          </div>
          {toolbar && <div className="flex w-full flex-wrap items-center gap-2">{toolbar}</div>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-line bg-bg/70 text-left text-xs font-medium uppercase tracking-wide text-ink-2">
                <th className="px-4 py-2">Requirement</th>
                <th className="px-2 py-2">AI assessment · evidence</th>
                <th className="px-2 py-2">Confidence</th>
                <th className="px-2 py-2">Mitigation</th>
                <th className="px-3 py-2">{decisionLabel}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const req = reqById.get(r.requirementId);
                const active = r.requirementId === selectedId;
                return (
                  <tr
                    key={r.requirementId}
                    onClick={() => openRow(r.requirementId)}
                    className={cn('cursor-pointer border-b border-line/70 align-top transition-colors last:border-0', active ? 'bg-green-50' : 'hover:bg-bg')}
                  >
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        className="text-left focus-visible:outline-green-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          openRow(r.requirementId);
                        }}
                      >
                        <span className="font-mono text-xs font-semibold text-green-800">{r.requirementId}</span>
                        {req?.layer === 'model_specific' && <span className="ml-1.5 rounded bg-[#efe7f7] px-1 text-[10px] font-medium text-[#5b3a86]">model-specific</span>}
                        {req?.layer === '2lod' && <span className="ml-1.5 rounded bg-lod2/10 px-1 text-[10px] font-medium text-lod2">validation layer</span>}
                        <span className="mt-0.5 line-clamp-2 block text-ink">{req?.text ?? '—'}</span>
                      </button>
                      {rowBadges && <div className="mt-1 flex flex-wrap gap-1">{rowBadges(r)}</div>}
                    </td>
                    <td className="px-2 py-2.5">
                      <VerdictBadge verdict={r.verdict} />
                      <div className="mt-1 text-xs text-ink-2">
                        {r.citations.length ? r.citations.map((c) => `§${c.section}`).filter((v, i, a) => a.indexOf(v) === i).join(', ') : r.script ? `Script ${r.script.id}` : 'no passage'}
                        {r.script && r.citations.length ? <span className="ml-1 rounded bg-script px-1 text-[10px]">Script {r.script.result.toUpperCase()}</span> : null}
                      </div>
                    </td>
                    <td className="px-2 py-2.5">
                      <ConfidencePill confidence={r.confidence} />
                    </td>
                    <td className="px-2 py-2.5">{r.mitigation ? <MitigationBadge type={r.mitigation.type} compact /> : <span className="text-xs text-ink-3">—</span>}</td>
                    <td className="px-3 py-2.5">{r.decision ? <DecisionCell d={r.decision} /> : <AiDraftBadge />}</td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-ink-2">
                    {filter === 'attention' ? 'Nothing needs attention — every flagged row has a human decision.' : 'No rows match this filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="min-w-0 xl:sticky xl:top-[72px] xl:max-h-[calc(100vh-88px)] xl:self-start xl:overflow-y-auto">
        {selected ? (
          <RowDetail {...props} row={selected} requirement={reqById.get(selected.requirementId)} />
        ) : (
          <div className="rounded-[12px] border border-dashed border-[#c7d3d2] bg-white p-8 text-center text-sm text-ink-2">
            Select a row to see the cited evidence, the confidence rationale and the proposed mitigating measure.
          </div>
        )}
      </div>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk accept high-confidence compliant rows</DialogTitle>
            <DialogDescription>
              No auto-accept: before accepting {bulkCandidates.length} rows in bulk, open this random sample of {sample.length} and check the cited evidence.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2">
            {sample.map((id) => (
              <li key={id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
                <span className="min-w-0 text-sm">
                  <span className="font-mono text-xs font-semibold text-green-800">{id}</span>{' '}
                  <span className="text-ink-2">{reqById.get(id)?.text.slice(0, 60)}…</span>
                </span>
                {opened.has(id) ? (
                  <span className="text-xs font-medium text-green-600">Opened ✓</span>
                ) : (
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      openRow(id);
                      setBulkOpen(false);
                    }}
                  >
                    Open
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={sampleOpened < sample.length}
              onClick={() => {
                onDecide?.(bulkCandidates.map((r) => r.requirementId), { decision: 'accepted', reason: `Bulk accept after sample check (${sample.join(', ')})` });
                setBulkOpen(false);
              }}
            >
              {sampleOpened < sample.length ? `Open sample first (${sampleOpened}/${sample.length})` : `Accept ${bulkCandidates.length} rows`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DecisionCell({ d }: { d: RowDecision }) {
  return (
    <div className="space-y-1">
      <HumanDecisionBadge decision={d} compact />
      {d.finalVerdict && (
        <div className="flex items-center gap-1 text-xs text-ink-2">
          final: <VerdictBadge verdict={d.finalVerdict} />
        </div>
      )}
    </div>
  );
}
