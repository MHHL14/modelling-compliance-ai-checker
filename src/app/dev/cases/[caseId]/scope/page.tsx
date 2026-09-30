'use client';
import { ArrowLeft, ArrowRight, Check, CheckCheck, ChevronDown, FileUp, Lock, LockOpen, Plus, Sparkles, Undo2, X } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AiDraftBadge, BindingBadge, Chip, FamilyBadge } from '@/components/common/badges';
import { FileDrop, readTextIfPossible } from '@/components/common/FileDrop';
import { ReasonDialog } from '@/components/common/ReasonDialog';
import { Banner, Card, CardHeader, EmptyState, Kpi, PageHeader } from '@/components/common/ui-bits';
import { ScopeStepper } from '@/components/dev/ScopeStepper';
import { useCaseCtx } from '@/components/dev/useCaseCtx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { COMPONENT_LABEL } from '@/lib/ai/generic';
import { extractFromUpload } from '@/lib/ai/pilot';
import { generateText, simulateRun, simulateShort, useProvider } from '@/lib/ai/provider';
import { SourcePicker } from '@/components/common/SourcePicker';
import { useContent } from '@/components/common/useContent';
import type { LibReq } from '@/lib/content';
import { applicabilityConfidence, MANDATORY_SOURCES, whyApplicable } from '@/lib/engine/sources';
import { fmtDateTime, nowISO } from '@/lib/clock';
import { can } from '@/lib/permissions';
import { seeded, uid } from '@/lib/rng';
import { getDocument, PERSONAS, PILOT, PILOT_MODEL_ID } from '@/lib/seed';
import { cn } from '@/lib/utils';
import type { Requirement, Upload } from '@/lib/types';
import { notApplicableRequirements, proposalRequirements, setRequirements, use1lod, type ReqStatus } from '@/stores/store1lod';
import { useLibrary } from '@/stores/storeLibrary';

type ReqFilter = 'all' | 'proposed' | 'accepted' | 'excluded' | 'not_applicable';
const HIGH = 0.85;

function ConfidenceBar({ value }: { value: number }) {
  const high = value >= HIGH;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5" tabIndex={0}>
          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-bg">
            <div className={cn('h-full rounded-full', high ? 'bg-green-600' : value >= 0.72 ? 'bg-amber' : 'bg-red')} style={{ width: `${value * 100}%` }} />
          </div>
          <span className="text-xs tabular-nums text-ink-2">{Math.round(value * 100)}%</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>Applicability confidence — {high ? 'high (85% or more)' : 'below the high-confidence threshold'}. Based on characteristic match, binding level and component.</TooltipContent>
    </Tooltip>
  );
}

function sampleOf(ids: string[], n = 3) {
  const rnd = seeded([...ids].sort().join('|'));
  return [...ids].sort().sort(() => rnd() - 0.5).slice(0, Math.min(n, ids.length));
}

