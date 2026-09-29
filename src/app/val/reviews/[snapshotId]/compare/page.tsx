'use client';
import { Eye, EyeOff, FilePlus2, Quote } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Chip, ScriptBadge, VerdictBadge } from '@/components/common/badges';
import { useDocViewer } from '@/components/common/DocViewer';
import { Banner, Card, EmptyState, Kpi, PageHeader } from '@/components/common/ui-bits';
import { lodFinal, TRIAGE, triage, type TriageCat } from '@/components/val/triage';
import { useReviewCtx } from '@/components/val/useReviewCtx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fmtDateTime } from '@/lib/clock';
import { cn } from '@/lib/utils';
import { final2lod, use2lod } from '@/stores/store2lod';
import { logAudit } from '@/stores/storeAudit';

export default function Compare() {
  const { snapshotId } = useParams<{ snapshotId: string }>();
  const { review, reqs, id } = useReviewCtx(snapshotId);
  const s = use2lod();
  const viewer = useDocViewer();
  const [confirm, setConfirm] = useState(false);
  const [cat, setCat] = useState<TriageCat | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const rows = useMemo(() => (review?.revealedAt && review.run ? triage(reqs, review.pkg.matrix1lod, review.run.rows) : []), [review, reqs]);
  if (!review) return null;
  const base = `/val/reviews/${encodeURIComponent(id)}`;

  if (!review.revealedAt) {
    return (
      <div>
        <PageHeader eyebrow={`Compare · ${id}`} title="Compare with the 1st line" />
        <Banner tone="blind" icon={<EyeOff className="size-4" aria-hidden />} className="mb-4">
          The 1st line matrix is hidden. Reveal it only after completing your blind assessment.
        </Banner>
        <EmptyState
          icon={<Eye className="size-5" aria-hidden />}
          title="Reveal 1st line matrix"
          actions={
            review.run ? (
              <Button className="bg-lod2 hover:bg-lod2/90" onClick={() => setConfirm(true)}>
                <Eye aria-hidden /> Reveal 1st line matrix
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href={`${base}/assess`}>Run the blind assessment first</Link>
              </Button>
            )
          }
        >
          {review.run
            ? `Blind run ${review.run.id} completed ${fmtDateTime(review.run.startedAt)} (${review.run.rows.filter((r) => r.decision).length}/${review.run.rows.length} decided by you).`
            : 'No blind run yet — the reveal is only available after your independent assessment.'}
        </EmptyState>
        <Dialog open={confirm} onOpenChange={setConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reveal 1st line matrix?</DialogTitle>
              <DialogDescription>This will be logged. Your blind assessments are locked once revealed.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirm(false)}>
                Cancel
              </Button>
              <Button
                className="bg-lod2 hover:bg-lod2/90"
                onClick={() => {
                  s.reveal(id);
                  setConfirm(false);
                  toast('1st line matrix revealed — event logged in the audit trail');
                }}
              >
                Reveal and lock blind assessments
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const count = (c: TriageCat) => rows.filter((r) => r.cat === c).length;
  const visible = cat === 'all' ? rows : rows.filter((r) => r.cat === cat);

  function draft(reqId: string, category: string, lodReason?: string) {
    const fid = s.draftFindingFromRow(id, reqId, { category, lodReason });
    toast.success(`Draft finding ${fid} ready`, { description: 'AI draft — edit and issue it on the Findings stage.', action: { label: 'Open', onClick: () => (window.location.href = `${base}/findings#${fid}`) } });
  }

  return (
    <div>
      <PageHeader
        eyebrow={`Compare · ${id}`}
        title="Compare & triage"
        subtitle={`1st line matrix revealed ${fmtDateTime(review.revealedAt)} · blind run ${review.run?.id} ${fmtDateTime(review.run?.startedAt)}`}
        actions={
          <Button asChild variant="outline">
            <Link href={`${base}/findings`}>Go to findings ({review.findings.length})</Link>
          </Button>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Agree" value={count('agree')} tone="good" />
        <Kpi label="1st line overruled AI" value={count('overruled')} tone="warn" />
        <Kpi label="Disagree" value={count('disagree')} tone="bad" />
        <Kpi label="Code ≠ doc" value={count('code_diff')} tone="bad" />
        <Kpi label="2nd line-only" value={count('val_only')} />
      </div>
      <Card>
        <div className="flex flex-wrap gap-2 border-b border-line px-4 py-3">
          <Chip active={cat === 'all'} onClick={() => setCat('all')} count={rows.length}>
            All
          </Chip>
          {(Object.keys(TRIAGE) as TriageCat[]).map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)} count={count(c)}>
              {TRIAGE[c].label}
            </Chip>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b border-line bg-bg/70 text-left text-xs font-medium uppercase tracking-wide text-ink-2">
                <th className="px-4 py-2">Requirement</th>
                <th className="px-2 py-2">Triage</th>
                <th className="px-2 py-2">1st line AI assessment</th>
                <th className="px-2 py-2">1st line final outcome + reason</th>
                <th className="px-2 py-2">2nd line outcome + rationale</th>
                <th className="px-4 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(({ req, cat: c, lod, val }) => {
                const t = TRIAGE[c];
                const hasFinding = review.findings.some((f) => f.requirementRefs.includes(req.id) && f.kind !== 'scoping_gap');
                return (
                  <tr key={req.id} className="border-b border-line/70 align-top last:border-0">
                    <td className="max-w-[260px] px-4 py-2.5">
                      <span className="font-mono text-xs font-semibold text-lod2">{req.id}</span>
                      <p className="mt-0.5 line-clamp-3">{req.text}</p>
                    </td>
                    <td className="px-2 py-2.5">
                      <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-semibold', t.cls)}>{t.label}</span>
                    </td>
                    <td className="px-2 py-2.5">{lod ? <VerdictBadge verdict={lod.verdict} /> : <span className="text-xs text-ink-3">n/a</span>}</td>
                    <td className="max-w-[220px] px-2 py-2.5">
                      {lod ? (
                        <>
                          <VerdictBadge verdict={lodFinal(lod)} />
                          <p className="mt-1 text-xs text-ink-2">
                            {lod.decision?.decision ?? 'no decision'}
                            {lod.decision?.reason ? ` — “${lod.decision.reason}”` : ''}
                          </p>
                        </>
                      ) : (
                        <span className="text-xs text-ink-3">Validation layer — not in 1st line set</span>
                      )}
                    </td>
                    <td className="max-w-[300px] px-2 py-2.5">
                      {val && (
                        <>
                          <div className="flex flex-wrap items-center gap-1">
                            <VerdictBadge verdict={final2lod(val)} />
                            {val.script && <ScriptBadge id={val.script.id} result={val.script.result} />}
                          </div>
                          <p className={cn('mt-1 text-xs text-ink-2', expanded !== req.id && 'line-clamp-2')}>{val.rationale}</p>
                          {val.script && expanded === req.id && <p className="mt-1 font-mono text-xs">{val.script.detail}</p>}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            if (c === 'agree') {
                              const cit = val?.citations[0] ?? lod?.citations[0];
                              if (cit) viewer.open(cit, val?.citations);
                              else toast('No citation to sample-check on this row');
                              logAudit({ line: '2lod', modelId: review.modelId, type: 'Citation sample-checked', detail: `${req.id}: citation opened for sample check.` });
                            } else if (c === 'overruled') {
                              toast(`1st line reason for ${req.id}`, { description: lod?.decision?.reason ?? '—' });
                              logAudit({ line: '2lod', modelId: review.modelId, type: '1st line reason verified', detail: `${req.id}: 1st line override reason reviewed.` });
                            } else if (c === 'code_diff') {
                              draft(req.id, t.label);
                            } else {
                              setExpanded(expanded === req.id ? null : req.id);
                            }
                          }}
                        >
                          {c === 'agree' && <Quote aria-hidden />}
                          {t.action}
                        </Button>
                        {hasFinding ? (
                          <Link href={`${base}/findings`} className="text-xs font-medium text-lod2 hover:underline">
                            Finding drafted →
                          </Link>
                        ) : (
                          c !== 'agree' && (
                            <Button size="xs" className="bg-lod2 hover:bg-lod2/90" onClick={() => draft(req.id, t.label, lod?.decision?.reason)}>
                              <FilePlus2 aria-hidden /> Draft finding
                            </Button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
