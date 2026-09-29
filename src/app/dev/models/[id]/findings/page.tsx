'use client';
import { Download, FileText, Inbox, Save } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { SeverityBadge } from '@/components/common/badges';
import { FileDrop } from '@/components/common/FileDrop';
import { PackageImport, VerificationCard } from '@/components/common/PackageImport';
import { Card, Dl, EmptyState, PageHeader } from '@/components/common/ui-bits';
import { PilotOnly } from '@/components/dev/PilotOnly';
import { useModelCtx } from '@/components/dev/useModelCtx';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { fmtDateTime, nowISO } from '@/lib/clock';
import { downloadJson, fileNameFor, manifest, packageId, seal } from '@/lib/packages';
import { can, INDEPENDENCE_TOOLTIP } from '@/lib/permissions';
import { uid } from '@/lib/rng';
import { LIBRARY_BASE_VERSION, PERSONAS } from '@/lib/seed';
import type { Finding, ResponsePackage, Upload } from '@/lib/types';
import { use1lod } from '@/stores/store1lod';

const STATUS_LABEL: Record<Finding['status'], string> = { draft: 'Draft', issued: 'Open — response required', response_submitted: 'Response submitted', closed: 'Closed' };

function FindingCard({ f, modelId, readOnly }: { f: Finding; modelId: string; readOnly: boolean }) {
  const save = use1lod((s) => s.saveResponse);
  const [plan, setPlan] = useState(f.response?.plan ?? '');
  const [evidence, setEvidence] = useState<Upload[]>(f.response?.evidence ?? []);
  const dirty = plan !== (f.response?.plan ?? '') || evidence.length !== (f.response?.evidence.length ?? 0);
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-bg/60 px-5 py-3">
        <span className="font-mono text-sm font-semibold">{f.id}</span>
        <SeverityBadge severity={f.severity} />
        <span className="font-semibold text-ink">{f.title}</span>
        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-medium ring-1 ring-line">{STATUS_LABEL[f.status]}</span>
      </div>
      <div className="grid gap-5 px-5 py-4 lg:grid-cols-2">
        <Dl
          items={[
            ['Requirement', f.requirementRefs.join(' / ')],
            ['Observation', f.observation],
            ['Impact', f.impact],
            ['Challenge', <em key="c">{f.challenge}</em>],
            ['Owner', f.owner],
            ['Deadline', f.deadline],
          ]}
        />
        <div className="space-y-2">
          <Label htmlFor={`plan-${f.id}`}>Remediation plan</Label>
          <Textarea
            id={`plan-${f.id}`}
            rows={4}
            value={plan}
            disabled={readOnly}
            onChange={(e) => setPlan(e.target.value)}
            placeholder="What will be done, by whom and when — e.g. correct MAT_ABS to EUR 100, rebuild the RDS and quantify the PD impact per vintage by 2027-09-15."
          />
          {!readOnly && (
            <FileDrop
              compact
              label="Attach evidence (metadata only)"
              onFiles={(files) => setEvidence((ev) => [...ev, ...files.map((x) => ({ id: uid('UPL'), name: x.name, size: x.size, kind: 'evidence' as const, uploadedAt: nowISO(), mime: x.type }))])}
            />
          )}
          {evidence.length > 0 && (
            <ul className="text-xs text-ink-2">
              {evidence.map((e) => (
                <li key={e.id} className="flex items-center gap-1">
                  <FileText className="size-3" aria-hidden /> {e.name} · {(e.size / 1024).toFixed(1)} KB
                </li>
              ))}
            </ul>
          )}
          {!readOnly && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                disabled={plan.trim().length < 10 || !dirty}
                onClick={() => {
                  save(modelId, f.id, plan.trim(), evidence);
                  toast.success(`Response for ${f.id} saved`, { description: 'Export the response package to send it to the 2nd line.' });
                }}
              >
                <Save aria-hidden /> Save response
              </Button>
              {f.response && <span className="text-xs text-ink-2">Saved {fmtDateTime(f.response.at)}</span>}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function FindingsPage() {
  const { id } = useParams<{ id: string }>();
  const { model, work, pilot } = useModelCtx(id);
  const s = use1lod();
  if (!model || !work) return null;
  if (!pilot) return <PilotOnly stage="Findings" modelId={id} />;
  const pending = work.findings.filter((f) => f.response && f.status === 'issued');

  async function exportResponses() {
    if (!can('1lod', 'export:response')) return;
    const pkg = await seal<ResponsePackage>({
      manifest: manifest({
        packageType: 'response',
        packageId: packageId('response', id, work!.responseExports.length + 1),
        modelId: id,
        createdBy: PERSONAS['1lod'].name,
        line: '1lod',
        libraryVersion: work!.run?.libraryVersion ?? LIBRARY_BASE_VERSION,
        requirementSetId: work!.reqSetId,
        documentVersions: work!.run?.documentVersions ?? {},
      }),
      responses: pending.map((f) => ({ findingId: f.id, plan: f.response!.plan, evidence: f.response!.evidence })),
    });
    downloadJson(fileNameFor(pkg.manifest), pkg);
    s.recordResponseExport(id, pkg.manifest.packageId, pkg.manifest.sha256, pending.map((f) => f.id));
    toast.success(`${fileNameFor(pkg.manifest)} downloaded`, { description: `${pending.length} response(s) for the 2nd line.` });
  }

  return (
    <div>
      <PageHeader
        eyebrow={`Findings · ${model.id}`}
        title="Findings received"
        subtitle="Findings from the 2nd line arrive only as a verified findings package. Draft findings of the validator are never visible here."
        actions={
          work.findings.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button disabled={!pending.length} onClick={exportResponses}>
                    <Download aria-hidden /> Export response package ({pending.length})
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">{INDEPENDENCE_TOOLTIP}</TooltipContent>
            </Tooltip>
          )
        }
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          {work.findings.length === 0 ? (
            <EmptyState icon={<Inbox className="size-5" aria-hidden />} title="No findings package imported yet">
              When Model Validation has issued findings, they send a findings package (FND-…rcc.json). Import it on the right; integrity is verified before anything is shown.
            </EmptyState>
          ) : (
            work.findings.map((f) => <FindingCard key={f.id} f={f} modelId={id} readOnly={f.status === 'response_submitted' || f.status === 'closed'} />)
          )}
        </div>
        <div className="space-y-4">
          <Card className="p-4">
            <p className="mb-3 text-sm font-semibold">Import findings package</p>
            <PackageImport
              type="findings"
              expectedModelId={id}
              demoFile={`FND-${id}-20270614.rcc.json`}
              onVerified={(pkg, sha) => {
                const n = s.importFindings(id, { packageId: pkg.manifest.packageId, sha256: sha, createdBy: pkg.manifest.createdBy, createdAt: pkg.manifest.createdAt, opinionSummary: pkg.opinionSummary }, pkg.findings);
                return n ? `${n} issued finding(s) imported.` : 'Already imported — nothing changed (idempotent).';
              }}
            />
          </Card>
          {work.importedFindingPackages.map((p) => (
            <VerificationCard
              key={p.packageId}
              m={{ packageType: 'findings', packageId: p.packageId, modelId: id, createdAt: p.createdAt, createdBy: p.createdBy, line: '2lod', libraryVersion: work.run?.libraryVersion ?? '3.2', requirementSetId: work.reqSetId, documentVersions: {}, schemaVersion: '1.0', sha256: p.sha256 }}
              note={p.opinionSummary ? <span><strong>Validation opinion:</strong> {p.opinionSummary}</span> : `Imported ${fmtDateTime(p.at)}`}
            />
          ))}
          {work.responseExports.map((r) => (
            <p key={r.packageId} className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-ink-2">
              Response package <span className="font-mono">{r.packageId}</span> exported {fmtDateTime(r.at)}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
