'use client';
import { AlertTriangle, CheckCircle2, ChevronDown, ClipboardList, Download, FastForward, FilePlus2, FileUp, Link2, Lock, Pencil, Play, RefreshCw, ScrollText, Terminal } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AssessmentQueue } from '@/components/assessment/AssessmentQueue';
import { FileDrop, readTextIfPossible } from '@/components/common/FileDrop';
import { DocumentationPicker } from '@/components/common/DocumentationPicker';
import { RunInspector } from '@/components/common/RunInspector';
import { Banner, Card, CardHeader, PageHeader } from '@/components/common/ui-bits';
import { useCaseCtx } from '@/components/dev/useCaseCtx';
import { AiProviderBadgeLight } from '@/components/common/AiProviderBadgeLight';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { COMPONENT_LABEL } from '@/lib/ai/generic';
import { affectedBy, docsOf, finalVersionOf, type DocSel } from '@/lib/engine/assess';
import { simulateRun, simulateShort } from '@/lib/ai/provider';
import { fmtDateTime, nowISO } from '@/lib/clock';
import { exportSheets } from '@/lib/excel';
import { matrixRows } from '@/lib/matrix';
import { can } from '@/lib/permissions';
import { uid } from '@/lib/rng';
import { PILOT, sourceGroup } from '@/lib/seed';
import type { AssessmentRow, Upload } from '@/lib/types';
import { allCaseRequirements, defaultSelection, finalVerdict, selKey, use1lod } from '@/stores/store1lod';
import { logAudit } from '@/stores/storeAudit';
import { useLibrary } from '@/stores/storeLibrary';


