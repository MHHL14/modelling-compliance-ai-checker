'use client';
import { CheckCircle2, Download, PackageCheck, Snowflake, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { VerdictBadge } from '@/components/common/badges';
import { Banner, Card, CardHeader, PageHeader } from '@/components/common/ui-bits';
import { buildSubmission, SIGN_OFF } from '@/components/dev/buildSubmission';
import { PilotOnly } from '@/components/dev/PilotOnly';
import { useModelCtx } from '@/components/dev/useModelCtx';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { simulateShort } from '@/lib/ai/provider';
import { fmtDateTime } from '@/lib/clock';
import { shortHash } from '@/lib/hash';
import { downloadJson, fileNameFor } from '@/lib/packages';
import { can, INDEPENDENCE_TOOLTIP } from '@/lib/permissions';
import { RDS_ID } from '@/lib/ai/pilot';
import type { Verdict } from '@/lib/types';
import { finalVerdict, use1lod } from '@/stores/store1lod';

const ORDER: Verdict[] = ['compliant', 'partial', 'non_compliant', 'not_found', 'not_applicable'];

export default function SubmitPage() {
  const { id } = useParams<{ id: string }>();
  const { model, work, pilot } = useModelCtx(id);
  const record = use1lod((s) => s.recordSubmission);
  const [signed, setSigned] = useState(false);
  if (!model || !work) return null;
  if (!pilot) return <PilotOnly stage="Submit" modelId={id} />;

  const rows = work.run?.rows ?? [];
  const undecided = rows.filter((r) => !r.decision);
  const missingMit = rows.filter((r) => ['partial', 'non_compliant'].includes(finalVerdict(r)) && !r.mitigation && !r.decision?.reason);
  const docVersions = [`${RDS_ID} v1.0`, ...work.evidenceDocs.map((d) => `${d.id} v${d.version}`)];
  const checks = [
    { ok: !!work.lockedAt, label: 'Requirement set locked', detail: work.lockedAt ? `${work.reqSetId} v${work.setVersion} · ${fmtDateTime(work.lockedAt)}` : 'Lock the set in Scoping', href: `/dev/models/${id}/scope` },
    { ok: rows.length > 0 && undecided.length === 0, label: 'All rows decided', detail: undecided.length ? `${undecided.length} row(s) without a human decision: ${undecided.map((r) => r.requirementId).join(', ')}` : `${rows.length}/${rows.length}`, href: `/dev/models/${id}/assess` },
    { ok: missingMit.length === 0, label: 'All non-compliant / partial rows have a mitigation or justification', detail: missingMit.length ? missingMit.map((r) => r.requirementId).join(', ') : 'OK', href: `/dev/models/${id}/assess` },
    { ok: true, label: 'Document versions frozen', detail: docVersions.join(' · ') },
  ];
  const allOk = checks.every((c) => c.ok);

  async function freeze() {
    if (!can('1lod', 'export:submission')) return;
    await simulateShort('Freezing and exporting submission package', ['Freezing 1st line matrix…', 'Bundling locked requirement set and document text…', 'Computing SHA-256…'], 1500);
    const pkg = await buildSubmission(work!);
    const fileName = fileNameFor(pkg.manifest);
    const json = JSON.stringify(pkg);
    downloadJson(fileName, pkg);
    record(id, { packageId: pkg.manifest.packageId, sha256: pkg.manifest.sha256, at: pkg.manifest.createdAt, fileName, packageJson: json });
    toast.success(`${fileName} downloaded`);
  }

  if (work.submission) {
    return (
      <div>
        <PageHeader eyebrow={`Submit · ${model.id}`} title="Submission exported" />
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <PackageCheck className="mt-0.5 size-8 text-green-600" aria-hidden />
            <div className="space-y-2">
              <p className="text-lg font-semibold">
                Package <span className="font-mono">{work.submission.packageId}</span> exported
              </p>
              <p className="font-mono text-sm text-ink-2">SHA-256 {shortHash(work.submission.sha256)} · {fmtDateTime(work.submission.at)}</p>
              <p className="max-w-2xl text-sm text-ink">
                Send it to Model Validation through the regular channel. The 2nd line will assess independently; findings come back as a findings package.
              </p>
              <p className="text-sm text-ink-2">The 1st line matrix is frozen (read-only).</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={() => downloadJson(work.submission!.fileName, JSON.parse(work.submission!.packageJson))}>
                      <Download aria-hidden /> Download {work.submission.fileName} again
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">{INDEPENDENCE_TOOLTIP}</TooltipContent>
                </Tooltip>
                <Button asChild variant="ghost">
                  <Link href={`/dev/models/${id}/findings`}>Go to Findings</Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow={`Submit · ${model.id}`} title="Submit to Model Validation" subtitle="Freeze the self-assessment and export the submission package for the 2nd line." />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Checklist" />
            <ul className="divide-y divide-line">
              {checks.map((c) => (
                <li key={c.label} className="flex items-start gap-3 px-5 py-3">
                  {c.ok ? <CheckCircle2 className="mt-0.5 size-5 text-green-600" aria-label="done" /> : <XCircle className="mt-0.5 size-5 text-red" aria-label="open" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{c.label}</p>
                    <p className="text-xs text-ink-2">{c.detail}</p>
                  </div>
                  {!c.ok && c.href && (
                    <Button asChild size="xs" variant="outline">
                      <Link href={c.href}>Fix</Link>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={signed} onCheckedChange={(v) => setSigned(!!v)} className="mt-0.5" disabled={!allOk} />
              <span>
                <strong>Sign-off.</strong> {SIGN_OFF}
                <span className="block text-xs text-ink-2">Sanne de Vries, Model Developer, Retail Credit Risk Modelling</span>
              </span>
            </label>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button className="bg-yellow text-green-900 hover:bg-yellow/85" disabled={!allOk || !signed} onClick={freeze}>
                      <Snowflake aria-hidden /> Freeze & export submission package
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">{INDEPENDENCE_TOOLTIP}</TooltipContent>
              </Tooltip>
              {!allOk && <span className="text-xs text-ink-2">Complete the checklist first.</span>}
            </div>
          </Card>
        </div>
        <Card className="h-fit">
          <CardHeader title="Summary by final outcome" subtitle="No single compliance score." />
          <ul className="space-y-2 px-5 py-4">
            {ORDER.map((v) => (
              <li key={v} className="flex items-center justify-between">
                <VerdictBadge verdict={v} />
                <span className="font-semibold tabular-nums">{rows.filter((r) => finalVerdict(r) === v).length}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-line px-5 py-3">
            <Banner tone="info">The package contains the locked requirement set, the frozen document text, upload metadata, your final matrix and the sign-off statement — nothing else.</Banner>
          </div>
        </Card>
      </div>
    </div>
  );
}
