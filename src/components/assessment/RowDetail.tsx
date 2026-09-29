'use client';
import { BookOpen, MessageCircleQuestion, RotateCcw, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AiDraftBadge, BindingBadge, HumanDecisionBadge, MitigationBadge, MITIGATION_HINT, VERDICT_LABEL, VerdictBadge } from '@/components/common/badges';
import { ConfidenceWhy } from '@/components/common/ConfidenceWhy';
import { CitationQuote } from '@/components/common/DocViewer';
import { ScriptBlock } from '@/components/common/ScriptBlock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { generateText } from '@/lib/ai/provider';
import { FACTOR_KEYS, FACTOR_LABEL } from '@/lib/confidence';
import { getDocument } from '@/lib/seed';
import { cn } from '@/lib/utils';
import type { AssessmentRow, Requirement, RowDecision, Verdict } from '@/lib/types';

export interface RowDetailProps {
  row: AssessmentRow;
  requirement?: Requirement;
  readOnly?: boolean;
  readOnlyReason?: string;
  onDecide?: (ids: string[], d: Omit<RowDecision, 'by' | 'at'>) => void;
  onClearDecision?: (id: string) => void;
  mitigationAction?: (row: AssessmentRow) => React.ReactNode;
  detailExtras?: (row: AssessmentRow) => React.ReactNode;
  headerBadges?: (row: AssessmentRow) => React.ReactNode;
  inspector?: (row: AssessmentRow) => React.ReactNode;
  decisionTitle?: string;
}

const VERDICTS: Verdict[] = ['compliant', 'partial', 'non_compliant', 'not_found', 'not_applicable'];

