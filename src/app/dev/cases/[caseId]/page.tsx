'use client';
import { ArrowRight, FileText, Inbox } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { SeverityBadge, VERDICT_LABEL, VerdictBadge } from '@/components/common/badges';
import { Card, CardHeader, Dl, Kpi, PageHeader } from '@/components/common/ui-bits';
import { caseSegments, caseStageLabel } from '@/components/dev/caseProgress';
import { useCaseCtx } from '@/components/dev/useCaseCtx';
import { Button } from '@/components/ui/button';
import { COMPONENT_LABEL } from '@/lib/ai/generic';
import { applicableDocs } from '@/lib/applicability';
import { fmtDateTime } from '@/lib/clock';
import type { Verdict } from '@/lib/types';
import { finalVerdict } from '@/stores/store1lod';

const ORDER: Verdict[] = ['compliant', 'partial', 'non_compliant', 'not_found', 'not_applicable'];
const STAGE_PATHS = ['scope', 'draft', 'assess', 'submit', 'findings'];

export default function CaseOverview() {
  const { caseId } = useParams<{ caseId: string }>();
  const { id, uc, model, sc, inSet } = useCaseCtx(caseId);
  if (!uc || !model || !sc) return null;
  const rows = uc.run?.rows ?? [];
  const counts = ORDER.map((v) => [v, rows.filter((r) => finalVerdict(r) === v).length] as const);
  const decided = rows.filter((r) => r.decision).length;
  const cur = caseSegments(uc).indexOf('current');
  const next = STAGE_PATHS[cur < 0 ? 4 : cur];
  return (
    <div>
      <PageHeader
        eyebrow={`${model.id} · ${uc.cycle} · ${COMPONENT_LABEL[uc.component]}`}
        title={model.name}
        subtitle={caseStageLabel(uc)}
        actions={
          <Button asChild>
            <Link href={`/dev/cases/${encodeURIComponent(id)}/${next}`}>
              {uc.status === 'completed' ? 'View findings' : 'Continue'} <ArrowRight aria-hidden />
            </Link>
          </Button>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Requirements in set" value={uc.generatedAt ? inSet.length : '—'} hint={uc.lockedAt ? `${uc.reqSetId} locked` : 'Not locked yet'} />
        <Kpi label="Applicable documents" value={applicableDocs({ tags: uc.attributes.tags }).length + uc.addedDocuments.length} hint={`${uc.addedDocuments.length} user added`} />
        <Kpi label="Reviewed" value={uc.run ? `${decided}/${rows.length}` : '—'} hint="Rows with a human decision" tone="good" />
        <Kpi label="Findings received" value={uc.findings.length} tone={uc.findings.length ? 'bad' : 'default'} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Results by outcome" subtitle="Final outcomes (human decision where given, otherwise the AI assessment). No single compliance score by design." />
          <div className="space-y-2 px-5 py-4">
            {rows.length ? (
              counts.map(([v, n]) => (
                <div key={v} className="flex items-center gap-3">
                  <div className="w-32">
                    <VerdictBadge verdict={v} />
                  </div>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-bg">
                    <div
                      className={{ compliant: 'bg-green-600', partial: 'bg-amber', non_compliant: 'bg-red', not_found: 'bg-[#9aa7a7]', not_applicable: 'bg-[#cfd6d6]' }[v] + ' h-full'}
                      style={{ width: `${(n / rows.length) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm tabular-nums" aria-label={`${VERDICT_LABEL[v]}: ${n}`}>
                    {n}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-2">No self-assessment run yet.</p>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Model characteristics" subtitle="Confirmed in the use case wizard" />
          <div className="px-5 py-4">
            <Dl
              items={[
                ['Purpose', uc.attributes.purpose],
                ['Methodology', uc.attributes.methodology],
                ['Portfolio', uc.attributes.portfolio],
                ['Regulatory use', `${uc.attributes.regulatory_use} · Tier ${uc.attributes.tier}`],
                ['Assessed document', `${sc.document.title} (v${sc.document.finalVersion})`],
                ['Owner (1st line)', model.owner_1lod],
                ['Validator (2nd line)', model.validator_2lod],
                ['AI Act', model.ai_act_assessment],
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
              <Button asChild variant="outline" size="sm">
                <Link href={`/dev/cases/${encodeURIComponent(id)}/findings`}>Open findings</Link>
              </Button>
            }
          />
          <div className="px-5 py-4">
            {uc.findings.length ? (
              <ul className="divide-y divide-line">
                {uc.findings.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 py-2 text-sm">
                    <span className="font-mono text-xs font-semibold">{f.id}</span>
                    <SeverityBadge severity={f.severity} />
                    <span className="flex-1">{f.title}</span>
                    <span className="text-xs text-ink-2">{f.status === 'closed' ? 'Closed' : `due ${f.deadline}`}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-2 text-sm text-ink-2">
                <FileText className="size-4" aria-hidden /> No findings package imported yet.
                {uc.submission && ` Submission ${uc.submission.packageId} exported ${fmtDateTime(uc.submission.at)}.`}
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
