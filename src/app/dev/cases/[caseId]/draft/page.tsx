'use client';
import { Bot, ClipboardCopy, FlaskConical, Play, Sparkles, Trash2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AiDraftBadge, MitigationBadge, ScriptBadge } from '@/components/common/badges';
import { ConfidenceWhy } from '@/components/common/ConfidenceWhy';
import { DocumentationPicker } from '@/components/common/DocumentationPicker';
import { DocumentPane, type Highlight } from '@/components/common/DocumentPane';
import { readTextIfPossible } from '@/components/common/FileDrop';
import { Banner, Card, CardHeader, EmptyState, PageHeader } from '@/components/common/ui-bits';
import { useCaseCtx } from '@/components/dev/useCaseCtx';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { generateText, simulateRun } from '@/lib/ai/provider';
import { fmtDateTime, nowISO } from '@/lib/clock';
import { sectionText } from '@/lib/engine/assess';
import type { DraftResult, DraftStatus, GeneratedSection } from '@/lib/engine/types';
import { uid } from '@/lib/rng';
import { cn } from '@/lib/utils';
import { allCaseRequirements, caseCtx, selKey, use1lod } from '@/stores/store1lod';

const STATUS: Record<DraftStatus, { label: string; cls: string; bar: string }> = {
  gap: { label: 'Gap', cls: 'bg-red-100 text-red', bar: 'bg-red' },
  partial: { label: 'Partial', cls: 'bg-amber-100 text-amber', bar: 'bg-amber' },
  not_in_draft: { label: 'Not in the selection', cls: 'bg-[#e8ebeb] text-ink-2', bar: 'bg-[#9aa7a7]' },
  addressed: { label: 'Addressed', cls: 'bg-green-100 text-green-800', bar: 'bg-green-600' },
};