function Section({ n, title, children, className }: { n: number; title: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('border-t border-line px-4 py-3.5', className)}>
      <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-2">
        <span className="flex size-4 items-center justify-center rounded-full bg-bg text-[10px] text-ink-3">{n}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

export function RowDetail({ row, requirement, readOnly, readOnlyReason, onDecide, onClearDecision, mitigationAction, detailExtras, headerBadges, inspector, decisionTitle = 'Decision' }: RowDetailProps) {
  const [mode, setMode] = useState<'accept' | 'edit' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const [finalV, setFinalV] = useState<Verdict>('compliant');
  const [touched, setTouched] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    setMode(null);
    setReason('');
    setTouched(false);
    setAnswer(null);
    setQuestion('');
    setFinalV(row.verdict === 'compliant' ? 'partial' : 'compliant');
  }, [row.requirementId, row.verdict]);

  const doc = requirement ? getDocument(requirement.source_doc) : undefined;
  const acceptNeedsReason = row.confidence === 'low' || row.verdict === 'non_compliant' || row.verdict === 'not_found';
  const reasonRequired = mode === 'edit' || mode === 'reject' || (mode === 'accept' && acceptNeedsReason);
  const reasonInvalid = reasonRequired && reason.trim().length < 5;

  function submit() {
    setTouched(true);
    if (!mode || reasonInvalid) return;
    onDecide?.([row.requirementId], {
      decision: mode === 'accept' ? 'accepted' : mode === 'edit' ? 'edited' : 'rejected',
      finalVerdict: mode === 'accept' ? undefined : finalV,
      reason: reason.trim() || undefined,
    });
    setMode(null);
    setReason('');
    setTouched(false);
  }

  async function ask() {
    if (!question.trim()) return;
    setAsking(true);
    const weak = FACTOR_KEYS.filter((k) => row.confidenceFactors.levels[k] !== 'good');
    const fallback = () => {
      const ql = question.toLowerCase();
      if (/(why|confidence|low|medium)/.test(ql))
        return `Confidence is ${row.confidence} because ${weak.length ? weak.map((k) => `${FACTOR_LABEL[k].toLowerCase()} is ${row.confidenceFactors.levels[k]}${row.confidenceFactors.notes[k] ? ` (${row.confidenceFactors.notes[k]})` : ''}`).join('; ') : 'all five factors are good'}.`;
      if (/(where|section|evidence|passage|cite)/.test(ql))
        return row.citations.length ? `The evidence is in ${row.citations.map((c) => `${c.doc} v${c.version} §${c.section}`).join(' and ')}. Click a quote to open the document at that passage.` : 'No passage was found in the linked documents. Not found ≠ non-compliant: the evidence may sit in another document.';
      if (/(what|do|fix|next|mitigat)/.test(ql))
        return row.mitigation ? `Proposed ${row.mitigation.type} measure: ${row.mitigation.text} ${MITIGATION_HINT[row.mitigation.type]}` : 'No mitigating measure is needed for this row; review the citation and accept if it is sufficient.';
      return `${requirement?.id}: AI assessment ${VERDICT_LABEL[row.verdict].toLowerCase()}. ${row.rationale}`;
    };
    const prompt = `Requirement ${requirement?.id}: ${requirement?.text}\nVerdict: ${row.verdict}\nRationale: ${row.rationale}\nCitations: ${row.citations.map((c) => `§${c.section} "${c.quote}"`).join('; ') || 'none'}\nFactors: ${JSON.stringify(row.confidenceFactors)}\nMitigation: ${row.mitigation ? `${row.mitigation.type}: ${row.mitigation.text}` : 'none'}\n\nQuestion: ${question}`;
    const res = await generateText('ask_row', prompt, fallback);
    setAnswer(res.text);
    setAsking(false);
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-line bg-white">
      <div className="flex items-start justify-between gap-2 bg-bg/60 px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-sm font-semibold text-green-800">{row.requirementId}</span>
            {headerBadges?.(row)}
          </div>
        </div>
        {inspector?.(row)}
      </div>

      <Section n={1} title="Requirement" className="border-t-0">
        <p className="text-sm leading-6 text-ink">{requirement?.text}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-2">
          <span>Source: {requirement?.article}</span>
          {doc && (
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="inline-flex items-center gap-1 text-green-800 underline underline-offset-2">
                  <BookOpen className="size-3" aria-hidden /> {doc.id}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 text-sm">
                <p className="font-semibold">{doc.title}</p>
                <p className="mt-1 text-xs text-ink-2">
                  {doc.issuer} · {doc.reference} · {doc.version_date}
                </p>
                <div className="mt-2">
                  <BindingBadge level={doc.binding_level} />
                </div>
                <p className="mt-2 text-xs text-ink-2">Key topics: {doc.key_topics.join('; ')}</p>
              </PopoverContent>
            </Popover>
          )}
          {requirement?.source_doc.startsWith('UPLOAD:') && <span>Uploaded source: {requirement.source_doc.slice(7)}</span>}
        </div>
      </Section>

      <Section n={2} title="AI assessment">
        <div className="flex flex-wrap items-center gap-2">
          <VerdictBadge verdict={row.verdict} />
          <AiDraftBadge />
          {row.reassessedAt && <span className="rounded bg-blue-100 px-1.5 text-xs text-blue">Re-assessed with new evidence</span>}
        </div>
      </Section>

      <Section n={3} title="Evidence cited">
        {row.citations.length ? (
          <div className="space-y-2">
            {row.citations.map((c, i) => (
              <CitationQuote key={i} c={c} all={row.citations} />
            ))}
          </div>
        ) : (
          <p className="rounded-md bg-bg px-3 py-2 text-sm text-ink-2">No passage found. Not found ≠ non-compliant: evidence may sit in another document.</p>
        )}
      </Section>

      <Section n={4} title="Confidence — why">
        <ConfidenceWhy confidence={row.confidence} factors={row.confidenceFactors} defaultOpen />
      </Section>

      <Section n={5} title="Rationale (AI)">
        <p className="text-sm leading-6 text-ink">{row.rationale}</p>
        {row.aiDraftedEvidence && <p className="mt-1 text-xs text-blue">AI-drafted text — confirm before relying on this outcome.</p>}
      </Section>

      <Section n={6} title="Proposed mitigating measure">
        {row.mitigation ? (
          <div className="space-y-2">
            <MitigationBadge type={row.mitigation.type} />
            <p className="text-sm leading-6 text-ink">{row.mitigation.text}</p>
            <p className="text-xs text-ink-3">{MITIGATION_HINT[row.mitigation.type]}</p>
            {mitigationAction?.(row)}
          </div>
        ) : (
          <p className="text-sm text-ink-2">None needed — assessed as compliant with sufficient confidence.</p>
        )}
        {detailExtras?.(row)}
      </Section>

      {row.script && (
        <Section n={7} title="Script check">
          <ScriptBlock script={row.script} />
        </Section>
      )}

      <Section n={row.script ? 8 : 7} title={decisionTitle}>
        {row.decision ? (
          <div className="space-y-2">
            <HumanDecisionBadge decision={row.decision} />
            <div className="rounded-md bg-yellow-100/50 px-3 py-2 text-sm">
              <div>
                <strong>{row.decision.by}</strong> · {row.decision.at.slice(0, 16).replace('T', ' ')}
              </div>
              {row.decision.finalVerdict && (
                <div className="mt-1 flex items-center gap-1">
                  Final outcome: <VerdictBadge verdict={row.decision.finalVerdict} />
                </div>
              )}
              {row.decision.reason && <div className="mt-1 text-ink-2">Reason: “{row.decision.reason}”</div>}
            </div>
            {!readOnly && onClearDecision && (
              <Button variant="ghost" size="sm" onClick={() => onClearDecision(row.requirementId)}>
                <RotateCcw aria-hidden /> Change decision
              </Button>
            )}
          </div>
        ) : readOnly ? (
          <p className="text-sm text-ink-2">{readOnlyReason ?? 'Read-only.'}</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Button variant={mode === 'accept' ? 'default' : 'outline'} onClick={() => setMode('accept')}>
                Accept
              </Button>
              <Button variant={mode === 'edit' ? 'default' : 'outline'} onClick={() => setMode('edit')}>
                Edit
              </Button>
              <Button variant={mode === 'reject' ? 'destructive' : 'outline'} onClick={() => setMode('reject')}>
                Reject
              </Button>
            </div>
            {mode && (
              <div className="space-y-2 rounded-lg border border-line bg-bg/60 p-3">
                {mode !== 'accept' && (
                  <div className="space-y-1">
                    <Label>Final outcome</Label>
                    <Select value={finalV} onValueChange={(v) => setFinalV(v as Verdict)}>
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VERDICTS.map((v) => (
                          <SelectItem key={v} value={v}>
                            {VERDICT_LABEL[v]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1">
                  <Label htmlFor={`reason-${row.requirementId}`}>
                    Reason {reasonRequired ? <span className="text-red">*</span> : <span className="font-normal text-ink-3">(optional)</span>}
                  </Label>
                  <Textarea
                    id={`reason-${row.requirementId}`}
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    onBlur={() => setTouched(true)}
                    aria-invalid={touched && reasonInvalid}
                    className="bg-white"
                    placeholder={mode === 'accept' ? 'Why is the AI assessment acceptable?' : mode === 'edit' ? 'Why does the final outcome differ?' : 'Why is the AI assessment wrong?'}
                  />
                  {touched && reasonInvalid && (
                    <p className="text-xs text-red">
                      {mode === 'accept' ? 'Accepting a low-confidence or negative outcome requires a reason (min. 5 characters).' : 'A reason is required (min. 5 characters).'}
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setMode(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={submit}>
                    Confirm {mode === 'accept' ? 'accept' : mode === 'edit' ? 'edit' : 'reject'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      <Section n={row.script ? 9 : 8} title={<span className="flex items-center gap-1"><MessageCircleQuestion className="size-3.5" aria-hidden /> Ask about this row</span>}>
        <div className="flex gap-2">
          <Input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ask()} placeholder="e.g. Why is confidence low?" className="h-8" aria-label="Ask about this row" />
          <Button size="sm" variant="outline" onClick={ask} disabled={asking || !question.trim()} aria-label="Ask">
            <Send aria-hidden />
          </Button>
        </div>
        {asking && <p className="mt-2 text-xs text-ink-3">Thinking…</p>}
        {answer && (
          <div className="mt-2 rounded-md bg-blue-100/60 px-3 py-2 text-sm text-ink">
            <AiDraftBadge className="mb-1" />
            <p>{answer}</p>
          </div>
        )}
      </Section>
    </div>
  );
}
