'use client';
import { ArrowRight, FileText, Inbox } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { SeverityBadge, VERDICT_LABEL, VerdictBadge } from '@/components/common/badges';
import { Card, CardHeader, Dl, Kpi, PageHeader } from '@/components/common/ui-bits';
import { currentStageLabel } from '@/components/dev/modelStatus';
import { useModelCtx } from '@/components/dev/useModelCtx';
import { Button } from '@/components/ui/button';
import { applicableDocs } from '@/lib/applicability';
import { fmtDateTime } from '@/lib/clock';
import type { Verdict } from '@/lib/types';
import { finalVerdict } from '@/stores/store1lod';

const ORDER: Verdict[] = ['compliant', 'partial', 'non_compliant', 'not_found', 'not_applicable'];

export default function ModelOverview() {
  const { id } = useParams<{ id: string }>();
  const { model, work, pilot, inSet } = useModelCtx(id);
  if (!model || !work) return null;
  const rows = work.run?.rows ?? [];
  const counts = ORDER.map((v) => [v, rows.filter((r) => finalVerdict(r) === v).length] as const);
  const decided = rows.filter((r) => r.decision).length;
  const next = !work.lockedAt ? 'scope' : !pilot ? 'scope' : work.submission ? 'findings' : 'assess';
  return (
    <div>
      <PageHeader
        eyebrow={`${model.id} · ${model.regulatory_use} · Tier ${model.tier}`}
        title={model.name}
        subtitle={currentStageLabel(model, work)}
        actions={
          <Button asChild>
            <Link href={`/dev/models/${id}/${next}`}>
              Continue <ArrowRight aria-hidden />
            </Link>
          </Button>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Requirements in set" value={inSet.length} hint={work.lockedAt ? `${work.reqSetId} locked` : 'Not locked yet'} />
        <Kpi label="Applicable documents" value={applicableDocs(model).length + work.addedDocuments.length} hint={`${work.addedDocuments.length} user added`} />
        <Kpi label="Reviewed" value={pilot ? `${decided}/${rows.length}` : '—'} hint="Rows with a human decision" tone="good" />
        <Kpi label="Findings received" value={work.findings.length} tone={work.findings.length ? 'bad' : 'default'} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Results by outcome" subtitle="Final outcomes (human decision where given, otherwise AI draft). No single compliance score by design." />
          <div className="space-y-2 px-5 py-4">
            {pilot && rows.length ? (
              counts.map(([v, n]) => (
                <div key={v} className="flex items-center gap-3">
                  <div className="w-32">
                    <VerdictBadge verdict={v} />
                  </div>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-bg">
                    <div
                      className={{ compliant: 'bg-green-600', partial: 'bg-amber', non_compliant: 'bg-red', not_found: 'bg-[#9aa7a7]', not_applicable: 'bg-[#cfd6d6]' }[v] + ' h-full'}
                      style={{ width: `${rows.length ? (n / rows.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm tabular-nums" aria-label={`${VERDICT_LABEL[v]}: ${n}`}>
                    {n}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-2">No self-assessment run for this model in the prototype.</p>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Model inventory" />
          <div className="px-5 py-4">
            <Dl
              items={[
                ['Purpose', model.purpose],
                ['Methodology', model.methodology],
                ['Portfolio', model.portfolio],
                ['Owner (1st line)', model.owner_1lod],
                ['Validator (2nd line)', model.validator_2lod],
                ['AI Act', model.ai_act_assessment],
                ['Evidence', model.evidence_documents.map((d) => d.title).join(' · ')],
              ]}
            />
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Inbox className="size-4" aria-hidden /> Findings received
              </span>
            }
            subtitle="Findings arrive only through a findings package exported by the 2nd line."
            actions={
              pilot && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dev/models/${id}/findings`}>Open findings</Link>
                </Button>
              )
            }
          />
          <div className="px-5 py-4">
            {work.findings.length ? (
              <ul className="divide-y divide-line">
                {work.findings.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 py-2 text-sm">
                    <span className="font-mono text-xs font-semibold">{f.id}</span>
                    <SeverityBadge severity={f.severity} />
                    <span className="flex-1">{f.title}</span>
                    <span className="text-xs text-ink-2">due {f.deadline}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-2 text-sm text-ink-2">
                <FileText className="size-4" aria-hidden /> No findings package imported yet.
                {work.submission && ` Submission ${work.submission.packageId} exported ${fmtDateTime(work.submission.at)}.`}
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
