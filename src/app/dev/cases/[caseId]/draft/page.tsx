'use client';
import { Bot, ClipboardCopy, FlaskConical, Play, Sparkles, Trash2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AiDraftBadge, MitigationBadge, ScriptBadge } from '@/components/common/badges';
import { ConfidenceWhy } from '@/components/common/ConfidenceWhy';
import { DocumentPane, type Highlight } from '@/components/common/DocumentPane';
import { Banner, Card, PageHeader } from '@/components/common/ui-bits';
import { useCaseCtx } from '@/components/dev/useCaseCtx';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { sectionText } from '@/lib/scenario/engine';
import type { DraftResult, DraftStatus, GeneratedSection } from '@/lib/scenario/types';
import { generateText, simulateRun } from '@/lib/ai/provider';
import { fmtDateTime } from '@/lib/clock';
import { allCaseRequirements } from '@/stores/store1lod';
import { cn } from '@/lib/utils';
import { use1lod } from '@/stores/store1lod';

const STATUS: Record<DraftStatus, { label: string; cls: string; bar: string }> = {
  gap: { label: 'Gap', cls: 'bg-red-100 text-red', bar: 'bg-red' },
  partial: { label: 'Partial', cls: 'bg-amber-100 text-amber', bar: 'bg-amber' },
  not_in_draft: { label: 'Not yet in draft', cls: 'bg-[#e8ebeb] text-ink-2', bar: 'bg-[#9aa7a7]' },
  addressed: { label: 'Addressed', cls: 'bg-green-100 text-green-800', bar: 'bg-green-600' },
};

