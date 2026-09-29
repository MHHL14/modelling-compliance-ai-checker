'use client';
import { AlertTriangle, ChevronDown, ClipboardList, Download, FastForward, FileUp, Link2, Lock, Play, RefreshCw, ScrollText, Terminal } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { AssessmentQueue } from '@/components/assessment/AssessmentQueue';
import { FileDrop, readTextIfPossible } from '@/components/common/FileDrop';
import { RunInspector } from '@/components/common/RunInspector';
import { Banner, Card, PageHeader } from '@/components/common/ui-bits';
import { PilotOnly } from '@/components/dev/PilotOnly';
import { useModelCtx } from '@/components/dev/useModelCtx';
import { AiProviderBadgeLight } from '@/components/common/AiProviderBadgeLight';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EVIDENCE_AFFECTS } from '@/lib/ai/pilot';
import { simulateRun, simulateShort } from '@/lib/ai/provider';
import { fmtDateTime, nowISO } from '@/lib/clock';
import { exportSheets } from '@/lib/excel';
import { matrixRows } from '@/lib/matrix';
import { can } from '@/lib/permissions';
import { uid } from '@/lib/rng';
import { PILOT } from '@/lib/seed';
import type { AssessmentRow, Upload } from '@/lib/types';
import { allModelRequirements, finalVerdict, use1lod } from '@/stores/store1lod';
import { logAudit } from '@/stores/storeAudit';
import { useLibrary } from '@/stores/storeLibrary';

const DEMO_EVIDENCE = PILOT.upload_examples.filter((u) => u.kind === 'evidence').map((u) => u.name);