export default function AssessPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const { id, uc: work, readOnly: completed, model, docs, ready } = useCaseCtx(caseId);
  const s = use1lod();
  const libVersion = useLibrary((l) => (can('1lod', 'read:library') ? l.version : '3.2'));
  const [selected, setSelected] = useState<string | null>(null);
  const [scriptDialog, setScriptDialog] = useState<AssessmentRow | null>(null);
  const [justification, setJustification] = useState<AssessmentRow | null>(null);
  const [editSel, setEditSel] = useState(false);

  // Preselect the final versions of the documents used in the draft check (the user confirms or changes this).
  useEffect(() => {
    if (!work || !ready || work.submissionSelection || work.submission) return;
    const fromDraft: DocSel[] = work.draftSelection.flatMap((d) => {
      const doc = docsOf(d.modelId)?.documents.find((x) => x.id === d.docId);
      return doc ? [{ ...d, version: finalVersionOf(doc).version }] : [];
    });
    s.setSubmissionSelection(id, fromDraft.length ? fromDraft : defaultSelection(work.modelId, 'final'));
  }, [work, ready, id, s]);

  if (!model || !work) return null;
  if (!ready) return <p className="p-6 text-sm text-ink-2">Loading the documentation library…</p>;

  const run = work.run;
  const reqs = allCaseRequirements(work);
  const rows = run?.rows ?? [];
  const decided = rows.filter((r) => r.decision).length;
  const gaps = rows.filter((r) => ['partial', 'non_compliant', 'not_found'].includes(finalVerdict(r))).length;
  const remaining = rows.length - decided;
  const readOnly = !!work.submission || completed;
  const libChanged = run && libVersion !== run.libraryVersion;
  const changedIds = libChanged ? PILOT.library_change.changes.map((c) => c.id) : [];
  const selection = work.submissionSelection ?? [];
  const confirmed = !!work.selectionConfirmedAt;
  const selectedKeys = new Set(selection.map(selKey));
  const ownDocs = docsOf(work.modelId)?.documents ?? [];
  /** documents of this model (not yet selected) whose final version addresses a requirement */
  const expectedDocs = (reqId: string) =>
    ownDocs.filter((d) => {
      const v = finalVersionOf(d);
      return !selection.some((x) => x.modelId === work.modelId && x.docId === d.id) && v.sections.some((sec) => sec.evidence?.some((e) => e.req === reqId));
    });

  function changeSelection(next: DocSel[]) {
    const added = next.filter((n) => !selectedKeys.has(selKey(n)));
    s.setSubmissionSelection(id, next);
    if (run && added.length) {
      const affected = added.flatMap((a) => affectedBy(work!.modelId, a));
      s.patch(id, (x) => ({ changedRows: [...new Set([...x.changedRows, ...affected.filter((r) => x.run?.rows.some((row) => row.requirementId === r))])], selectionConfirmedAt: nowISO() }));
    }
  }

  function addExpected(docId: string, rowId: string) {
    const d = ownDocs.find((x) => x.id === docId)!;
    changeSelection([...selection, { modelId: work!.modelId, docId, version: finalVersionOf(d).version }]);
    s.patch(id, (x) => ({ changedRows: [...new Set([...x.changedRows, rowId])] }));
    toast.success(`${d.title} v${finalVersionOf(d).version} added to the selection`, { description: 'Re-run the changed rows to re-assess them against it.' });
  }

  async function runAssessment() {
    await simulateRun({ title: `Self-assessment · ${work!.reqSetId} · ${selection.length} document(s)`, total: reqs.length, scripts: 2 });
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
    const match = docsOf(work!.modelId)?.documents.find((d) => file.name.toLowerCase().startsWith(d.title.toLowerCase()));
    const affects = match ? affectedBy(work!.modelId, { modelId: work!.modelId, docId: match.id, version: finalVersionOf(match).version }).filter((r) => rows.some((x) => x.requirementId === r)).slice(0, 4) : [];
    await simulateShort(`Uploading ${file.name}`, ['Registering file…', 'Extracting text (simulated)…', 'Retrieving passages…', affects.length ? `Re-assessing ${affects.join(', ')}…` : 'Matching against open rows…'], 2000);
    const done = s.uploadEvidence(id, upload, text, 'submission', true);
    if (done.includes(rowId)) {
      const nr = use1lod.getState().cases[id]?.run?.rows.find((r) => r.requirementId === rowId);
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
            logAudit({ line: '1lod', modelId: work!.modelId, type: 'Task created', detail: `Remediation task for ${row.requirementId}: ${row.mitigation!.text}` });
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
            const entry = work!.modelId === 'MDL-01' ? 'MOC-PDMORT-A-03' : `MOC-${work!.modelId.replace('MDL-', 'M')}-A-01`;
            logAudit({ line: '1lod', modelId: work!.modelId, type: 'Linked to MoC register', detail: `${row.requirementId} linked to MoC register entry ${entry} (category A).` });
            toast.success('Linked to MoC register', { description: `Entry ${entry} · category A · ${model!.name}` });
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
    const show = row.verdict === 'not_found' || row.verdict === 'partial' || (row.mitigation?.type === 'verification' && !/\b(CC|VR)-\d+/.test(row.mitigation.text)) || row.mitigation?.type === 'compensating';
    if (!show) return null;
    const expected = expectedDocs(row.requirementId);
    return (
      <div className="mt-3 space-y-2 rounded-lg border border-line bg-bg/50 p-3">
        {expected.length > 0 && (
          <>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-2">
              <FilePlus2 className="size-3.5" aria-hidden /> Evidence may sit in a document you did not select
            </p>
            <div className="flex flex-wrap gap-2">
              {expected.map((d) => (
                <Button key={d.id} size="sm" variant="outline" onClick={() => addExpected(d.id, row.requirementId)}>
                  Add {d.title} v{finalVersionOf(d).version}
                </Button>
              ))}
            </div>
          </>
        )}
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-2">
          <FileUp className="size-3.5" aria-hidden /> Upload evidence
        </p>
        <FileDrop compact label="Drop evidence file (re-assesses this row)" onFiles={(f) => uploadEvidence(f[0], row.requirementId)} />
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
    logAudit({ line: '1lod', modelId: work!.modelId, type: 'Matrix exported', detail: `1st line matrix exported to Excel (${rows.length} rows).` });
  }

  return (
    <div>
      <PageHeader
        eyebrow={`Stage 3 · Self-assessment · ${model.id}`}
        title="Self-assessment"
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{selection.length} document(s)</span>·<span>{work.reqSetId}</span>·<span>library v{run?.libraryVersion ?? '3.2'}</span>·<AiProviderBadgeLight />
            {run && <span className="text-ink-3">run {run.id} · {fmtDateTime(run.startedAt)}</span>}
          </span>
        }
        actions={
          <>
            {run && <RunInspector run={run} docs={docs} row={rows.find((r) => r.requirementId === selected)} requirement={reqs.find((r) => r.id === selected)} />}
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
                      toast.success(`Fast-forward: ${n} row(s) decided`, { description: 'Scripted demo decisions applied to the remaining rows.' });
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
            Requirement set {work.reqSetId} is not locked yet. <Link href={`/dev/cases/${encodeURIComponent(id)}/scope`} className="font-medium underline">Lock it in Scoping</Link> — submission requires a locked set, and model-specific requirements are added to the run on lock.
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

      {(!run || editSel) && !readOnly ? (
        <Card className="mb-4">
          <CardHeader
            title="Documentation to assess"
            subtitle="Select the final documentation you will submit, from the model documentation library or by uploading it. The AI assesses every requirement in the locked set against exactly these documents."
            actions={
              confirmed && run ? (
                <Button size="sm" variant="outline" onClick={() => setEditSel(false)}>
                  Done
                </Button>
              ) : null
            }
          />
          <div className="space-y-3 px-4 py-4">
            <DocumentationPicker
              modelId={work.modelId}
              kind="final"
              selection={selection}
              onChange={changeSelection}
              uploads={work.evidenceDocs.map((d) => ({ name: d.uploadName, note: 'uploaded — text extracted (simulated)' }))}
              onUpload={async (files) => {
                for (const f of files) {
                  const text = await readTextIfPossible(f);
                  s.uploadEvidence(id, { id: uid('UPL'), name: f.name, size: f.size, kind: 'evidence', uploadedAt: nowISO(), mime: f.type }, text, 'submission');
                }
                toast.success('Upload registered', { description: 'Recognised library documents are added to the selection.' });
              }}
            />
            {!run && (
              <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3">
                {confirmed ? (
                  <span className="flex items-center gap-1.5 text-sm text-green-800">
                    <CheckCircle2 className="size-4" aria-hidden /> {selection.length} document(s) confirmed {fmtDateTime(work.selectionConfirmedAt)}
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    disabled={!selection.length}
                    onClick={() => {
                      s.confirmSelection(id);
                      toast.success('Documentation confirmed', { description: `${selection.length} document(s) will be assessed and included in the submission package.` });
                    }}
                  >
                    <CheckCircle2 aria-hidden /> Confirm documentation ({selection.length})
                  </Button>
                )}
                <Button onClick={runAssessment} disabled={!confirmed || !work.lockedAt || !selection.length}>
                  <Play aria-hidden /> Run assessment
                </Button>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card className="mb-4 flex flex-wrap items-center gap-2 px-4 py-2.5 text-sm">
          <span className="font-medium text-ink">Documentation assessed:</span>
          {selection.map((d) => {
            const doc = docsOf(d.modelId)?.documents.find((x) => x.id === d.docId);
            return (
              <span key={selKey(d)} className="rounded bg-bg px-2 py-0.5 text-xs text-ink-2">
                {doc?.title ?? d.docId} v{d.version}
                {d.modelId !== work.modelId && ` (${d.modelId})`}
              </span>
            );
          })}
          {work.evidenceDocs.map((d) => (
            <span key={d.id} className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue">
              {d.uploadName}
            </span>
          ))}
          {!readOnly && (
            <Button size="xs" variant="ghost" className="ml-auto" onClick={() => setEditSel(true)}>
              <Pencil aria-hidden /> Change selection
            </Button>
          )}
        </Card>
      )}

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
            initialFilter={readOnly ? 'all' : 'attention'}
            readOnly={readOnly}
            readOnlyReason="Matrix frozen after submission."
            onDecide={(ids, d) => {
              s.decide(id, ids, d);
              toast.success(ids.length > 1 ? `${ids.length} rows accepted` : `${ids[0]}: ${d.decision}`);
            }}
            onClearDecision={(rid) => s.clearDecision(id, rid)}
            mitigationAction={mitigationAction}
            detailExtras={detailExtras}
            groupBy={sourceGroup}
            flagged={(r) => changedIds.includes(r.requirementId)}
            rowBadges={(r) =>
              changedIds.includes(r.requirementId) ? <span className="rounded bg-amber-100 px-1.5 text-[11px] font-medium text-amber">Needs review — library changed</span> : r.reassessedAt ? <span className="rounded bg-blue-100 px-1.5 text-[11px] text-blue">Re-assessed</span> : null
            }
            headerBadges={(r) => (changedIds.includes(r.requirementId) ? <span className="rounded bg-amber-100 px-1.5 text-[11px] font-medium text-amber">Needs review — library changed</span> : null)}
          />
        </>
      ) : (
        <Card className="p-10 text-center text-sm text-ink-2">
          <p className="font-medium text-ink">No assessment run yet</p>
          <p className="mt-1">
            {!work.lockedAt
              ? 'Lock the requirement set in Scoping first.'
              : confirmed
                ? 'Run the assessment: the AI drafts an assessment for every requirement in the locked set against the confirmed documentation; you decide on each row.'
                : 'Select and confirm the documentation to assess above.'}
          </p>
        </Card>
      )}

      <Dialog open={!!scriptDialog} onOpenChange={(o) => !o && setScriptDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run script check</DialogTitle>
            <DialogDescription>{scriptDialog?.mitigation?.text}</DialogDescription>
          </DialogHeader>
          <Banner tone="warn">
            The code repository is not linked to this workspace, so the script cannot run here. Request the link; the script result will appear as a grey “Script” check on the row.
          </Banner>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScriptDialog(null)}>
              Not now
            </Button>
            <Button
              onClick={() => {
                logAudit({ line: '1lod', modelId: work!.modelId, type: 'Repository link requested', detail: `Link to the code repository requested to run ${scriptDialog?.mitigation?.text.match(/\b(CC|VR)-\d+/)?.[0]} for ${scriptDialog?.requirementId}.` });
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
              `${reqs.find((r) => r.id === justification.requirementId)?.text.replace(/\.$/, '')}: this obligation is evidenced outside the ${COMPONENT_LABEL[work.component]} component. It is implemented and documented in the related model documentation, which is referenced from the assessed document; the scope of this component does not cover it.`}
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
