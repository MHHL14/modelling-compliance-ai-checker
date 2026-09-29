'use client';
import { CheckCircle2, Download, FileText, Send, Trash2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { AiDraftBadge, SeverityBadge } from '@/components/common/badges';
import { PackageImport } from '@/components/common/PackageImport';
import { ReasonDialog } from '@/components/common/ReasonDialog';
import { Card, Dl, EmptyState, PageHeader } from '@/components/common/ui-bits';
import { useReviewCtx } from '@/components/val/useReviewCtx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { fmtDateTime } from '@/lib/clock';
import { downloadJson, fileNameFor, manifest, packageId, seal } from '@/lib/packages';
import { can, INDEPENDENCE_TOOLTIP } from '@/lib/permissions';
import { PERSONAS } from '@/lib/seed';
import { cn } from '@/lib/utils';
import type { Finding, FindingsPackage } from '@/lib/types';
import { use2lod } from '@/stores/store2lod';

const STATUS: Record<Finding['status'], { label: string; cls: string }> = {
  draft: { label: 'Draft — not visible to 1st line', cls: 'bg-blue-100 text-blue' },
  issued: { label: 'Issued', cls: 'bg-lod2 text-white' },
  response_submitted: { label: 'Response received', cls: 'bg-amber-100 text-amber' },
  closed: { label: 'Closed', cls: 'bg-green-100 text-green-800' },
};

function FindingEditor({ f, snapshotId }: { f: Finding; snapshotId: string }) {
  const s = use2lod();
  const [closeOpen, setCloseOpen] = useState(false);
  const draft = f.status === 'draft';
  const upd = (p: Partial<Finding>) => s.updateFinding(snapshotId, f.id, p);
  return (
    <Card id={f.id} className={cn('overflow-hidden scroll-mt-20', draft && 'border-blue-100')}>
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-bg/60 px-5 py-3">
        <span className="font-mono text-sm font-semibold">{f.id}</span>
        <SeverityBadge severity={f.severity} />
        {f.aiDrafted && draft && <AiDraftBadge />}
        {f.kind === 'scoping_gap' && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber">Scoping gap</span>}
        <span className="text-xs text-ink-2">{f.requirementRefs.join(' / ')}</span>
        <span className={cn('ml-auto rounded-full px-2 py-0.5 text-xs font-medium', STATUS[f.status].cls)}>{STATUS[f.status].label}</span>
      </div>
      {draft ? (
        <div className="grid gap-3 px-5 py-4 md:grid-cols-2">
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor={`${f.id}-title`}>Title</Label>
            <Input id={`${f.id}-title`} value={f.title} onChange={(e) => upd({ title: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Severity</Label>
            <Select value={f.severity} onValueChange={(v) => upd({ severity: v as Finding['severity'] })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor={`${f.id}-owner`}>Owner</Label>
              <Input id={`${f.id}-owner`} value={f.owner} onChange={(e) => upd({ owner: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${f.id}-deadline`}>Deadline</Label>
              <Input id={`${f.id}-deadline`} type="date" value={f.deadline} onChange={(e) => upd({ deadline: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor={`${f.id}-obs`}>Observation</Label>
            <Textarea id={`${f.id}-obs`} rows={3} value={f.observation} onChange={(e) => upd({ observation: e.target.value })} />
          </div>
          {!!f.evidenceQuotes?.length && (
            <div className="space-y-1 md:col-span-2">
              <Label>Evidence (document passage + code line)</Label>
              <ul className="space-y-1">
                {f.evidenceQuotes.map((q, i) => (
                  <li key={i} className={cn('rounded px-3 py-1.5 text-xs', q.startsWith('Script') ? 'bg-script font-mono' : 'doc-serif border-l-4 border-yellow bg-yellow-100/60 text-[13px]')}>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor={`${f.id}-impact`}>Impact</Label>
            <Textarea id={`${f.id}-impact`} rows={2} value={f.impact} onChange={(e) => upd({ impact: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${f.id}-chal`}>Challenge question</Label>
            <Textarea id={`${f.id}-chal`} rows={2} value={f.challenge} onChange={(e) => upd({ challenge: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 md:col-span-2">
            <Button variant="ghost" onClick={() => s.deleteFinding(snapshotId, f.id)}>
              <Trash2 aria-hidden /> Discard
            </Button>
            <Button
              className="bg-lod2 hover:bg-lod2/90"
              disabled={!f.title.trim() || !f.observation.trim()}
              onClick={() => {
                s.issueFinding(snapshotId, f.id);
                toast.success(`${f.id} issued`, { description: 'It will be included in the next findings package.' });
              }}
            >
              <Send aria-hidden /> Issue finding
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 px-5 py-4 lg:grid-cols-2">
          <Dl
            items={[
              ['Title', <strong key="t">{f.title}</strong>],
              ['Observation', f.observation],
              ['Impact', f.impact],
              ['Challenge', <em key="c">{f.challenge}</em>],
              ['Owner · deadline', `${f.owner} · ${f.deadline}`],
              ['Issued', fmtDateTime(f.issuedAt)],
            ]}
          />
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-2">1st line response</p>
            {f.response ? (
              <div className="rounded-lg border border-line bg-bg/60 p-3 text-sm">
                <p>{f.response.plan}</p>
                {f.response.evidence.map((e) => (
                  <p key={e.id} className="mt-1 flex items-center gap-1 text-xs text-ink-2">
                    <FileText className="size-3" aria-hidden /> {e.name}
                  </p>
                ))}
                <p className="mt-1 text-xs text-ink-3">Received {fmtDateTime(f.response.at)} via response package</p>
              </div>
            ) : (
              <p className="text-sm text-ink-2">No response yet — arrives via a response package.</p>
            )}
            {f.closure ? (
              <p className="flex items-start gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-900">
                <CheckCircle2 className="mt-0.5 size-4" aria-hidden /> Closed {fmtDateTime(f.closure.at)} — {f.closure.note}
              </p>
            ) : (
              f.response && (
                <Button size="sm" variant="outline" onClick={() => setCloseOpen(true)}>
                  <CheckCircle2 aria-hidden /> Close finding
                </Button>
              )
            )}
          </div>
        </div>
      )}
      <ReasonDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title={`Close ${f.id}`}
        label="Closure note"
        placeholder="e.g. Remediation plan accepted; closure evidence to be verified in the annual review."
        confirmLabel="Close finding"
        onConfirm={(note) => {
          s.closeFinding(snapshotId, f.id, note);
          toast.success(`${f.id} closed`);
        }}
      />
    </Card>
  );
}

export default function ValFindings() {
  const { snapshotId } = useParams<{ snapshotId: string }>();
  const { review, id } = useReviewCtx(snapshotId);
  const s = use2lod();
  if (!review) return null;
  const exportable = review.findings.filter((f) => f.status !== 'draft');
  const drafts = review.findings.filter((f) => f.status === 'draft');
  const order = { draft: 0, issued: 1, response_submitted: 2, closed: 3 };

  async function exportFindings() {
    if (!can('2lod', 'export:findings')) return;
    const pkg = await seal<FindingsPackage>({
      manifest: manifest({
        packageType: 'findings',
        packageId: packageId('findings', review!.modelId, review!.findingExports.length + 1),
        modelId: review!.modelId,
        createdBy: PERSONAS['2lod'].name,
        line: '2lod',
        libraryVersion: review!.pkg.manifest.libraryVersion,
        requirementSetId: review!.pkg.manifest.requirementSetId,
        documentVersions: review!.pkg.manifest.documentVersions,
      }),
      findings: exportable.map((f) => ({ ...f, aiDrafted: f.aiDrafted })),
      opinionSummary: review!.opinion?.issuedAt ? `${review!.opinion.rating.replace(/_/g, ' ')} — ${review!.opinion.conditions.length} condition(s)` : undefined,
    });
    downloadJson(fileNameFor(pkg.manifest), pkg);
    s.recordFindingsExport(id, pkg.manifest.packageId, pkg.manifest.sha256, exportable.map((f) => f.id));
    toast.success(`${fileNameFor(pkg.manifest)} downloaded`, { description: `${exportable.length} issued finding(s). Drafts and the 2nd line matrix are not included.` });
  }

  return (
    <div>
      <PageHeader
        eyebrow={`Findings · ${id}`}
        title="Findings"
        subtitle="Draft findings are AI-drafted and invisible to the 1st line. Only issued findings are exported."
        actions={
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button className="bg-lod2 hover:bg-lod2/90" disabled={!exportable.length} onClick={exportFindings}>
                  <Download aria-hidden /> Export findings package ({exportable.length})
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">{INDEPENDENCE_TOOLTIP}</TooltipContent>
          </Tooltip>
        }
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {review.findings.length === 0 ? (
            <EmptyState title="No findings yet">Draft findings from the Compare stage (“Draft finding”) or from a scoping challenge.</EmptyState>
          ) : (
            [...review.findings].sort((a, b) => order[a.status] - order[b.status]).map((f) => <FindingEditor key={f.id} f={f} snapshotId={id} />)
          )}
        </div>
        <div className="space-y-4">
          <Card className="p-4 text-sm">
            <p className="font-semibold">Status</p>
            <p className="mt-1 text-ink-2">
              {drafts.length} draft · {exportable.filter((f) => f.status === 'issued').length} issued · {exportable.filter((f) => f.status === 'response_submitted').length} with response ·{' '}
              {exportable.filter((f) => f.status === 'closed').length} closed
            </p>
            {review.findingExports.map((e) => (
              <p key={e.packageId} className="mt-2 rounded border border-line px-2 py-1 text-xs text-ink-2">
                <span className="font-mono">{e.packageId}</span> exported {fmtDateTime(e.at)} · {e.findingIds.join(', ')}
              </p>
            ))}
          </Card>
          <Card className="p-4">
            <p className="mb-3 text-sm font-semibold">Import response package</p>
            <PackageImport
              type="response"
              expectedModelId={review.modelId}
              demoFile={`RSP-${review.modelId}-20270614.rcc.json`}
              onVerified={(pkg, sha) => {
                const n = s.importResponses(id, pkg, sha);
                return n ? `${pkg.responses.length} remediation plan(s) received.` : 'Already imported — nothing changed (idempotent).';
              }}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