export default function AssessPage() {
  const { id } = useParams<{ id: string }>();
  const { model, work, pilot, docs } = useModelCtx(id);
  const s = use1lod();
  const libVersion = useLibrary((l) => (can('1lod', 'read:library') ? l.version : '3.2'));
  const [selected, setSelected] = useState<string | null>(null);
  const [scriptDialog, setScriptDialog] = useState<AssessmentRow | null>(null);
  const [justification, setJustification] = useState<AssessmentRow | null>(null);

  if (!model || !work) return null;
  if (!pilot) return <PilotOnly stage="Self-assessment" modelId={id} />;

  const run = work.run;
  const reqs = allModelRequirements(work);
  const rows = run?.rows ?? [];
  const decided = rows.filter((r) => r.decision).length;
  const gaps = rows.filter((r) => ['partial', 'non_compliant', 'not_found'].includes(finalVerdict(r))).length;
  const remaining = rows.length - decided;
  const readOnly = !!work.submission;
  const libChanged = run && libVersion !== run.libraryVersion;
  const changedIds = libChanged ? PILOT.library_change.changes.map((c) => c.id) : [];

  async function runAssessment() {
    await simulateRun({ title: `Self-assessment · ${work!.reqSetId}`, total: reqs.length, scripts: 2 });
    s.runAssessment(id);
    toast.success('Assessment complete', { description: 'All rows are AI drafts until you decide.' });
  }

  async function rerunChanged() {
    await simulateRun({ title: 'Re-running changed rows', total: Math.max(1, work!.changedRows.length), label: 'Re-assessing row' });
    const done = s.rerunChanged(id);
    toast.success(done.length ? `Re-assessed ${done.join(', ')}` : 'No rows changed', { description: 'Other rows kept their human decision.' });
  }

  async function uploadEvidence(file: File, rowId: string) {
    const text = await readTextIfPossible(file);
    const upload: Upload = { id: uid('UPL'), name: file.name, size: file.size, kind: 'evidence', uploadedAt: nowISO(), mime: file.type };
    const affects = EVIDENCE_AFFECTS[file.name] ?? [];
    await simulateShort(`Uploading ${file.name}`, ['Registering file…', 'Extracting text (simulated)…', 'Retrieving passages…', affects.length ? `Re-assessing ${affects.join(', ')}…` : 'Matching against open rows…'], 2000);
    const done = s.uploadEvidence(id, upload, text, rowId);
    if (done.includes(rowId)) {
      const nr = use1lod.getState().models[id]?.run?.rows.find((r) => r.requirementId === rowId);
      toast.success(`${rowId} re-assessed: ${nr?.verdict.replace('_', ' ')} · ${nr?.confidence} confidence`, { description: nr?.citations[0] ? `New citation ${nr.citations[0].doc} §${nr.citations[0].section}` : undefined });
    } else if (done.length) {
      toast.success(`Evidence registered — re-assessed ${done.join(', ')}`);
    } else {
      toast('Evidence registered', { description: `No passage in ${file.name} addresses ${rowId}. The row keeps its outcome.` });
    }
  }

  function mitigationAction(row: AssessmentRow) {
    if (readOnly || !row.mitigation) return null;
    const t = row.mitigation.type;
    if (t === 'remediation')
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            logAudit({ line: '1lod', modelId: id, type: 'Task created', detail: `Remediation task for ${row.requirementId}: ${row.mitigation!.text}` });
            toast.success('Task created in team backlog', { description: `${row.requirementId} · owner ${model!.owner_1lod} · due before submission of v1.1` });
          }}
        >
          <ClipboardList aria-hidden /> Create task
        </Button>
      );
    if (t === 'verification') {
      const script = row.mitigation.text.match(/\b(CC|VR)-\d+/)?.[0];
      return script ? (
        <Button size="sm" variant="outline" onClick={() => setScriptDialog(row)}>
          <Terminal aria-hidden /> Run script {script}
        </Button>
      ) : null;
    }
    if (t === 'compensating')
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            logAudit({ line: '1lod', modelId: id, type: 'Linked to MoC register', detail: `${row.requirementId} linked to MoC register entry MOC-PDMORT-A-03 (category A).` });
            toast.success('Linked to MoC register', { description: 'Entry MOC-PDMORT-A-03 · category A · PD-MORT-NL v4' });
          }}
        >
          <Link2 aria-hidden /> Link to MoC register
        </Button>
      );
    return (
      <Button size="sm" variant="outline" onClick={() => setJustification(row)}>
        <ScrollText aria-hidden /> Draft justification
      </Button>
    );
  }

  function detailExtras(row: AssessmentRow) {
    if (readOnly) return null;
    const show = row.verdict === 'not_found' || (row.mitigation?.type === 'verification' && !/\b(CC|VR)-\d+/.test(row.mitigation.text)) || row.mitigation?.type === 'compensating';
    if (!show) return null;
    return (
      <div className="mt-3 space-y-2 rounded-lg border border-line bg-bg/50 p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-2">
          <FileUp className="size-3.5" aria-hidden /> Upload evidence
        </p>
        <FileDrop compact label="Drop evidence file (re-assesses this row)" onFiles={(f) => uploadEvidence(f[0], row.requirementId)} />
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
          <span className="text-ink-3">Demo files:</span>
          {DEMO_EVIDENCE.map((n) => (
            <button key={n} type="button" className="text-green-800 hover:underline" onClick={() => uploadEvidence(new File([new Uint8Array(n.startsWith('MDD') ? 2_411_724 : 356_352)], n, { type: 'application/pdf' }), row.requirementId)}>
              {n}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function exportMatrix() {
    if (!run) return;
    exportSheets(`Matrix-1st-line-${id}-${work!.reqSetId}.xlsx`, [
      { name: 'Self-assessment', rows: matrixRows(rows, reqs, run) },
      {
        name: 'Run',
        rows: [
          { Field: 'Run ID', Value: run.id },
          { Field: 'Model', Value: `${model!.id} ${model!.name}` },
          { Field: 'Requirement set', Value: run.requirementSetId },
          { Field: 'Library version', Value: run.libraryVersion },
          { Field: 'Document versions', Value: Object.entries(run.documentVersions).map(([k, v]) => `${k} v${v}`).join('; ') },
          { Field: 'Provider', Value: run.provider },
          { Field: 'Exported', Value: nowISO().slice(0, 16).replace('T', ' ') },
          { Field: 'Note', Value: 'Prototype · illustrative data' },
        ],
      },
    ]);
    logAudit({ line: '1lod', modelId: id, type: 'Matrix exported', detail: `1st line matrix exported to Excel (${rows.length} rows).` });
  }

  return (
    <div>
      <PageHeader
        eyebrow={`Stage 3 · Self-assessment · ${model.id}`}
        title="Self-assessment"
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>RDS documentation v1.0</span>·<span>{work.reqSetId}</span>·<span>library v{run?.libraryVersion ?? '3.2'}</span>·<AiProviderBadgeLight />
            {run && <span className="text-ink-3">run {run.id} · {fmtDateTime(run.startedAt)}</span>}
          </span>
        }
        actions={
          <>
            {run && <RunInspector run={run} docs={docs} row={rows.find((r) => r.requirementId === selected)} requirement={reqs.find((r) => r.id === selected)} />}
            {!readOnly && !run && (
              <Button onClick={runAssessment}>
                <Play aria-hidden /> Run assessment
              </Button>
            )}
            {!readOnly && run && (
              <Button variant={work.changedRows.length ? 'default' : 'outline'} onClick={rerunChanged} disabled={!work.changedRows.length}>
                <RefreshCw aria-hidden /> Re-run changed rows ({work.changedRows.length})
              </Button>
            )}
            <Button variant="outline" onClick={exportMatrix} disabled={!run}>
              <Download aria-hidden /> Export matrix (.xlsx)
            </Button>
            {!readOnly && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    Demo <ChevronDown aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="text-xs">Presenter shortcuts</DropdownMenuLabel>
                  <DropdownMenuItem
                    onSelect={() => {
                      const n = s.fastForward(id);
                      toast.success(`Fast-forward: ${n} row(s) decided`, { description: 'Scripted decisions applied (decisions_1lod_scripted).' });
                    }}
                  >
                    <FastForward aria-hidden /> Fast-forward remaining rows
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        }
      />

      <div className="mb-4 space-y-2">
        {!work.lockedAt && (
          <Banner tone="warn" icon={<Lock className="size-4" aria-hidden />}>
            Requirement set {work.reqSetId} is not locked yet. <Link href={`/dev/models/${id}/scope`} className="font-medium underline">Lock it in Scoping</Link> — submission requires a locked set, and model-specific requirements are added to the run on lock.
          </Banner>
        )}
        {libChanged && (
          <Banner tone="warn" icon={<AlertTriangle className="size-4" aria-hidden />}>
            Library v{libVersion} was published after this run (v{run?.libraryVersion}). Rows marked <strong>Needs review — library changed</strong>: {changedIds.filter((c) => rows.some((r) => r.requirementId === c)).join(', ')}.
          </Banner>
        )}
        {readOnly && (
          <Banner tone="success" icon={<Lock className="size-4" aria-hidden />}>
            Matrix frozen — submission package {work.submission?.packageId} exported {fmtDateTime(work.submission?.at)}. Read-only.
          </Banner>
        )}
      </div>

      {run ? (
        <>
          <Card className="mb-4 flex flex-wrap items-center gap-x-8 gap-y-2 px-5 py-3.5">
            <div>
              <span className="text-2xl font-semibold tabular-nums">{decided}</span>
              <span className="text-ink-2"> of {rows.length} reviewed</span>
            </div>
            <div>
              <span className="text-2xl font-semibold tabular-nums text-amber">{gaps}</span>
              <span className="text-ink-2"> open gaps</span>
            </div>
            <div className="text-ink-2">est. {Math.ceil(remaining * 1.5)} min left</div>
            <div className="h-2 min-w-[160px] flex-1 overflow-hidden rounded-full bg-bg">
              <div className="h-full rounded-full bg-green-600 transition-[width]" style={{ width: `${rows.length ? (decided / rows.length) * 100 : 0}%` }} />
            </div>
          </Card>
          <AssessmentQueue
            rows={rows}
            requirements={reqs}
            selectedId={selected}
            onSelect={setSelected}
            readOnly={readOnly}
            readOnlyReason="Matrix frozen after submission."
            onDecide={(ids, d) => {
              s.decide(id, ids, d);
              toast.success(ids.length > 1 ? `${ids.length} rows accepted` : `${ids[0]}: ${d.decision}`);
            }}
            onClearDecision={(rid) => s.clearDecision(id, rid)}
            mitigationAction={mitigationAction}
            detailExtras={detailExtras}
            flagged={(r) => changedIds.includes(r.requirementId)}
            rowBadges={(r) =>
              changedIds.includes(r.requirementId) ? <span className="rounded bg-amber-100 px-1.5 text-[11px] font-medium text-amber">Needs review — library changed</span> : r.reassessedAt ? <span className="rounded bg-blue-100 px-1.5 text-[11px] text-blue">Re-assessed</span> : null
            }
            headerBadges={(r) => (changedIds.includes(r.requirementId) ? <span className="rounded bg-amber-100 px-1.5 text-[11px] font-medium text-amber">Needs review — library changed</span> : null)}
          />
        </>
      ) : (
        <Card className="p-10 text-center text-sm text-ink-2">No assessment run yet. Click “Run assessment”.</Card>
      )}

      <Dialog open={!!scriptDialog} onOpenChange={(o) => !o && setScriptDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run script check</DialogTitle>
            <DialogDescription>{scriptDialog?.mitigation?.text}</DialogDescription>
          </DialogHeader>
          <Banner tone="warn">
            The code repository <span className="font-mono">rds-mort-nl</span> is not linked to this workspace, so the script cannot run here. Request the link; the script result will appear as a grey “Script” check on the row.
          </Banner>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScriptDialog(null)}>
              Not now
            </Button>
            <Button
              onClick={() => {
                logAudit({ line: '1lod', modelId: id, type: 'Repository link requested', detail: `Link to rds-mort-nl requested to run ${scriptDialog?.mitigation?.text.match(/\b(CC|VR)-\d+/)?.[0]} for ${scriptDialog?.requirementId}.` });
                toast('Repository link requested', { description: 'IT change request CHG-48213 created.' });
                setScriptDialog(null);
              }}
            >
              Request repository link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!justification} onOpenChange={(o) => !o && setJustification(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Draft justification · {justification?.requirementId}</DialogTitle>
            <DialogDescription>AI draft — edit before using it as the reason for your decision.</DialogDescription>
          </DialogHeader>
          <div className="ai-block rounded-r px-3 py-2 text-sm">
            {justification &&
              `${reqs.find((r) => r.id === justification.requirementId)?.text.replace(/\.$/, '')}: this obligation is evidenced outside the RDS documentation component. The PD add-on is applied at the calibration stage and documented in the MDD calibration chapter (§7); the RDS scope is limited to data construction and quality.`}
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                navigator.clipboard?.writeText(document.querySelector('.ai-block')?.textContent ?? '');
                toast('Justification copied — paste it as the decision reason');
                setJustification(null);
              }}
            >
              Copy justification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
