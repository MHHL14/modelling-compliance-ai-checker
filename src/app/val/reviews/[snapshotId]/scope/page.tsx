'use client';
import { useContent } from '@/components/common/useContent';
import { libraryReqs } from '@/lib/content';
import { tagMatch } from '@/lib/engine/sources';
import { Flag, Info, Lock, Plus, Settings2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ReasonDialog } from '@/components/common/ReasonDialog';
import { Banner, Card, CardHeader, Dl, PageHeader } from '@/components/common/ui-bits';
import { useReviewCtx } from '@/components/val/useReviewCtx';
import { Button } from '@/components/ui/button';
import { PILOT_NOT_APPLICABLE } from '@/lib/ai/pilot';
import { applicableDocs } from '@/lib/applicability';
import { DOCUMENTS, PILOT, PILOT_MODEL_ID } from '@/lib/seed';
import type { Requirement } from '@/lib/types';
import { use2lod } from '@/stores/store2lod';

function ReqTable({ reqs, extra }: { reqs: Requirement[]; extra?: (r: Requirement) => React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-line bg-bg/70 text-left text-xs font-medium uppercase tracking-wide text-ink-2">
            <th className="px-4 py-2">Requirement</th>
            <th className="px-2 py-2">Source</th>
            <th className="px-2 py-2">Check</th>
            {extra && <th className="px-4 py-2" />}
          </tr>
        </thead>
        <tbody>
          {reqs.map((r) => (
            <tr key={r.id} className="border-b border-line/70 align-top last:border-0">
              <td className="px-4 py-2.5">
                <span className="font-mono text-xs font-semibold text-lod2">{r.id}</span>
                {r.layer === 'model_specific' && <span className="ml-1.5 rounded bg-[#efe7f7] px-1 text-[10px] font-medium text-[#5b3a86]">model-specific</span>}
                <p className="mt-0.5">{r.text}</p>
              </td>
              <td className="px-2 py-2.5 text-xs text-ink-2">
                {r.article}
                <div className="font-mono text-[11px] text-ink-3">{r.source_doc}</div>
              </td>
              <td className="px-2 py-2.5 text-xs">{r.check_type === 'script' ? 'Script' : r.check_type === 'ai+script' ? 'AI + script' : 'AI'}</td>
              {extra && <td className="px-4 py-2.5 text-right">{extra(r)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ValScope() {
  const { snapshotId } = useParams<{ snapshotId: string }>();
  const { review, model, id } = useReviewCtx(snapshotId);
  const add = use2lod((s) => s.addValidationReq);
  const challenge = use2lod((s) => s.addScopingChallenge);
  const [challengeFor, setChallengeFor] = useState<Requirement | null>(null);

  const ready = useContent(model ? [model.id] : []);
  const valOptions: Requirement[] = useMemo(() => {
    if (!model || !ready) return [];
    const docIds = new Set(applicableDocs(model).filter((d) => d.type === 'validation_standard').map((d) => d.id));
    return libraryReqs()
      .filter((r) => docIds.has(r.docId) && tagMatch(model.tags, r.applies_if))
      .map((r) => ({ ...r, layer: '2lod' as const }));
  }, [model, ready]);

  if (!review || !model) return null;
  const shared = review.pkg.requirements ?? [];
  const inLayer = new Set(review.validationLayer.map((r) => r.id));
  const challenged = new Set(review.scopingChallenges.map((c) => c.requirementId));
  const excluded = review.pkg.requirementSet.excluded;
  const missed = review.modelId === PILOT_MODEL_ID ? PILOT_NOT_APPLICABLE : [];
  const d55 = PILOT.library_change.changes.find((c) => c.id === 'REQ-D55');

  return (
    <div>
      <PageHeader eyebrow={`Scope · ${id}`} title="Validation scope" subtitle="The shared set says what is assessed; the validation layer says how strictly. Both are recorded in the run." />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Lock className="size-4 text-ink-3" aria-hidden /> Shared requirement set — the what
                </span>
              }
              subtitle={`${review.pkg.requirementSet.id} from the snapshot · ${shared.length} requirements · library v${review.pkg.manifest.libraryVersion} · read-only`}
            />
            <ReqTable reqs={shared} />
          </Card>
          <Card>
            <CardHeader title="Validation layer — the how strict (owned by the 2nd line)" subtitle="From internal validation standards. Not visible to, and not configurable by, the 1st line." />
            <ReqTable reqs={review.validationLayer} />
            <div className="border-t border-line px-4 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-2">Add from validation standards in the library ({valOptions.length})</p>
              <ul className="max-h-[440px] space-y-1.5 overflow-y-auto pr-1">
                {valOptions.map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-3 rounded-lg border border-line px-3 py-2 text-sm">
                    <span>
                      <span className="font-mono text-xs font-semibold text-lod2">{r.id}</span> {r.text}
                      <span className="block text-xs text-ink-2">{DOCUMENTS.find((d) => d.id === r.source_doc)?.title} · {r.article}</span>
                    </span>
                    {inLayer.has(r.id) ? (
                      <span className="shrink-0 text-xs font-medium text-green-600">Added</span>
                    ) : (
                      <Button
                        size="xs"
                        variant="outline"
                        disabled={!!review.run}
                        onClick={() => {
                          add(id, r);
                          toast.success(`${r.id} added to the validation layer`);
                        }}
                      >
                        <Plus aria-hidden /> Add
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
              {review.run && <p className="mt-2 text-xs text-ink-2">The blind run has been executed; changes to the validation layer apply to the next run.</p>}
            </div>
          </Card>
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Flag className="size-4 text-amber" aria-hidden /> Scoping challenge
                </span>
              }
              subtitle="Library requirements that the 1st line excluded or that were marked not applicable. Challenging one creates a draft finding of type “scoping gap”."
            />
            <div className="space-y-3 px-4 py-3">
              {d55 && (
                <Banner tone="info" icon={<Info className="size-4" aria-hidden />}>
                  <strong>REQ-D55</strong> (“{d55.new}”) is not in scope: it is part of library v3.3, which was not published when this set was locked (v{review.pkg.manifest.libraryVersion}). Info only.
                </Banner>
              )}
              {[...excluded.map((e) => ({ r: shared.find((x) => x.id === e.id) ?? ({ id: e.id, text: e.id, article: '', source_doc: '', category: 'data', check_type: 'ai', applicability_rationale: '', layer: 'shared' } as Requirement), why: `Excluded by 1st line: ${e.reason}` })), ...missed.map((m) => ({ r: m as Requirement, why: `AI marked not applicable: ${m.why_not}` }))].map(({ r, why }) => (
                <div key={r.id} className="flex items-start justify-between gap-3 rounded-lg border border-line px-3 py-2 text-sm">
                  <div>
                    <span className="font-mono text-xs font-semibold">{r.id}</span> {r.text}
                    <p className="text-xs text-ink-2">{why}</p>
                  </div>
                  {challenged.has(r.id) ? (
                    <span className="shrink-0 text-xs font-medium text-amber">Challenged</span>
                  ) : (
                    <Button size="xs" variant="outline" onClick={() => setChallengeFor(r)}>
                      Add as scoping challenge
                    </Button>
                  )}
                </div>
              ))}
              {excluded.length === 0 && missed.length === 0 && <p className="text-sm text-ink-2">Nothing excluded by the 1st line.</p>}
            </div>
          </Card>
        </div>
        <Card className="h-fit">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Settings2 className="size-4" aria-hidden /> 2nd line AI configuration
              </span>
            }
            subtitle="Read-only in the prototype"
          />
          <div className="px-5 py-4">
            <Dl
              items={[
                ['Prompt set', 'VAL-PROMPTS 1.4'],
                ['Owner', 'Model Validation'],
                ['Confidence thresholds', 'High ≥ all good (verifiability may be weak) · Medium: 1 weak · Low: any bad'],
                ['Retrieval', 'top-k 6 per requirement, frozen package documents only'],
                ['Inputs excluded', '1st line conclusions, 1st line rationales, 1st line reasons'],
                ['Provider', 'Separate 2nd line run configuration'],
              ]}
            />
            <p className="mt-3 rounded-md bg-lod2/5 px-3 py-2 text-sm font-medium text-lod2">Independent of 1st line configuration.</p>
          </div>
        </Card>
      </div>
      <ReasonDialog
        open={!!challengeFor}
        onOpenChange={(o) => !o && setChallengeFor(null)}
        title={`Scoping challenge · ${challengeFor?.id}`}
        description="A draft finding (type: scoping gap) is created. It stays invisible to the 1st line until issued."
        label="Why should it be in scope?"
        placeholder="e.g. The model's RDS includes the 2012–2013 downturn; this requirement should be assessed."
        confirmLabel="Create draft finding"
        onConfirm={(note) => {
          if (!challengeFor) return;
          const fid = challenge(id, challengeFor, note);
          toast.success(`Draft finding ${fid} created (scoping gap)`);
        }}
      />
    </div>
  );
}