export default function ScopePage() {
  const { caseId } = useParams<{ caseId: string }>();
  const { id, uc, model, readOnly: completed } = useCaseCtx(caseId);
  const s = use1lod();
  const library = useLibrary();
  const [step, setStep] = useState(0);
  const [filter, setFilter] = useState<ReqFilter>('all');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [excludeFor, setExcludeFor] = useState<string | null>(null);
  const [lockOpen, setLockOpen] = useState(false);
  const [classify, setClassify] = useState<{ file: File; text?: string } | null>(null);
  const [bulk, setBulk] = useState<{ ids: string[]; label: string } | null>(null);
  const [opened, setOpened] = useState<Set<string>>(new Set());

  const ready = useContent(uc ? [uc.modelId] : []);
  const reqs = useMemo(() => (uc && ready ? proposalRequirements(uc) : []), [uc, ready]);
  const na = useMemo(() => (uc && ready ? notApplicableRequirements(uc) : []), [uc, ready]);
  if (!uc || !model) return null;
  if (!ready) return <p className="p-6 text-sm text-ink-2">Loading the requirement library…</p>;

  const locked = !!uc.lockedAt;
  const readOnly = locked || completed;
  const conf = (rid: string) => { const r = reqs.find((x) => x.id === rid); return r ? applicabilityConfidence(model.id, r) : 0.8; };
  const status = (rid: string): ReqStatus => uc.reqStatus[rid] ?? 'proposed';
  const counts = {
    proposed: reqs.filter((r) => status(r.id) === 'proposed').length,
    accepted: reqs.filter((r) => status(r.id) === 'accepted').length,
    excluded: reqs.filter((r) => status(r.id) === 'excluded').length,
    not_applicable: na.length,
  };
  const decided = reqs.length - counts.proposed;
  const allDecided = !!uc.generatedAt && counts.proposed === 0;
  const extracted = uc.uploads.flatMap((u) => (u.extractedRequirements ?? []).map((r) => ({ r, upload: u })));
  const demoSources =
    uc.modelId === PILOT_MODEL_ID ? PILOT.upload_examples.filter((u) => u.kind === 'requirement_source').map((u) => u.name) : [`Supervisory letter – ${model.id} (2027).pdf`];

  const visible = filter === 'all' || filter === 'not_applicable' ? reqs : reqs.filter((r) => status(r.id) === filter);
  const groups = new Map<string, Requirement[]>();
  for (const r of visible) groups.set(r.source_doc, [...(groups.get(r.source_doc) ?? []), r]);
  const highProposed = (list: Requirement[]) => list.filter((r) => status(r.id) === 'proposed' && conf(r.id) >= HIGH).map((r) => r.id);

  async function generate() {
    await simulateRun({ title: 'Deriving requirements from the selected sources', total: Math.max(8, uc!.sources.length), label: 'Reading source' });
    s.generate(id);
    toast.success('Requirements derived', { description: 'Every requirement is an AI proposal until you accept or exclude it.' });
  }

  function openBulk(ids: string[], label: string) {
    setOpened(new Set());
    setBulk({ ids, label });
  }

  async function registerUpload(kind: Upload['kind'], file: { name: string; size: number; type?: string }, text?: string) {
    setClassify(null);
    const upload: Upload = { id: uid('UPL'), name: file.name, size: file.size, kind, uploadedAt: nowISO(), mime: file.type };
    if (kind === 'requirement_source') {
      await simulateShort(`Extracting requirements from ${file.name}`, ['Reading document…', 'Extracting text (simulated for PDF and DOCX)…', 'Identifying obligations and limitations…', 'Classifying scope…'], 1800);
      let found = extractFromUpload(file.name, model!.id);
      if (text && useProvider.getState().live) {
        const res = await generateText('extract_requirements', text.slice(0, 15000), () => '');
        const lines = res.text.split('\n').map((l) => l.trim()).filter((l) => /^(Obligation|Limitation):/i.test(l));
        if (res.provider === 'live' && lines.length) found = lines.slice(0, 5).map((l, i) => ({ ...found[0], id: `MS-L${String(i + 1).padStart(2, '0')}`, text: l }));
      }
      upload.extractedRequirements = found;
      s.addUpload(id, upload);
      toast.success(`${found.length} model-specific requirement(s) extracted`, { description: 'Review them under “Model-specific requirements (from uploads)”.' });
    } else {
      s.uploadEvidence(id, upload, text, 'submission');
      toast.success('Evidence registered', { description: `${file.name} is available to the self-assessment.` });
    }
  }

  const sample = bulk ? sampleOf(bulk.ids) : [];

  return (
    <div>
      <PageHeader
        eyebrow={`Stage 1 · Scoping · ${model.id}`}
        title="Scoping"
        subtitle="Select the requirement sources, decide on each requirement the AI derives from them, and lock the set. The locked set is what both lines assess against."
      />

      <Card className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 text-sm">
        <span className="font-semibold text-ink">{model.name}</span>
        <FamilyBadge family={uc.attributes.model_family} />
        <span className="text-ink-2">
          {uc.cycle} · {COMPONENT_LABEL[uc.component]} · {uc.attributes.regulatory_use} · Tier {uc.attributes.tier}
        </span>
      </Card>

      <ScopeStepper step={step} onStep={setStep} done={[!!uc.generatedAt, allDecided, locked]} />

      {locked && (
        <Banner tone="success" icon={<Lock className="size-4" aria-hidden />} className="mb-4">
          Requirement set <strong>{uc.reqSetId}</strong> v{uc.setVersion} locked by {uc.lockedBy} on {fmtDateTime(uc.lockedAt)}. Scoping is read-only; the 2nd line will assess against exactly this set.
        </Banner>
      )}

      {/* Step 2 — Requirements */}
      {step === 1 &&
        (!uc.generatedAt ? (
          <EmptyState
            icon={<Sparkles className="size-5" aria-hidden />}
            title="No requirements derived yet"
            actions={
              !completed && (
                <Button onClick={generate}>
                  <Sparkles aria-hidden /> Derive requirements
                </Button>
              )
            }
          >
            The AI derives the requirements for {COMPONENT_LABEL[uc.component]} from the {uc.sources.length} sources you selected. You decide on each one.
          </EmptyState>
        ) : (
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  Requirement set <AiDraftBadge />
                </span>
              }
              subtitle={`${uc.reqSetId} · ${COMPONENT_LABEL[uc.component]} · library v${uc.libraryVersion} · ${uc.sources.length} sources · derived ${fmtDateTime(uc.generatedAt)}`}
              actions={
                !readOnly && (
                  <Button variant="outline" size="sm" disabled={highProposed(reqs).length === 0} onClick={() => openBulk(highProposed(reqs), 'all documents')}>
                    <CheckCheck aria-hidden /> Accept high-confidence ({highProposed(reqs).length})
                  </Button>
                )
              }
            />
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
              <Chip active={filter === 'all'} onClick={() => setFilter('all')} count={reqs.length}>
                All
              </Chip>
              <Chip active={filter === 'proposed'} onClick={() => setFilter('proposed')} count={counts.proposed}>
                Proposed
              </Chip>
              <Chip active={filter === 'accepted'} onClick={() => setFilter('accepted')} count={counts.accepted}>
                Accepted
              </Chip>
              <Chip active={filter === 'excluded'} onClick={() => setFilter('excluded')} count={counts.excluded}>
                Excluded
              </Chip>
              <Chip active={filter === 'not_applicable'} onClick={() => setFilter('not_applicable')} count={counts.not_applicable}>
                Not applicable
              </Chip>
              <div className="ml-auto flex min-w-[220px] items-center gap-2 text-xs text-ink-2">
                <span className="whitespace-nowrap">
                  {decided} of {reqs.length} decided
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg">
                  <div className="h-full rounded-full bg-green-600 transition-[width]" style={{ width: `${reqs.length ? (decided / reqs.length) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
            {filter === 'not_applicable' ? (
              <ul className="divide-y divide-line">
                {na.map((r) => (
                  <li key={r.id} className="px-4 py-3 text-sm">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-xs font-semibold text-ink-2">{r.id}</span>
                      <span className="text-ink">{r.text}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-2">
                      {r.article} · {getDocument(r.source_doc)?.title ?? r.source_doc}
                    </p>
                    <p className="mt-1 rounded bg-bg px-2 py-1 text-xs text-ink-2">
                      <strong>Why not applicable:</strong> {r.why_not}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[660px] text-sm">
                  <thead>
                    <tr className="border-b border-line bg-bg/70 text-left text-xs font-medium uppercase tracking-wide text-ink-2">
                      <th className="px-4 py-2">Requirement · source</th>
                      <th className="px-2 py-2">Why applicable</th>
                      <th className="px-2 py-2">Confidence</th>
                      <th className="px-4 py-2 text-right">Decision</th>
                    </tr>
                  </thead>
                  {[...groups.entries()].map(([docId, list]) => {
                    const doc = getDocument(docId);
                    const isCollapsed = collapsed.has(docId);
                    const hp = highProposed(list);
                    const open = list.filter((r) => status(r.id) === 'proposed').length;
                    return (
                      <tbody key={docId}>
                        <tr className="border-b border-line bg-bg/80">
                          <td colSpan={4} className="px-4 py-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                aria-expanded={!isCollapsed}
                                onClick={() => setCollapsed((c) => { const n = new Set(c); if (n.has(docId)) n.delete(docId); else n.add(docId); return n; })}
                                className="flex items-center gap-1.5 text-left text-sm font-semibold text-ink"
                              >
                                <ChevronDown className={cn('size-4 text-ink-3 transition-transform', isCollapsed && '-rotate-90')} aria-hidden />
                                {doc?.title ?? docId}
                              </button>
                              {doc && <BindingBadge level={doc.binding_level} />}
                              <span className="text-xs text-ink-2">
                                {list.length} requirement{list.length === 1 ? '' : 's'}
                                {open ? ` · ${open} to decide` : ''}
                              </span>
                              {!readOnly && hp.length > 0 && (
                                <Button size="xs" variant="outline" className="ml-auto" onClick={() => openBulk(hp, doc?.title ?? docId)}>
                                  <CheckCheck aria-hidden /> Accept high-confidence ({hp.length})
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {!isCollapsed &&
                          list.map((r) => {
                            const st = status(r.id);
                            return (
                              <tr key={r.id} className={cn('border-b border-line/70 align-top', st === 'excluded' && 'bg-bg/60 text-ink-2')}>
                                <td className="px-4 py-2.5">
                                  <span className="font-mono text-xs font-semibold text-green-800">{r.id}</span>
                                  <p className={cn('mt-0.5', st === 'excluded' && 'line-through decoration-ink-3')}>{r.text}</p>
                                  <p className="mt-0.5 text-xs text-ink-2">{r.article}</p>
                                  {st === 'excluded' && uc.excludedReasons[r.id] && <p className="mt-0.5 text-xs text-ink-2">Excluded: {uc.excludedReasons[r.id]}</p>}
                                </td>
                                <td className="w-[200px] px-2 py-2.5 text-xs text-ink-2">{r.applicability_rationale || ('docId' in r ? whyApplicable(r as LibReq, model) : '')}</td>
                                <td className="px-2 py-2.5">
                                  <ConfidenceBar value={conf(r.id)} />
                                </td>
                                <td className="w-[130px] px-4 py-2.5 text-right">
                                  {st === 'proposed' && !readOnly ? (
                                    <div className="flex flex-col items-end gap-1.5">
                                      <Button size="xs" onClick={() => s.setReqStatus(id, [r.id], 'accepted')}>
                                        <Check aria-hidden /> Accept
                                      </Button>
                                      <Button size="xs" variant="outline" onClick={() => setExcludeFor(r.id)}>
                                        <X aria-hidden /> Exclude
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-end gap-1.5">
                                      <span
                                        className={cn(
                                          'rounded-full px-2 py-0.5 text-xs font-medium',
                                          st === 'accepted' ? 'bg-green-100 text-green-800' : st === 'excluded' ? 'bg-[#e8ebeb] text-ink-2' : 'bg-blue-100 text-blue',
                                        )}
                                      >
                                        {st === 'accepted' ? 'Accepted' : st === 'excluded' ? 'Excluded' : 'Proposed'}
                                      </span>
                                      {!readOnly && st !== 'proposed' && (
                                        <Button size="icon-xs" variant="ghost" aria-label="Undo decision" onClick={() => s.setReqStatus(id, [r.id], 'proposed')}>
                                          <Undo2 aria-hidden />
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    );
                  })}
                </table>
                {visible.length === 0 && <p className="px-4 py-8 text-center text-sm text-ink-2">No requirements match this filter.</p>}
              </div>
            )}
            <div className="flex justify-end border-t border-line px-4 py-3">
              <Button onClick={() => setStep(2)}>
                Next: review and lock <ArrowRight aria-hidden />
              </Button>
            </div>
          </Card>
        ))}

      {/* Step 1 — Sources */}
      {step === 0 && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Requirement sources"
              subtitle={`${uc.sources.length} selected. The AI derives the requirements from exactly these sources.${uc.generatedAt && !locked ? ' Changing the selection updates the requirement set; decisions already taken are kept.' : ''}`}
            />
            <div className="px-4 py-4">
              <SourcePicker
                selected={uc.sources}
                readOnly={readOnly}
                onToggle={(docId, on) => (on ? s.addSource(id, docId, 'Selected by the model developer') : s.removeSource(id, docId))}
              />
            </div>
          </Card>
          <Card>
            <CardHeader title="Additional requirement sources (uploads)" subtitle="Supervisory decisions, previous validation reports, letters or memos with obligations. The AI extracts model-specific requirements from them." />
            <div className="grid gap-4 px-4 py-4 lg:grid-cols-2">
              <div className="space-y-3">
                {!readOnly && <FileDrop onFiles={async (files) => setClassify({ file: files[0], text: await readTextIfPossible(files[0]) })} hint="PDF and DOCX: metadata registered, text extraction simulated. TXT and MD are read in the browser." />}
                {!readOnly && (
                  <div className="text-xs text-ink-2">
                    <p className="mb-1 font-medium">Demo files:</p>
                    <div className="flex flex-col gap-1">
                      {demoSources.map((n) => (
                        <button key={n} type="button" className="flex items-center gap-1.5 text-left text-green-800 hover:underline" onClick={() => setClassify({ file: new File([new Uint8Array(184_320)], n, { type: 'application/pdf' }) })}>
                          <FileUp className="size-3.5 shrink-0" aria-hidden /> {n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <ul className="space-y-1.5">
                {uc.uploads.map((u) => (
                  <li key={u.id} className="rounded-lg border border-line px-2.5 py-2 text-xs">
                    <p className="font-medium text-ink">{u.name}</p>
                    <p className="text-ink-2">
                      {u.kind === 'evidence' ? 'Evidence' : 'Requirement source'} · {(u.size / 1024).toFixed(1)} KB · {fmtDateTime(u.uploadedAt)}
                      {u.extractedRequirements ? ` · ${u.extractedRequirements.length} extracted` : ''}
                    </p>
                  </li>
                ))}
                {uc.uploads.length === 0 && <li className="text-sm text-ink-2">No uploads yet.</li>}
              </ul>
            </div>
          </Card>
          <Card>
            <CardHeader
              title="Model-specific requirements (from uploads)"
              subtitle="Obligations extracted from requirement sources (supervisory decisions, previous validation reports, letters). Add them to this model or propose them to the library."
            />
            <div className="px-4 py-3">
              {extracted.length === 0 ? (
                <p className="py-3 text-sm text-ink-2">No requirement sources uploaded yet. Use Upload and classify a file as “Requirement source”.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {extracted.map(({ r, upload }) => {
                    const added = uc.modelSpecific.some((m) => m.id === r.id);
                    const proposed = uc.proposedToLibrary.includes(r.id) || library.candidates.some((c) => c.requirement.id === r.id);
                    return (
                      <li key={r.id} className="flex flex-wrap items-start gap-3 py-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-[#5b3a86]">{r.id}</span>
                            <AiDraftBadge />
                          </div>
                          <p className="mt-1 text-sm text-ink">{r.text}</p>
                          <p className="mt-0.5 text-xs text-ink-2">Extracted from “{upload.name}”</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {added ? (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Added to this model</span>
                          ) : (
                            !readOnly &&
                            !proposed && (
                              <Button size="xs" onClick={() => s.addModelSpecific(id, r)}>
                                <Plus aria-hidden /> Add to this model
                              </Button>
                            )
                          )}
                          {proposed ? (
                            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-ink">Proposed to library</span>
                          ) : (
                            !readOnly &&
                            !added &&
                            can('1lod', 'propose:library') && (
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => {
                                  library.proposeCandidate({ requirement: r, fromModel: model.id, fromUpload: upload.name, proposedBy: PERSONAS['1lod'].name });
                                  s.markProposed(id, r.id);
                                  toast.success(`${r.id} proposed to the library`, { description: 'The library owner reviews it under Candidates.' });
                                }}
                              >
                                Propose to library
                              </Button>
                            )
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>
          <div className="flex justify-between">
            <span />
            <Button onClick={() => setStep(1)}>
              Next: requirements <ArrowRight aria-hidden />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 — Review and lock */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label="Accepted" value={counts.accepted} tone="good" />
            <Kpi label="Excluded" value={counts.excluded} hint="With reason" />
            <Kpi label="Model-specific" value={uc.modelSpecific.length} />
            <Kpi label="Requirement sources" value={uc.sources.length} hint={`${MANDATORY_SOURCES.length} mandatory`} />
          </div>
          {!uc.generatedAt ? (
            <Banner tone="warn">Derive and review the requirements first.</Banner>
          ) : (
            counts.proposed > 0 && (
              <Banner tone="warn">
                <span className="flex flex-wrap items-center gap-2">
                  {counts.proposed} requirement{counts.proposed === 1 ? '' : 's'} still need a decision.
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      setFilter('proposed');
                      setStep(0);
                    }}
                  >
                    Review proposed requirements
                  </Button>
                </span>
              </Banner>
            )
          )}
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader title="Excluded requirements" subtitle="Visible to the 2nd line in the submission package, with your reason" />
              <ul className="divide-y divide-line">
                {reqs.filter((r) => status(r.id) === 'excluded').map((r) => (
                  <li key={r.id} className="px-4 py-2.5 text-sm">
                    <span className="font-mono text-xs font-semibold">{r.id}</span> {r.text}
                    <p className="text-xs text-ink-2">Reason: {uc.excludedReasons[r.id]}</p>
                  </li>
                ))}
                {counts.excluded === 0 && <li className="px-4 py-4 text-sm text-ink-2">No requirements excluded.</li>}
              </ul>
            </Card>
            <Card>
              <CardHeader title="Requirement sources and model-specific requirements" />
              <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
                {uc.sources.map((d) => (
                  <li key={d} className="px-4 py-2 text-sm">
                    {getDocument(d)?.title ?? d}
                    <p className="text-xs text-ink-2">
                      {getDocument(d)?.reference}
                      {MANDATORY_SOURCES.includes(d) ? ' · mandatory internal base' : ''}
                      {reqs.filter((r) => r.docId === d).length ? ` · ${reqs.filter((r) => r.docId === d).length} requirements` : ''}
                    </p>
                  </li>
                ))}
                {uc.modelSpecific.map((r) => (
                  <li key={r.id} className="px-4 py-2.5 text-sm">
                    <span className="font-mono text-xs font-semibold text-[#5b3a86]">{r.id}</span> {r.text}
                  </li>
                ))}
                
              </ul>
            </Card>
          </div>
          <Card className="flex flex-wrap items-center gap-3 px-5 py-4">
            <Lock className={cn('size-4', locked ? 'text-green-600' : 'text-ink-3')} aria-hidden />
            <p className="text-sm text-ink">
              {locked ? 'Locked' : 'Lock'} requirement set <strong>{uc.reqSetId}</strong>
              {uc.setVersion > 1 && ` v${uc.setVersion}`} · library v{uc.libraryVersion} · <strong>{setRequirements(uc).length}</strong> requirements from <strong>{uc.sources.length}</strong> sources
            </p>
            <div className="ml-auto flex gap-2">
              {locked ? (
                <>
                  {!completed && (
                    <Button
                      variant="outline"
                      disabled={!!uc.submission}
                      onClick={() => {
                        s.unlock(id);
                        toast('Requirement set unlocked', { description: 'A new version is being prepared; the assessment run is cleared.' });
                      }}
                    >
                      <LockOpen aria-hidden /> Unlock (creates new version)
                    </Button>
                  )}
                  <Button asChild>
                    <Link href={`/dev/cases/${encodeURIComponent(id)}/draft`}>
                      Continue to draft check <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                </>
              ) : (
                <Button onClick={() => setLockOpen(true)} disabled={!allDecided || completed}>
                  <Lock aria-hidden /> Lock set
                </Button>
              )}
            </div>
          </Card>
          <div className="flex justify-start">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft aria-hidden /> Back: requirements
            </Button>
          </div>
        </div>
      )}

      <ReasonDialog
        open={!!excludeFor}
        onOpenChange={(o) => !o && setExcludeFor(null)}
        title={`Exclude ${excludeFor}`}
        description="Excluded requirements are visible to the 2nd line in the submission package, including your reason."
        placeholder="Covered in the MDD component, not in this document"
        confirmLabel="Exclude"
        onConfirm={(r) => excludeFor && s.setReqStatus(id, [excludeFor], 'excluded', r)}
      />
      <Dialog open={!!classify} onOpenChange={(o) => !o && setClassify(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Classify upload</DialogTitle>
            <DialogDescription>
              {classify?.file.name} · {classify ? `${(classify.file.size / 1024).toFixed(1)} KB` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" className="rounded-lg border border-line p-3 text-left hover:border-green-600 hover:bg-green-50" onClick={() => classify && registerUpload('evidence', classify.file, classify.text)}>
              <p className="font-semibold">Evidence</p>
              <p className="mt-0.5 text-xs text-ink-2">MDD, test report, memo — used to assess requirements.</p>
            </button>
            <button type="button" className="rounded-lg border border-line p-3 text-left hover:border-green-600 hover:bg-green-50" onClick={() => classify && registerUpload('requirement_source', classify.file, classify.text)}>
              <p className="font-semibold">Requirement source</p>
              <p className="mt-0.5 text-xs text-ink-2">Supervisory decision, previous validation report, letter or memo with obligations — requirements are extracted.</p>
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={lockOpen} onOpenChange={setLockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lock requirement set {uc.reqSetId}?</DialogTitle>
            <DialogDescription>
              The 2nd line will assess against this exact set (library v{uc.libraryVersion}). After locking, scoping becomes read-only; changes require unlocking, which creates a new version.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-1 text-sm">
            <li>
              • <strong>{counts.accepted}</strong> accepted requirements
            </li>
            <li>
              • <strong>{uc.modelSpecific.length}</strong> model-specific requirement{uc.modelSpecific.length === 1 ? '' : 's'}
            </li>
            <li>
              • <strong>{counts.excluded}</strong> excluded, with reason
            </li>
            <li>
              • <strong>{uc.sources.length}</strong> requirement sources
            </li>
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLockOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (s.lock(id)) toast.success(`Requirement set ${uc.reqSetId} locked`, { description: 'Scoping is now read-only.' });
                setLockOpen(false);
              }}
            >
              <Lock aria-hidden /> Lock set
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!bulk} onOpenChange={(o) => !o && setBulk(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept high-confidence requirements</DialogTitle>
            <DialogDescription>
              {bulk?.ids.length} requirements from {bulk?.label}. No auto-accept: open this random sample of {sample.length} first.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2">
            {sample.map((rid) => {
              const r = reqs.find((x) => x.id === rid)!;
              const isOpen = opened.has(rid);
              return (
                <li key={rid} className="rounded-lg border border-line px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-green-800">{rid}</span>
                    {isOpen ? (
                      <span className="text-xs font-medium text-green-600">Opened ✓</span>
                    ) : (
                      <Button size="xs" variant="outline" onClick={() => setOpened(new Set(opened).add(rid))}>
                        Open
                      </Button>
                    )}
                  </div>
                  {isOpen && (
                    <div className="mt-1 text-xs text-ink-2">
                      <p className="text-sm text-ink">{r.text}</p>
                      <p className="mt-1">
                        {r.article} — {r.applicability_rationale || ('docId' in r ? whyApplicable(r as LibReq, model) : '')}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulk(null)}>
              Cancel
            </Button>
            <Button
              disabled={sample.some((x) => !opened.has(x))}
              onClick={() => {
                if (!bulk) return;
                s.setReqStatus(id, bulk.ids, 'accepted');
                toast.success(`${bulk.ids.length} requirements accepted`, { description: `After opening a sample of ${sample.length}.` });
                setBulk(null);
              }}
            >
              {sample.some((x) => !opened.has(x)) ? `Open sample first (${sample.filter((x) => opened.has(x)).length}/${sample.length})` : `Accept ${bulk?.ids.length} requirements`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