export default function DraftPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const { id, uc: work, sc, readOnly: completed, model } = useCaseCtx(caseId);
  const s = use1lod();
  const [active, setActive] = useState<string | null>(null);
  const [gen, setGen] = useState<{ reqId: string; loading: boolean; result?: GeneratedSection; provider?: string } | null>(null);
  const [showAddressed, setShowAddressed] = useState(false);

  const version = work?.draftVersion ?? sc?.document.draftVersion ?? '0.9';
  const check = work?.draftCheck;
  const stale = !!check && check.version !== version;
  const results = useMemo(() => check?.results ?? [], [check]);
  const doc = useMemo(
    () => ({
      id: sc?.document.id ?? '',
      title: `${sc?.document.title ?? ''}${version === sc?.document.draftVersion ? ' — draft' : ''}`,
      version,
      sections: sc?.document.versions[version] ?? [],
      aiBlocks: work?.aiBlocks[version],
    }),
    [version, work?.aiBlocks, sc],
  );
  const highlights: Highlight[] = useMemo(() => {
    if (stale) return [];
    const hs: Highlight[] = [];
    for (const r of results) {
      for (const c of r.citations) hs.push({ section: c.section, quote: c.quote, kind: 'cite', active: active === r.requirementId });
      if (r.gapLocation && (r.status === 'gap' || r.status === 'not_in_draft')) hs.push({ section: r.gapLocation.section, quote: r.gapLocation.quote, kind: 'gap', active: active === r.requirementId });
    }
    return hs;
  }, [results, active, stale]);

  if (!model || !work || !sc) return null;

  const reqById = new Map(allCaseRequirements(work).map((r) => [r.id, r]));
  const count = (st: DraftStatus) => results.filter((r) => r.status === st).length;
  const order: DraftStatus[] = ['addressed', 'partial', 'gap', 'not_in_draft'];
  const gaps = [...results.filter((r) => r.status === 'gap'), ...results.filter((r) => r.status === 'not_in_draft')];
  const partials = results.filter((r) => r.status === 'partial');
  const scripts = results.filter((r) => r.checkType !== 'ai' && r.status === 'addressed');
  const aiAddressed = results.filter((r) => r.status === 'addressed' && r.aiDrafted);
  const addressed = results.filter((r) => r.status === 'addressed' && r.checkType === 'ai' && !r.aiDrafted);

  async function rerun() {
    await simulateRun({ title: `Draft check · v${version}`, total: reqById.size, scripts: 1 });
    s.runDraftCheck(id);
    toast.success(`Draft check complete on v${version}`, { description: 'Sandbox result — no status, no sign-off.' });
  }

  async function generate(r: DraftResult) {
    setGen({ reqId: r.requirementId, loading: true });
    const sim = sectionText(sc!, r.requirementId, r.mitigation?.text);
    const req = reqById.get(r.requirementId);
    const section = sc!.document.versions[version]?.find((x) => x.section === sim.section);
    const prompt = `Requirement ${req?.id}: ${req?.text} (${req?.article}).\nCurrent draft section §${sim.section} "${section?.heading}": ${section?.text}\nGap: ${r.rationale}\nAvailable facts from sources ${sim.sources.join(', ')}: ${sim.text.replace(/\{\{|\}\}/g, '')}\nWrite the paragraph to insert in §${sim.section}.`;
    const res = await generateText('generate_section', prompt, () => sim.text);
    setGen({ reqId: r.requirementId, loading: false, result: { ...sim, text: res.text }, provider: res.provider });
  }

  function Card_({ r }: { r: DraftResult }) {
    const req = reqById.get(r.requirementId);
    const st = STATUS[r.status];
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setActive(r.requirementId)}
        onKeyDown={(e) => e.key === 'Enter' && setActive(r.requirementId)}
        className={cn('cursor-pointer rounded-lg border bg-white p-3 transition-colors', active === r.requirementId ? 'border-green-600 ring-2 ring-green-100' : 'border-line hover:border-green-500')}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', st.cls)}>{st.label}</span>
          <span className="font-mono text-xs font-semibold text-green-800">{r.requirementId}</span>
          {r.checkType !== 'ai' && <ScriptBadge id={r.script?.id} result={r.script?.result ?? 'not_run'} />}
          <AiDraftBadge />
        </div>
        <p className="mt-1.5 text-sm text-ink">{req?.text}</p>
        {r.citations.length ? (
          r.citations.map((c, i) => (
            <p key={i} className="doc-serif mt-1.5 border-l-4 border-yellow bg-yellow-100/60 px-2 py-1 text-[13px]">
              “{c.quote}” <span className="font-sans text-xs text-ink-2">§{c.section}</span>
            </p>
          ))
        ) : (
          <p className="mt-1.5 rounded bg-bg px-2 py-1 text-xs text-ink-2">No passage found{r.gapLocation ? ` — gap location §${r.gapLocation.section}` : ''}.</p>
        )}
        {r.script && (
          <p className="mt-1.5 font-mono text-xs text-ink-2">
            {r.script.id}: {r.script.detail}
          </p>
        )}
        {r.aiDrafted && <p className="mt-1.5 flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-xs text-blue"><Bot className="size-3" aria-hidden /> AI-drafted text — confirm before relying on this outcome.</p>}
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          <ConfidenceWhy confidence={r.confidence} factors={r.confidenceFactors} />
        </div>
        {r.mitigation && (
          <div className="mt-2 space-y-1">
            <MitigationBadge type={r.mitigation.type} />
            <p className="text-xs text-ink-2">{r.mitigation.text}</p>
          </div>
        )}
        {!completed && (r.status === 'gap' || r.status === 'partial') && (
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
        subtitle={`Check a draft of “${sc.document.title}” against the requirement set while you write it.`}
        actions={
          <>
            <Select value={version} onValueChange={(v) => s.setDraftVersion(id, v)}>
              <SelectTrigger className="w-52 bg-white" aria-label="Document version">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={sc.document.draftVersion}>Draft v{sc.document.draftVersion}</SelectItem>
                <SelectItem value={sc.document.finalVersion}>Final v{sc.document.finalVersion} (approved)</SelectItem>
              </SelectContent>
            </Select>
            {!completed && (
              <Button onClick={rerun} disabled={!work.lockedAt && !work.generatedAt}>
                <Play aria-hidden /> {check ? 'Re-run check' : 'Run check'}
              </Button>
            )}
          </>
        }
      />
      <Banner tone="sandbox" icon={<FlaskConical className="size-4" aria-hidden />} className="mb-4">
        <strong>Sandbox — no status, no sign-off. Run as often as you like.</strong> No self-grading: text inserted with “Generate section text” stays marked as AI-drafted, and checks relying on it say so.
      </Banner>
      {stale && (
        <Banner tone="warn" className="mb-4">
          The results below are for v{check?.version}. Re-run the check for v{version}.
        </Banner>
      )}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_440px]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-2 text-xs text-ink-2">
            <span>
              {sc.document.id} · v{version}
            </span>
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <mark className="cite">cited evidence</mark>
              </span>
              <span className="flex items-center gap-1">
                <mark className="gap">gap location</mark>
              </span>
              <span className="ai-block rounded-r px-1.5">AI-drafted</span>
            </span>
          </div>
          <DocumentPane doc={doc} highlights={highlights} scrollKey={active ?? ''} className="h-[calc(100vh-260px)] min-h-[480px]" />
        </Card>
        <div className="min-w-0 space-y-3 xl:max-h-[calc(100vh-200px)] xl:overflow-y-auto xl:pr-1">
          <Card className={cn('p-4', stale && 'opacity-60')}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold">Gap panel</span>
              <span className="text-xs text-ink-2">{check ? `Last run ${fmtDateTime(check.at)} on v${check.version}` : 'Not run yet'}</span>
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
          {!check && (
            <Card className="p-6 text-center text-sm text-ink-2">
              <p className="font-medium text-ink">No check run yet</p>
              <p className="mt-1">{work.generatedAt ? 'Run the check to see which requirements the draft already addresses.' : 'Generate the requirement set in Scoping first.'}</p>
              {work.generatedAt && !completed && (
                <Button className="mt-3" onClick={rerun}>
                  <Play aria-hidden /> Run check
                </Button>
              )}
            </Card>
          )}
          {check && !stale && (
            <>
              {gaps.map((r) => (
                <Card_ key={r.requirementId} r={r} />
              ))}
              {partials.map((r) => (
                <Card_ key={r.requirementId} r={r} />
              ))}
              {aiAddressed.length > 0 && <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-blue">Addressed by AI-drafted text — confirm</p>}
              {aiAddressed.map((r) => (
                <Card_ key={r.requirementId} r={r} />
              ))}
              {scripts.length > 0 && <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-ink-2">Script checks</p>}
              {scripts.map((r) => (
                <Card_ key={r.requirementId} r={r} />
              ))}
              <button type="button" className="w-full rounded-lg border border-dashed border-line bg-white py-2 text-sm text-green-800 hover:bg-green-50" onClick={() => setShowAddressed(!showAddressed)}>
                {showAddressed ? 'Hide' : 'Show'} addressed requirements ({addressed.length})
              </button>
              {showAddressed && addressed.map((r) => <Card_ key={r.requirementId} r={r} />)}
            </>
          )}
        </div>
      </div>

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
                <p className="text-sm text-ink-2">Drafting a paragraph grounded in the exclusion log and DQ report…</p>
                {[80, 95, 70].map((w) => (
                  <div key={w} className="h-3 animate-pulse rounded bg-blue-100" style={{ width: `${w}%` }} />
                ))}
              </div>
            ) : gen?.result ? (
              <>
                <div className="flex items-center gap-2">
                  <AiDraftBadge />
                  <span className="text-xs text-ink-2">Insert into §{gen.result.section} · provider: {gen.provider}</span>
                </div>
                <div className="ai-block doc-serif rounded-r px-4 py-3 text-[15px] leading-7">
                  {gen.result.text.split(/(\{\{.*?\}\})/g).map((p, i) =>
                    p.startsWith('{{') ? (
                      <span key={i} className="script-num" title="From script">
                        {p.slice(2, -2)}
                      </span>
                    ) : (
                      <span key={i}>{p}</span>
                    ),
                  )}
                </div>
                <p className="text-xs text-ink-2">
                  Sources: <span className="font-mono">{gen.result.sources.join(', ')}</span> · <span className="script-num">grey figures</span> come from script (not generated).
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
                s.insertAiBlock(id, version, gen.result.section, gen.result.text);
                setActive(gen.reqId);
                setGen(null);
                toast.success(`Inserted into draft v${version} §${gen.result.section}`, { description: 'Marked as AI-drafted. Re-run the check to see the effect.' });
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