export default function DraftPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const { id, uc, model, readOnly: completed, ready } = useCaseCtx(caseId);
  const s = use1lod();
  const [active, setActive] = useState<string | null>(null);
  const [tab, setTab] = useState<string | null>(null);
  const [gen, setGen] = useState<{ reqId: string; loading: boolean; result?: GeneratedSection; provider?: string } | null>(null);
  const [showAddressed, setShowAddressed] = useState(false);
  const [showNotIn, setShowNotIn] = useState(false);

  const ctx = useMemo(() => (uc && ready ? caseCtx(uc, 'draft') : null), [uc, ready]);
  const results = useMemo(() => uc?.draftCheck?.results ?? [], [uc?.draftCheck]);
  const docTab = ctx?.docs.find((d) => `${d.id}@${d.version}` === tab) ?? ctx?.docs[0];
  const highlights: Highlight[] = useMemo(() => {
    if (!docTab) return [];
    const hs: Highlight[] = [];
    for (const r of results) {
      for (const c of r.citations) if (c.doc === docTab.id) hs.push({ section: c.section, quote: c.quote, kind: 'cite', active: active === r.requirementId });
      if (r.gapLocation && r.status === 'gap' && (r.gapLocation.doc ?? docTab.id) === docTab.id) hs.push({ section: r.gapLocation.section, quote: r.gapLocation.quote, kind: 'gap', active: active === r.requirementId });
    }
    return hs;
  }, [results, active, docTab]);

  if (!uc || !model) return null;
  if (!ready || !ctx) return <p className="p-6 text-sm text-ink-2">Loading the documentation library…</p>;

  const reqById = new Map(allCaseRequirements(uc).map((r) => [r.id, r]));
  const count = (st: DraftStatus) => results.filter((r) => r.status === st).length;
  const order: DraftStatus[] = ['addressed', 'partial', 'gap', 'not_in_draft'];
  const gaps = results.filter((r) => r.status === 'gap');
  const partials = results.filter((r) => r.status === 'partial');
  const notIn = results.filter((r) => r.status === 'not_in_draft');
  const aiAddressed = results.filter((r) => r.status === 'addressed' && r.aiDrafted);
  const addressed = results.filter((r) => r.status === 'addressed' && !r.aiDrafted);

  async function run() {
    if (!ctx?.docs.length) {
      toast.error('Select or upload at least one document first.');
      return;
    }
    await simulateRun({ title: `Draft check · ${ctx.docs.length} document(s)`, total: reqById.size, scripts: 1 });
    s.runDraftCheck(id);
    toast.success('Draft check complete', { description: 'Interim assessment — no status, no sign-off.' });
  }

  async function generate(r: DraftResult) {
    setGen({ reqId: r.requirementId, loading: true });
    const sim = sectionText(ctx!, r.requirementId, r.mitigation?.text);
    const req = reqById.get(r.requirementId);
    const prompt = `Requirement ${req?.id}: ${req?.text} (${req?.article}).\nGap: ${r.rationale}\nFacts available from the model's working papers: ${sim.text.replace(/\{\{|\}\}/g, '')}\nWrite the paragraph to insert in §${sim.section}.`;
    const res = await generateText('generate_section', prompt, () => sim.text);
    setGen({ reqId: r.requirementId, loading: false, result: { ...sim, text: res.text }, provider: res.provider });
  }

  function ResultCard({ r }: { r: DraftResult }) {
    const req = reqById.get(r.requirementId);
    const st = STATUS[r.status];
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          setActive(r.requirementId);
          const docId = r.citations[0]?.doc ?? r.gapLocation?.doc;
          const d = ctx!.docs.find((x) => x.id === docId);
          if (d) setTab(`${d.id}@${d.version}`);
        }}
        onKeyDown={(e) => e.key === 'Enter' && setActive(r.requirementId)}
        className={cn('cursor-pointer rounded-lg border bg-white p-3 transition-colors', active === r.requirementId ? 'border-green-600 ring-2 ring-green-100' : 'border-line hover:border-green-500')}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', st.cls)}>{st.label}</span>
          <span className="font-mono text-xs font-semibold text-green-800">{r.requirementId}</span>
          {r.checkType !== 'ai' && <ScriptBadge result={r.script?.result ?? 'not_run'} id={r.script?.id} />}
          <AiDraftBadge />
        </div>
        <p className="mt-1.5 text-sm text-ink">{req?.text}</p>
        <p className="text-xs text-ink-3">{req?.article}</p>
        {r.citations.length ? (
          r.citations.map((c, i) => (
            <p key={i} className="doc-serif mt-1.5 border-l-4 border-yellow bg-yellow-100/60 px-2 py-1 text-[13px]">
              “{c.quote}” <span className="font-sans text-xs text-ink-2">{c.doc} §{c.section}</span>
            </p>
          ))
        ) : (
          <p className="mt-1.5 rounded bg-bg px-2 py-1 text-xs text-ink-2">{r.rationale}</p>
        )}
        {r.aiDrafted && (
          <p className="mt-1.5 flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-xs text-blue">
            <Bot className="size-3" aria-hidden /> AI-drafted text — confirm before relying on this outcome.
          </p>
        )}
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          <ConfidenceWhy confidence={r.confidence} factors={r.confidenceFactors} />
        </div>
        {r.mitigation && (
          <div className="mt-2 space-y-1">
            <MitigationBadge type={r.mitigation.type} />
            <p className="text-xs text-ink-2">{r.mitigation.text}</p>
          </div>
        )}
        {!completed && r.status === 'gap' && (
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={(e) => {
              e.stopPropagation();
              generate(r);
            }}
          >
            <Sparkles aria-hidden /> Generate section text
          </Button>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={`Stage 2 · Draft check · ${model.id}`}
        title="Draft check"
        subtitle="Select the draft documentation you want to check and run an interim assessment against the requirement set."
        actions={
          !completed && (
            <Button onClick={run} disabled={!uc.generatedAt || !ctx.docs.length}>
              <Play aria-hidden /> {uc.draftCheck ? 'Re-run check' : 'Run check'}
            </Button>
          )
        }
      />
      <Banner tone="sandbox" icon={<FlaskConical className="size-4" aria-hidden />} className="mb-4">
        <strong>Interim assessment — no status, no sign-off. Run as often as you like.</strong> No self-grading: text inserted with “Generate section text” stays marked as AI-drafted.
      </Banner>
      {!uc.generatedAt && <Banner tone="warn" className="mb-4">Derive the requirements in Scoping first.</Banner>}

      <Card className="mb-4">
        <CardHeader title="Documentation to check" subtitle="Select documents and versions from the model documentation library, or upload them." />
        <div className="px-4 py-4">
          <DocumentationPicker
            modelId={uc.modelId}
            kind="draft"
            readOnly={completed}
            selection={uc.draftSelection}
            onChange={(sel) => s.setDraftSelection(id, sel)}
            uploads={uc.evidenceDocs.map((d) => ({ name: d.uploadName, note: 'uploaded — text extracted (simulated)' }))}
            onUpload={async (files) => {
              for (const f of files) {
                const text = await readTextIfPossible(f);
                s.uploadEvidence(id, { id: uid('UPL'), name: f.name, size: f.size, kind: 'evidence', uploadedAt: nowISO(), mime: f.type }, text, 'draft');
              }
              toast.success('Upload registered', { description: 'Recognised library documents are added to the selection.' });
            }}
          />
        </div>
      </Card>

      {!uc.draftCheck ? (
        <EmptyState
          icon={<Play className="size-5" aria-hidden />}
          title="No check run yet"
          actions={
            !completed &&
            uc.generatedAt && (
              <Button onClick={run} disabled={!ctx.docs.length}>
                <Play aria-hidden /> Run check
              </Button>
            )
          }
        >
          {ctx.docs.length ? `${ctx.docs.length} document(s) selected. Run the check to see which requirements the draft already addresses.` : 'Select or upload at least one document.'}
        </EmptyState>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_440px]">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-1 border-b border-line px-3 py-2" role="tablist" aria-label="Selected documents">
              {ctx.docs.map((d) => {
                const k = `${d.id}@${d.version}`;
                const on = (docTab && `${docTab.id}@${docTab.version}`) === k;
                return (
                  <button key={k} type="button" role="tab" aria-selected={on} onClick={() => setTab(k)} className={cn('rounded-md px-2.5 py-1 text-xs', on ? 'bg-green-600 text-white' : 'text-ink-2 hover:bg-bg')}>
                    {d.title} · v{d.version}
                  </button>
                );
              })}
              <span className="ml-auto flex items-center gap-2 text-xs text-ink-2">
                <mark className="cite">cited evidence</mark>
                <mark className="gap">gap location</mark>
                <span className="ai-block rounded-r px-1.5">AI-drafted</span>
              </span>
            </div>
            {docTab && (
              <DocumentPane
                doc={{ ...docTab, aiBlocks: uc.aiBlocks[selKey({ modelId: uc.modelId, docId: docTab.id, version: docTab.version })] }}
                highlights={highlights}
                scrollKey={active ?? ''}
                className="h-[calc(100vh-260px)] min-h-[480px]"
              />
            )}
          </Card>
          <div className="min-w-0 space-y-3 xl:max-h-[calc(100vh-200px)] xl:overflow-y-auto xl:pr-1">
            <Card className="p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold">Results</span>
                <span className="text-xs text-ink-2">Last run {fmtDateTime(uc.draftCheck.at)}</span>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full bg-bg" role="img" aria-label={order.map((o) => `${STATUS[o].label} ${count(o)}`).join(', ')}>
                {order.map((o) => (
                  <div key={o} className={STATUS[o].bar} style={{ width: `${results.length ? (count(o) / results.length) * 100 : 0}%` }} />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {order.map((o) => (
                  <span key={o} className="flex items-center gap-1.5">
                    <span className={cn('size-2 rounded-full', STATUS[o].bar)} aria-hidden />
                    {STATUS[o].label} <strong className="tabular-nums">{count(o)}</strong>
                  </span>
                ))}
              </div>
            </Card>
            {gaps.map((r) => (
              <ResultCard key={r.requirementId} r={r} />
            ))}
            {partials.map((r) => (
              <ResultCard key={r.requirementId} r={r} />
            ))}
            {aiAddressed.length > 0 && <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-blue">Addressed by AI-drafted text — confirm</p>}
            {aiAddressed.map((r) => (
              <ResultCard key={r.requirementId} r={r} />
            ))}
            <button type="button" className="w-full rounded-lg border border-dashed border-line bg-white py-2 text-sm text-green-800 hover:bg-green-50" onClick={() => setShowNotIn(!showNotIn)}>
              {showNotIn ? 'Hide' : 'Show'} requirements not addressed in the selected documents ({notIn.length})
            </button>
            {showNotIn && notIn.map((r) => <ResultCard key={r.requirementId} r={r} />)}
            <button type="button" className="w-full rounded-lg border border-dashed border-line bg-white py-2 text-sm text-green-800 hover:bg-green-50" onClick={() => setShowAddressed(!showAddressed)}>
              {showAddressed ? 'Hide' : 'Show'} addressed requirements ({addressed.length})
            </button>
            {showAddressed && addressed.map((r) => <ResultCard key={r.requirementId} r={r} />)}
          </div>
        </div>
      )}

      <Sheet open={!!gen} onOpenChange={(o) => !o && setGen(null)}>
        <SheetContent side="right" className="w-full sm:max-w-[560px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-blue" aria-hidden /> Generate section text
            </SheetTitle>
            <SheetDescription>
              {gen?.reqId} · {reqById.get(gen?.reqId ?? '')?.text}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-3 px-4">
            {gen?.loading ? (
              <div className="space-y-2" aria-busy="true">
                <p className="text-sm text-ink-2">Drafting a paragraph grounded in the model&apos;s working papers…</p>
                {[80, 95, 70].map((w) => (
                  <div key={w} className="h-3 animate-pulse rounded bg-blue-100" style={{ width: `${w}%` }} />
                ))}
              </div>
            ) : gen?.result ? (
              <>
                <div className="flex items-center gap-2">
                  <AiDraftBadge />
                  <span className="text-xs text-ink-2">
                    Insert into {gen.result.docId} §{gen.result.section} · provider: {gen.provider}
                  </span>
                </div>
                <div className="ai-block doc-serif rounded-r px-4 py-3 text-[15px] leading-7">
                  {gen.result.text.split(/(\{\{.*?\}\})/g).map((p, i) =>
                    p.startsWith('{{') ? (
                      <span key={i} className="script-num" title="From data source">
                        {p.slice(2, -2)}
                      </span>
                    ) : (
                      <span key={i}>{p}</span>
                    ),
                  )}
                </div>
                <p className="text-xs text-ink-2">
                  Sources: <span className="font-mono">{gen.result.sources.join(', ')}</span> · <span className="script-num">grey figures</span> come from data, not generated.
                </p>
              </>
            ) : null}
          </div>
          <SheetFooter className="flex-row justify-end gap-2">
            <Button variant="ghost" onClick={() => setGen(null)}>
              <Trash2 aria-hidden /> Discard
            </Button>
            <Button
              variant="outline"
              disabled={!gen?.result}
              onClick={() => {
                navigator.clipboard?.writeText(gen?.result?.text.replace(/\{\{|\}\}/g, '') ?? '');
                toast('Copied to clipboard');
              }}
            >
              <ClipboardCopy aria-hidden /> Copy
            </Button>
            <Button
              disabled={!gen?.result}
              onClick={() => {
                if (!gen?.result) return;
                const d = ctx.docs.find((x) => x.id === gen.result!.docId) ?? ctx.docs[0];
                s.insertAiBlock(id, `${d.id}@${d.version}`, gen.result.section, gen.result.text);
                setActive(gen.reqId);
                setTab(`${d.id}@${d.version}`);
                setGen(null);
                toast.success(`Inserted into ${d.title} §${gen.result.section}`, { description: 'Marked as AI-drafted. Re-run the check to see the effect.' });
              }}
            >
              Insert into draft
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
