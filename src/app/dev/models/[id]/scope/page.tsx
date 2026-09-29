'use client';
import { Check, CheckCheck, FileUp, Lock, LockOpen, Plus, Sparkles, Undo2, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AiDraftBadge, BindingBadge, Chip } from '@/components/common/badges';
import { FileDrop, readTextIfPossible } from '@/components/common/FileDrop';
import { ReasonDialog } from '@/components/common/ReasonDialog';
import { Banner, Card, CardHeader, PageHeader } from '@/components/common/ui-bits';
import { useModelCtx } from '@/components/dev/useModelCtx';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { COMPONENT_LABEL, type Component } from '@/lib/ai/generic';
import { extractFromUpload, PILOT_NOT_APPLICABLE } from '@/lib/ai/pilot';
import { generateText, simulateRun, simulateShort, useProvider } from '@/lib/ai/provider';
import { applicabilityReason, applicableDocs } from '@/lib/applicability';
import { fmtDateTime, nowISO } from '@/lib/clock';
import { can } from '@/lib/permissions';
import { uid } from '@/lib/rng';
import { DOCUMENTS, LIBRARY_BASE_VERSION, PERSONAS, PILOT } from '@/lib/seed';
import { cn } from '@/lib/utils';
import type { LibraryDocument, Requirement, Upload } from '@/lib/types';
import { applicabilityConfidence, proposalRequirements, setRequirements, use1lod, type ReqStatus } from '@/stores/store1lod';
import { useLibrary } from '@/stores/storeLibrary';

type ReqFilter = 'proposed' | 'accepted' | 'excluded' | 'not_applicable' | 'all';

const DEMO_UPLOADS = PILOT.upload_examples.filter((u) => u.kind === 'requirement_source').map((u) => u.name);

function ConfidenceBar({ value }: { value: number }) {
  const high = value >= 0.85;
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
      <TooltipContent>Applicability confidence — {high ? 'high (≥ 85%)' : 'below the high-confidence threshold'}. Based on tag match, document binding level and component.</TooltipContent>
    </Tooltip>
  );
}

