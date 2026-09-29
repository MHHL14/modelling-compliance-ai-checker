'use client';
import { Download, EyeOff, Lock, Play } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { AssessmentQueue } from '@/components/assessment/AssessmentQueue';
import { AiProviderBadgeLight } from '@/components/common/AiProviderBadgeLight';
import { RunInspector } from '@/components/common/RunInspector';
import { Banner, Card, EmptyState, PageHeader } from '@/components/common/ui-bits';
import { useReviewCtx } from '@/components/val/useReviewCtx';
import { Button } from '@/components/ui/button';
import { simulateRun } from '@/lib/ai/provider';
import { sourceGroup } from '@/lib/seed';
import { fmtDateTime } from '@/lib/clock';
import { exportSheets } from '@/lib/excel';
import { matrixRows } from '@/lib/matrix';
import { use2lod } from '@/stores/store2lod';

export default function BlindAssess() {
  const { snapshotId } = useParams<{ snapshotId: string }>();
  const { review, docs, reqs, id } = useReviewCtx(snapshotId);
  const s = use2lod();
  const [selected, setSelected] = useState<string | null>(null);
  if (!review) return null;
  const run = review.run;
  const locked = !!review.revealedAt;

  async function runBlind() {
    await simulateRun({ title: 'Blind 2nd line assessment', total: reqs.length, scripts: 3 });
    s.runBlind(id);
    toast.success('Blind assessment complete', { description: '1st line conclusions were not provided to the run (independence).' });
  }

  return (
    <div>
      <PageHeader
        eyebrow={`Blind assessment · ${id}`}
        title="Blind assessment"
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{review.pkg.manifest.requirementSetId}</span>·<span>library v{review.pkg.manifest.libraryVersion}</span>·<AiProviderBadgeLight />
            {run && <span className="text-ink-3">run {run.id} · {fmtDateTime(run.startedAt)}</span>}
          </span>
        }
        actions={
          <>
            {run && (
              <RunInspector
                run={run}
                docs={docs}
                row={run.rows.find((r) => r.requirementId === selected)}
                requirement={reqs.find((r) => r.id === selected)}
                extra={<p className="rounded-md bg-lod2/5 px-3 py-2 text-sm font-medium text-lod2">Independence: 1st line conclusions are never passed to the 2nd line run.</p>}
              />
            )}
            {!run && (
              <Button className="bg-lod2 hover:bg-lod2/90" onClick={runBlind}>
                <Play aria-hidden /> Run assessment
              </Button>
            )}
            {run && (
              <Button
                variant="outline"
                onClick={() => exportSheets(`Matrix-2nd-line-${review.modelId}-${id}.xlsx`, [{ name: 'Blind 2nd line assessment', rows: matrixRows(run.rows, reqs, run) }])}
              >
                <Download aria-hidden /> Export (.xlsx)
              </Button>
            )}
          </>
        }
      />
      <Banner tone="blind" icon={<EyeOff className="size-4" aria-hidden />} className="mb-4">
        <strong>Blind mode — 1st line conclusions are hidden until you reveal them.</strong> The run receives only the frozen evidence documents and the requirement set (shared + validation layer).
      </Banner>
      {locked && (
        <Banner tone="info" icon={<Lock className="size-4" aria-hidden />} className="mb-4">
          1st line matrix revealed {fmtDateTime(review.revealedAt)} — your blind assessments are locked.
        </Banner>
      )}
      {run ? (
        <>
          <Card className="mb-4 flex flex-wrap gap-x-8 gap-y-1 px-5 py-3 text-sm">
            <span>
              <strong className="text-lg tabular-nums">{run.rows.filter((r) => r.decision).length}</strong> of {run.rows.length} decided by validator
            </span>
            <span>
              <strong className="text-lg tabular-nums">{run.rows.filter((r) => r.script).length}</strong> script checks ({run.rows.filter((r) => r.script?.result === 'fail').length} fail)
            </span>
          </Card>
          <AssessmentQueue
            rows={run.rows}
            requirements={reqs}
            selectedId={selected}
            onSelect={setSelected}
            initialFilter="all"
            readOnly={locked}
            readOnlyReason="Blind assessments are locked after the reveal."
            groupBy={sourceGroup}
            decisionLabel="Validator conclusion"
            decisionTitle="Validator decision (your own conclusion)"
            onDecide={(ids, d) => {
              s.decide(id, ids, d);
              toast.success(ids.length > 1 ? `${ids.length} rows accepted` : `${ids[0]}: ${d.decision}`);
            }}
            onClearDecision={(rid) => s.patch(id, (r) => ({ run: r.run && { ...r.run, rows: r.run.rows.map((x) => (x.requirementId === rid ? { ...x, decision: undefined } : x)) } }))}
          />
        </>
      ) : (
        <EmptyState icon={<Play className="size-5" aria-hidden />} title="No blind run yet" actions={<Button className="bg-lod2 hover:bg-lod2/90" onClick={runBlind}>Run assessment</Button>}>
          Run the independent 2nd line assessment on the frozen package: {review.pkg.documents.length} documents, {reqs.length} requirements. 1st line conclusions are not provided to the run.
        </EmptyState>
      )}
    </div>
  );
}
