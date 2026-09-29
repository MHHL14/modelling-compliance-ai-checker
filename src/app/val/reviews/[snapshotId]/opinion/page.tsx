'use client';
import { Download, Printer, Send, Sparkles } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { AiDraftBadge, SeverityBadge, VerdictBadge } from '@/components/common/badges';
import { Banner, Card, CardHeader, Dl, PageHeader } from '@/components/common/ui-bits';
import { useReviewCtx } from '@/components/val/useReviewCtx';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { fmtDateTime } from '@/lib/clock';
import { exportSheets } from '@/lib/excel';
import type { Verdict } from '@/lib/types';
import { final2lod, use2lod, type OpinionRating } from '@/stores/store2lod';
import { logAudit } from '@/stores/storeAudit';

const RATING: Record<OpinionRating, string> = { fit: 'Fit for purpose', fit_with_conditions: 'Fit with conditions', not_fit: 'Not fit for purpose' };
const ORDER: Verdict[] = ['compliant', 'partial', 'non_compliant', 'not_found', 'not_applicable'];

export default function Opinion() {
  const { snapshotId } = useParams<{ snapshotId: string }>();
  const { review, model, id } = useReviewCtx(snapshotId);
  const s = use2lod();

  const high = review?.findings.filter((f) => f.severity === 'high') ?? [];
  useEffect(() => {
    if (!review || review.opinion) return;
    const rating: OpinionRating = high.length === 0 ? 'fit' : high.length > 3 ? 'not_fit' : 'fit_with_conditions';
    const rows = review.run?.rows ?? [];
    const nc = rows.filter((r) => final2lod(r) === 'non_compliant').length;
    const partial = rows.filter((r) => final2lod(r) === 'partial').length;
    s.saveOpinion(id, {
      rating,
      drafted: true,
      rationale: `The independent validation of ${model?.name ?? review.modelId} (${review.pkg.requirementSet.component}) assessed ${rows.length} requirements, including ${review.validationLayer.length} validation-layer requirements, against the frozen submission ${id}. ${nc} requirement(s) were assessed as non-compliant and ${partial} as partially compliant. ${high.length ? `${high.length} high-severity finding(s) (${high.map((f) => `“${f.title}”`).join('; ')}) affect the reliability of the default flag and the conservatism of the calibration, but can be remediated without redevelopment of the model.` : 'No high-severity findings were raised.'} The model is therefore considered ${RATING[rating].toLowerCase()}${high.length ? ', subject to the conditions below' : ''}.`,
      conditions: high.map((f) => `${f.id} — ${f.title}: remediation to be completed and evidenced by ${f.deadline}.`),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [review?.snapshotId, !!review?.opinion]);

  if (!review || !review.opinion) return null;
  const o = review.opinion;
  const rows = review.run?.rows ?? [];
  const issued = !!o.issuedAt;
  const findings = review.findings.filter((f) => f.status !== 'draft');

  function exportXlsx() {
    exportSheets(`Committee-summary-${review!.modelId}-${id}.xlsx`, [
      {
        name: 'Summary',
        rows: [
          { Item: 'Model', Value: `${review!.modelId} ${model?.name ?? ''}` },
          { Item: 'Snapshot', Value: id },
          { Item: 'Requirement set', Value: `${review!.pkg.manifest.requirementSetId} · library v${review!.pkg.manifest.libraryVersion}` },
          { Item: 'Document versions', Value: Object.entries(review!.pkg.manifest.documentVersions).map(([k, v]) => `${k} v${v}`).join('; ') },
          { Item: 'Opinion', Value: RATING[o.rating] },
          { Item: 'Rationale', Value: o.rationale },
          ...o.conditions.map((c, i) => ({ Item: `Condition ${i + 1}`, Value: c })),
          { Item: 'Blind run', Value: `${review!.run?.id ?? '—'} · ${fmtDateTime(review!.run?.startedAt)}` },
          { Item: '1st line matrix revealed', Value: fmtDateTime(review!.revealedAt) },
          ...ORDER.map((v) => ({ Item: `Count ${v}`, Value: String(rows.filter((r) => final2lod(r) === v).length) })),
        ],
      },
      { name: 'Findings', rows: review!.findings.map((f) => ({ ID: f.id, Severity: f.severity, Title: f.title, Status: f.status, Requirement: f.requirementRefs.join(' / '), Owner: f.owner, Deadline: f.deadline, Observation: f.observation })) },
    ]);
    logAudit({ line: '2lod', modelId: review!.modelId, type: 'Committee summary exported', detail: `Committee summary for ${id} exported (.xlsx).` });
  }

  return (
    <div>
      <PageHeader
        eyebrow={`Opinion · ${id}`}
        title="Validation opinion"
        actions={
          <div className="no-print flex gap-2">
            <Button variant="outline" onClick={exportXlsx}>
              <Download aria-hidden /> Export (.xlsx)
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer aria-hidden /> Print view
            </Button>
          </div>
        }
      />
      <Card className="no-print mb-4">
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Sparkles className="size-4 text-blue" aria-hidden /> Opinion {!issued && <AiDraftBadge />}
            </span>
          }
          subtitle={issued ? `Issued ${fmtDateTime(o.issuedAt)} by Pieter Bakker` : `Suggested: “Fit with conditions” when there are 1–3 high-severity findings (${high.length} here).`}
        />
        <div className="space-y-3 px-5 py-4">
          <div className="max-w-xs space-y-1">
            <Label>Opinion</Label>
            <Select value={o.rating} disabled={issued} onValueChange={(v) => s.saveOpinion(id, { ...o, rating: v as OpinionRating })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RATING) as OpinionRating[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {RATING[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="rationale">Rationale</Label>
            <Textarea id="rationale" rows={5} value={o.rationale} disabled={issued} onChange={(e) => s.saveOpinion(id, { ...o, rationale: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="conditions">Conditions (one per line, derived from high findings)</Label>
            <Textarea id="conditions" rows={3} value={o.conditions.join('\n')} disabled={issued} onChange={(e) => s.saveOpinion(id, { ...o, conditions: e.target.value.split('\n').filter((x) => x.trim()) })} />
          </div>
          {!issued && (
            <div className="flex justify-end">
              <Button
                className="bg-lod2 hover:bg-lod2/90"
                onClick={() => {
                  s.issueOpinion(id);
                  toast.success(`Opinion issued: ${RATING[o.rating]}`);
                }}
              >
                <Send aria-hidden /> Issue opinion
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card className="print-area">
        <CardHeader title="Committee summary" subtitle={`Model Risk Committee · ${model?.name ?? review.modelId} · prototype · illustrative data`} />
        <div className="grid gap-6 px-5 py-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-lg border border-line p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-2">Opinion</p>
              <p className="mt-1 text-lg font-semibold text-lod2">{RATING[o.rating]}</p>
              <p className="mt-1 text-sm">{o.rationale}</p>
              {o.conditions.length > 0 && (
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                  {o.conditions.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ol>
              )}
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-2">Results by outcome (validator)</p>
              <ul className="grid grid-cols-2 gap-1.5 text-sm">
                {ORDER.map((v) => (
                  <li key={v} className="flex items-center justify-between rounded border border-line px-2 py-1">
                    <VerdictBadge verdict={v} />
                    <strong className="tabular-nums">{rows.filter((r) => final2lod(r) === v).length}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="space-y-4">
            <Dl
              items={[
                ['Snapshot', id],
                ['Requirement set', `${review.pkg.manifest.requirementSetId} · library v${review.pkg.manifest.libraryVersion}`],
                ['Documents', Object.entries(review.pkg.manifest.documentVersions).map(([k, v]) => `${k} v${v}`).join(' · ')],
                ['Validation layer', review.validationLayer.map((r) => r.id).join(', ')],
              ]}
            />
            <Banner tone="info">
              <strong>Independence statement.</strong> The 2nd line assessed the frozen submission blind: run {review.run?.id ?? '—'} at {fmtDateTime(review.run?.startedAt)} received no 1st line conclusions. The 1st line matrix was revealed at {fmtDateTime(review.revealedAt)}, after which blind assessments were locked. Both events are recorded in the audit trail.
            </Banner>
          </div>
          <div className="lg:col-span-2">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-2">Findings</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-2">
                  <th className="py-1.5 pr-2">ID</th>
                  <th className="py-1.5 pr-2">Severity</th>
                  <th className="py-1.5 pr-2">Title</th>
                  <th className="py-1.5 pr-2">Owner</th>
                  <th className="py-1.5 pr-2">Deadline</th>
                  <th className="py-1.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {findings.map((f) => (
                  <tr key={f.id} className="border-b border-line/70">
                    <td className="py-1.5 pr-2 font-mono text-xs">{f.id}</td>
                    <td className="py-1.5 pr-2">
                      <SeverityBadge severity={f.severity} />
                    </td>
                    <td className="py-1.5 pr-2">{f.title}</td>
                    <td className="py-1.5 pr-2 text-xs">{f.owner}</td>
                    <td className="py-1.5 pr-2 text-xs">{f.deadline}</td>
                    <td className="py-1.5 text-xs">{f.status.replace('_', ' ')}</td>
                  </tr>
                ))}
                {findings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-3 text-ink-2">
                      No issued findings.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