export default function ScopePage() {
  const { id } = useParams<{ id: string }>();
  const { model, work, pilot } = useModelCtx(id);
  const s = use1lod();
  const library = useLibrary();
  const [filter, setFilter] = useState<ReqFilter>('all');
  const [excludeFor, setExcludeFor] = useState<string | null>(null);
  const [addDoc, setAddDoc] = useState<LibraryDocument | null>(null);
  const [lockOpen, setLockOpen] = useState(false);
  const [classify, setClassify] = useState<{ file: File; text?: string } | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [openedSample, setOpenedSample] = useState<Set<string>>(new Set());
  const [docTab, setDocTab] = useState('proposed');

  const reqs = useMemo(() => (work ? proposalRequirements(work) : []), [work]);
  const appDocs = useMemo(() => (model ? applicableDocs(model) : []), [model]);
  if (!model || !work) return null;
  const locked = !!work.lockedAt;
  const readOnly = locked || !can('1lod', 'write:store1lod');
  const comp = work.component;
  const conf = (rid: string) => applicabilityConfidence(id, rid, comp);
  const status = (rid: string): ReqStatus => work.reqStatus[rid] ?? 'proposed';
  const counts = {
    proposed: reqs.filter((r) => status(r.id) === 'proposed').length,
    accepted: reqs.filter((r) => status(r.id) === 'accepted').length,
    excluded: reqs.filter((r) => status(r.id) === 'excluded').length,
    not_applicable: pilot && comp === 'rds' ? PILOT_NOT_APPLICABLE.length : 0,
  };
  const visible = filter === 'all' || filter === 'not_applicable' ? reqs : reqs.filter((r) => status(r.id) === filter);
  const addedIds = new Set(work.addedDocuments.map((d) => d.docId));
  const docsInScope = new Set([...appDocs.map((d) => d.id), ...addedIds]);
  const inSetCount = setRequirements(work).length + (locked ? 0 : counts.proposed);
  const highProposed = reqs.filter((r) => status(r.id) === 'proposed' && conf(r.id) >= 0.85);
  const sample = highProposed.slice(0, 3).map((r) => r.id);
  const extracted = work.uploads.flatMap((u) => (u.extractedRequirements ?? []).map((r) => ({ r, upload: u })));

  async function regenerate() {
    await simulateRun({ title: 'Generating requirement set', total: reqs.length, label: 'Checking applicability' });
    s.regenerate(id);
    toast.success('Requirement set regenerated', { description: 'Existing human decisions were kept.' });
  }

  async function handleFiles(files: File[]) {
    const f = files[0];
    setClassify({ file: f, text: await readTextIfPossible(f) });
  }

  async function registerUpload(kind: Upload['kind'], file: { name: string; size: number; type?: string }, text?: string) {
    setClassify(null);
    const upload: Upload = { id: uid('UPL'), name: file.name, size: file.size, kind, uploadedAt: nowISO(), mime: file.type };
    if (kind === 'requirement_source') {
      await simulateShort(`Extracting requirements from ${file.name}`, ['Reading document…', 'Extracting text (simulated for PDF/DOCX)…', 'Identifying obligations and limitations…', 'Classifying scope…'], 1800);
      let extracted = extractFromUpload(file.name, id);
      if (text && useProvider.getState().live) {
        const res = await generateText('extract_requirements', text.slice(0, 15000), () => '');
        const lines = res.text.split('\n').map((l) => l.trim()).filter((l) => /^(Obligation|Limitation):/i.test(l));
        if (res.provider === 'live' && lines.length)
          extracted = lines.slice(0, 5).map((l, i) => ({ ...extracted[0], id: `MS-L${String(i + 1).padStart(2, '0')}`, text: l }));
      }
      upload.extractedRequirements = extracted;
      s.addUpload(id, upload);
      toast.success(`${upload.extractedRequirements.length} model-specific requirement(s) extracted`, { description: 'Review them in “Model-specific requirements (from uploads)”.' });
    } else {
      s.uploadEvidence(id, upload, text);
      toast.success('Evidence registered', { description: `${file.name} will be available to the self-assessment (re-run changed rows).` });
    }
  }

  return (
    <div className="pb-24">
      <PageHeader
        eyebrow={`Stage 1 · Scoping · ${model.id}`}
        title="Scoping"
        subtitle="Which requirements apply to this model and component, and which documents are in scope. The locked set is what both lines assess against."
        actions={
          !readOnly && (
            <Button variant="outline" onClick={regenerate}>
              <Sparkles aria-hidden /> Generate requirement set
            </Button>
          )
        }
      />
      {locked && (
        <Banner tone="success" icon={<Lock className="size-4" aria-hidden />} className="mb-4">
          Requirement set <strong>{work.reqSetId}</strong> v{work.setVersion} locked by {work.lockedBy} on {fmtDateTime(work.lockedAt)}. Scoping is read-only; the 2nd line will assess against exactly this set.
        </Banner>
      )}

      <div className="grid gap-4 2xl:grid-cols-[240px_minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left: model attributes */}
        <Card className="h-fit xl:col-span-2 2xl:col-span-1">
          <CardHeader title="Model attributes" />
          <div className="space-y-4 px-4 py-4 xl:grid xl:grid-cols-[1fr_240px_1fr] xl:gap-5 xl:space-y-0 2xl:block 2xl:space-y-4">
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {model.tags.map((t) => (
                  <Tooltip key={t}>
                    <TooltipTrigger asChild>
                      <span tabIndex={0} className="rounded-md border border-line bg-bg px-1.5 py-0.5 font-mono text-[11px] text-ink-2">
                        {t}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>from model inventory</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-2">Component</p>
              <Select value={comp} onValueChange={(v) => s.setComponent(id, v as Component)} disabled={readOnly}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(COMPONENT_LABEL) as Component[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {COMPONENT_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {pilot && comp !== 'rds' && <p className="mt-1.5 text-xs text-amber">The pilot scenario covers the RDS documentation; other components use generic generation.</p>}
            </div>
            <div className="text-xs text-ink-2">
              <p>
                <strong className="text-ink">Regulatory use:</strong> {model.regulatory_use}
              </p>
              <p className="mt-1">
                <strong className="text-ink">Methodology:</strong> {model.methodology}
              </p>
            </div>
          </div>
        </Card>

        {/* Middle: requirement set */}
        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  Proposed requirement set <AiDraftBadge />
                </span>
              }
              subtitle={`${work.reqSetId} · ${COMPONENT_LABEL[comp]} · library v${LIBRARY_BASE_VERSION} · generated ${fmtDateTime(work.generatedAt)}`}
              actions={
                !readOnly && (
                  <Button variant="outline" size="sm" disabled={highProposed.length === 0} onClick={() => setBulkOpen(true)}>
                    <CheckCheck aria-hidden /> Bulk accept high-confidence ({highProposed.length})
                  </Button>
                )
              }
            />
            <div className="flex flex-wrap gap-2 border-b border-line px-4 py-3">
              <Chip active={filter === 'all'} onClick={() => setFilter('all')} count={reqs.length}>
                All proposed by AI
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
            </div>
            {filter === 'not_applicable' ? (
              <ul className="divide-y divide-line">
                {(pilot && comp === 'rds' ? PILOT_NOT_APPLICABLE : []).map((r) => (
                  <li key={r.id} className="px-4 py-3 text-sm">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-xs font-semibold text-ink-2">{r.id}</span>
                      <span className="text-ink">{r.text}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-2">
                      {r.article} · {r.source_doc}
                    </p>
                    <p className="mt-1 rounded bg-bg px-2 py-1 text-xs text-ink-2">
                      <strong>Why not applicable:</strong> {r.why_not}
                    </p>
                  </li>
                ))}
                {!(pilot && comp === 'rds') && <li className="px-4 py-6 text-sm text-ink-2">Requirements from non-applicable documents are filtered out by the applicability rule (tags).</li>}
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
                  <tbody>
                    {visible.map((r) => {
                      const st = status(r.id);
                      return (
                        <tr key={r.id} className={cn('border-b border-line/70 align-top last:border-0', st === 'excluded' && 'bg-bg/60 text-ink-2')}>
                          <td className="px-4 py-2.5">
                            <span className="font-mono text-xs font-semibold text-green-800">{r.id}</span>
                            <p className={cn('mt-0.5', st === 'excluded' && 'line-through decoration-ink-3')}>{r.text}</p>
                            <p className="mt-0.5 text-xs text-ink-2">
                              {r.article} · <span className="font-mono text-[11px]">{r.source_doc}</span>
                            </p>
                            {st === 'excluded' && work.excludedReasons[r.id] && <p className="mt-0.5 text-xs text-ink-2">Excluded: {work.excludedReasons[r.id]}</p>}
                          </td>
                          <td className="w-[180px] px-2 py-2.5 text-xs text-ink-2">{r.applicability_rationale}</td>
                          <td className="px-2 py-2.5">
                            <ConfidenceBar value={conf(r.id)} />
                          </td>
                          <td className="w-[120px] px-4 py-2.5 text-right">
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
                </table>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Model-specific requirements (from uploads)"
              subtitle="Obligations extracted from requirement sources (supervisory decisions, previous validation reports, letters). Add them to this model or propose them to the library."
            />
            <div className="px-4 py-3">
              {extracted.length === 0 && work.modelSpecific.length === 0 ? (
                <p className="py-3 text-sm text-ink-2">No requirement sources uploaded yet. Use Documents → Upload and classify a file as “Requirement source”.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {extracted.map(({ r, upload }) => {
                    const added = work.modelSpecific.some((m) => m.id === r.id);
                    const proposed = work.proposedToLibrary.includes(r.id) || library.candidates.some((c) => c.requirement.id === r.id);
                    return (
                      <li key={r.id} className="flex flex-wrap items-start gap-3 py-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-[#5b3a86]">{r.id}</span>
                            <AiDraftBadge />
                          </div>
                          <p className="mt-0.5 text-sm text-ink">{r.text}</p>
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
                                  library.proposeCandidate({ requirement: r, fromModel: id, fromUpload: upload.name, proposedBy: PERSONAS['1lod'].name });
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
        </div>

        {/* Right: documents */}
        <Card className="h-fit min-w-0">
          <CardHeader title="Documents" subtitle={`${docsInScope.size} in scope · applicability rule on model tags`} />
          <Tabs value={docTab} onValueChange={setDocTab} className="px-3 py-3">
            <TabsList className="w-full">
              <TabsTrigger value="proposed">Proposed ({docsInScope.size})</TabsTrigger>
              <TabsTrigger value="add" disabled={readOnly}>
                Add from library
              </TabsTrigger>
              <TabsTrigger value="upload" disabled={readOnly}>
                Upload
              </TabsTrigger>
            </TabsList>
            <TabsContent value="proposed" className="mt-2 max-h-[640px] space-y-4 overflow-y-auto pr-1">
              {(['external', 'internal'] as const).map((cat) => {
                const list = [...appDocs, ...DOCUMENTS.filter((d) => addedIds.has(d.id) && !appDocs.includes(d))].filter((d) => d.category === cat);
                return (
                  <div key={cat}>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-2">
                      {cat === 'external' ? 'External' : 'Internal'} ({list.length})
                    </p>
                    <ul className="space-y-1.5">
                      {list.map((d) => {
                        const added = work.addedDocuments.find((a) => a.docId === d.id);
                        return (
                          <li key={d.id} className="rounded-lg border border-line px-2.5 py-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-[13px] leading-snug text-ink">{d.title}</p>
                              {added && <span className="shrink-0 rounded-full bg-yellow-100 px-1.5 text-[11px] font-medium text-yellow-ink">User added</span>}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <BindingBadge level={d.binding_level} />
                              <span className="text-[11px] text-ink-3">{d.reference}</span>
                            </div>
                            <p className="mt-1 text-[11px] text-ink-2">{added ? `Why relevant: ${added.reason}` : `Applies: ${applicabilityReason(model, d)}`}</p>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </TabsContent>
            <TabsContent value="add" className="mt-2">
              <Command className="rounded-lg border border-line">
                <CommandInput placeholder="Search 72 library documents…" />
                <CommandList className="max-h-[520px]">
                  <CommandEmpty>No document found.</CommandEmpty>
                  {(['external', 'internal'] as const).map((cat) => (
                    <CommandGroup key={cat} heading={cat === 'external' ? 'External' : 'Internal'}>
                      {DOCUMENTS.filter((d) => d.category === cat).map((d) => (
                        <CommandItem key={d.id} value={`${d.title} ${d.reference} ${d.id} ${d.key_topics.join(' ')}`} onSelect={() => setAddDoc(d)}>
                          <div className="min-w-0">
                            <p className="text-[13px] leading-snug">{d.title}</p>
                            <p className="text-[11px] text-ink-3">
                              {d.reference}
                              {addedIds.has(d.id) ? ' · user added' : appDocs.includes(d) ? ' · already proposed' : ''}
                            </p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </CommandList>
              </Command>
            </TabsContent>
            <TabsContent value="upload" className="mt-2 space-y-3">
              <FileDrop onFiles={handleFiles} hint="PDF / DOCX register metadata (text extraction simulated); TXT / MD are read in the browser." />
              <div className="text-xs text-ink-2">
                <p className="mb-1 font-medium">Demo files:</p>
                <div className="flex flex-col gap-1">
                  {DEMO_UPLOADS.map((n) => (
                    <button key={n} type="button" className="flex items-center gap-1.5 text-left text-green-800 hover:underline" onClick={() => setClassify({ file: new File([new Uint8Array(184_320)], n, { type: 'application/pdf' }) })}>
                      <FileUp className="size-3.5 shrink-0" aria-hidden /> {n}
                    </button>
                  ))}
                </div>
              </div>
              {work.uploads.length > 0 && (
                <ul className="space-y-1.5">
                  {work.uploads.map((u) => (
                    <li key={u.id} className="rounded-lg border border-line px-2.5 py-2 text-xs">
                      <p className="font-medium text-ink">{u.name}</p>
                      <p className="text-ink-2">
                        {u.kind === 'evidence' ? 'Evidence' : 'Requirement source'} · {(u.size / 1024).toFixed(1)} KB · {fmtDateTime(u.uploadedAt)}
                        {u.extractedRequirements ? ` · ${u.extractedRequirements.length} extracted` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Lock bar */}
      <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 shadow-[0_-4px_16px_rgba(0,59,59,0.06)] backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
          <Lock className={cn('size-4', locked ? 'text-green-600' : 'text-ink-3')} aria-hidden />
          <p className="text-sm text-ink">
            {locked ? 'Locked' : 'Lock'} requirement set <strong>{work.reqSetId}</strong>
            {work.setVersion > 1 && ` v${work.setVersion}`} · Library v{LIBRARY_BASE_VERSION} · <strong>{inSetCount}</strong> requirements
            {work.modelSpecific.length ? ` (incl. ${work.modelSpecific.length} model-specific)` : ''} · <strong>{docsInScope.size}</strong> documents
          </p>
          <div className="ml-auto flex gap-2">
            {locked ? (
              <Button
                variant="outline"
                disabled={!!work.submission}
                onClick={() => {
                  s.unlock(id);
                  toast('Requirement set unlocked', { description: `A new version (v${work.setVersion + 1}) is being prepared.` });
                }}
              >
                <LockOpen aria-hidden /> Unlock (creates new version)
              </Button>
            ) : (
              <Button className="bg-green-600" onClick={() => setLockOpen(true)} disabled={readOnly}>
                <Lock aria-hidden /> Lock set
              </Button>
            )}
          </div>
        </div>
      </div>

      <ReasonDialog
        open={!!excludeFor}
        onOpenChange={(o) => !o && setExcludeFor(null)}
        title={`Exclude ${excludeFor}`}
        description="Excluded requirements are visible to the 2nd line in the submission package, including your reason."
        placeholder="e.g. Covered in the MDD component, not in the RDS documentation"
        confirmLabel="Exclude"
        onConfirm={(r) => excludeFor && s.setReqStatus(id, [excludeFor], 'excluded', r)}
      />
      <ReasonDialog
        open={!!addDoc}
        onOpenChange={(o) => !o && setAddDoc(null)}
        title="Add document from library"
        description={addDoc ? `${addDoc.title} (${addDoc.reference})${appDocs.includes(addDoc) ? ' — already proposed by the applicability rule; adding it records your explicit relevance reason.' : ''}` : ''}
        label="Why relevant (one line)"
        placeholder="e.g. Validation expectations for the RDS reproducibility and representativeness tests"
        confirmLabel="Add document"
        onConfirm={(r) => {
          if (!addDoc) return;
          s.addDocument(id, addDoc.id, r);
          toast.success('Document added', { description: addDoc.title });
          setDocTab('proposed');
        }}
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
              <p className="mt-0.5 text-xs text-ink-2">ECB decision, previous validation report, supervisory letter, memo with obligations — requirements are extracted.</p>
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={lockOpen} onOpenChange={setLockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lock requirement set {work.reqSetId}?</DialogTitle>
            <DialogDescription>
              The 2nd line will assess against this exact set (library v{LIBRARY_BASE_VERSION}). After locking, scoping becomes read-only; changes require unlocking, which creates a new version.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-1 text-sm">
            <li>
              • <strong>{counts.accepted + counts.proposed}</strong> shared requirements {counts.proposed > 0 && <span className="text-amber">(incl. {counts.proposed} still proposed — accepted on lock)</span>}
            </li>
            <li>
              • <strong>{work.modelSpecific.length}</strong> model-specific requirement{work.modelSpecific.length === 1 ? '' : 's'}
            </li>
            <li>
              • <strong>{counts.excluded}</strong> excluded (with reason)
            </li>
            <li>
              • <strong>{docsInScope.size}</strong> documents in scope ({work.addedDocuments.length} user added)
            </li>
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLockOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                s.lock(id);
                setLockOpen(false);
                toast.success(`Requirement set ${work.reqSetId} locked`, { description: 'Scoping is now read-only.' });
              }}
            >
              <Lock aria-hidden /> {counts.proposed ? 'Accept remaining & lock' : 'Lock set'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk accept high-confidence requirements</DialogTitle>
            <DialogDescription>No auto-accept: open a random sample of {sample.length} first.</DialogDescription>
          </DialogHeader>
          <ul className="space-y-2">
            {sample.map((rid) => {
              const r = reqs.find((x) => x.id === rid) as Requirement;
              const open = openedSample.has(rid);
              return (
                <li key={rid} className="rounded-lg border border-line px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-green-800">{rid}</span>
                    {!open && (
                      <Button size="xs" variant="outline" onClick={() => setOpenedSample(new Set(openedSample).add(rid))}>
                        Open
                      </Button>
                    )}
                  </div>
                  {open && (
                    <div className="mt-1 text-xs text-ink-2">
                      <p className="text-sm text-ink">{r.text}</p>
                      <p className="mt-1">
                        {r.article} — {r.applicability_rationale}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <DialogFooter>
            <Button
              disabled={sample.some((x) => !openedSample.has(x))}
              onClick={() => {
                s.setReqStatus(id, highProposed.map((r) => r.id), 'accepted');
                setBulkOpen(false);
              }}
            >
              Accept {highProposed.length} requirements
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
