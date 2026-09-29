'use client';
import { Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { PROMPT_TEMPLATE } from '@/lib/ai/provider';
import { fmtDateTime } from '@/lib/clock';
import type { AssessmentRow, AssessmentRun, Requirement, ViewerDoc } from '@/lib/types';
import { Dl } from './ui-bits';

export function RunInspector({ run, row, requirement, docs, extra }: { run: AssessmentRun; row?: AssessmentRow; requirement?: Requirement; docs: ViewerDoc[]; extra?: React.ReactNode }) {
  const passages = row
    ? row.citations.map((c) => {
        const d = docs.find((x) => x.id === c.doc);
        const s = d?.sections.find((x) => x.section === c.section);
        return { id: `${c.doc}#${c.section}`, text: s?.text ?? c.quote };
      })
    : [];
  const output = row
    ? {
        verdict: row.verdict,
        citations: row.citations.map((c) => ({ section: c.section, quote: c.quote })),
        factors: row.confidenceFactors.levels,
        factor_notes: row.confidenceFactors.notes,
        rationale: row.rationale,
        mitigation: row.mitigation,
      }
    : null;
  const prompt = requirement
    ? PROMPT_TEMPLATE.replace('{requirement.id}', requirement.id)
        .replace('{requirement.text}', requirement.text)
        .replace('{requirement.article}', requirement.article)
        .replace('{top-k passages with section ids}', passages.length ? passages.map((p) => `[${p.id}] ${p.text.slice(0, 90)}…`).join('\n  ') : '(no passage retrieved above similarity threshold)')
    : PROMPT_TEMPLATE;
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Cpu aria-hidden /> View run details
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[640px]">
        <SheetHeader>
          <SheetTitle>Run inspector</SheetTitle>
          <SheetDescription>Everything the AI received and returned — reproducible and auditable.</SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-4 pb-8">
          <Dl
            items={[
              ['Run ID', <span key="i" className="font-mono">{run.id}</span>],
              ['Line', run.line === '1lod' ? '1st line (Model Development)' : '2nd line (Model Validation)'],
              ['Provider', run.provider === 'live' ? 'Live (Anthropic)' : 'Simulated'],
              ['Started', fmtDateTime(run.startedAt)],
              ['Library version', `v${run.libraryVersion}`],
              ['Requirement set', run.requirementSetId],
              ['Document versions', Object.entries(run.documentVersions).map(([k, v]) => `${k} v${v}`).join(' · ')],
              ['Inputs', run.inputsSummary],
            ]}
          />
          {extra}
          {row && requirement ? (
            <>
              <div>
                <h3 className="mb-1.5 text-sm font-semibold">Selected row · {requirement.id}</h3>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-3">Prompt template</p>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-[#0f2424] p-3 font-mono text-[11.5px] leading-5 text-[#d6efe9]">{prompt}</pre>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-3">Retrieved passages ({passages.length})</p>
                {passages.length ? (
                  <ul className="space-y-1.5">
                    {passages.map((p) => (
                      <li key={p.id} className="rounded border border-line bg-bg p-2 text-xs">
                        <span className="font-mono font-semibold">{p.id}</span> — {p.text}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-2">No passage retrieved — outcome “not found”.</p>
                )}
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-3">Structured output (JSON)</p>
                <pre className="overflow-x-auto rounded-lg bg-bg p-3 font-mono text-[11.5px] leading-5 text-ink">{JSON.stringify(output, null, 2)}</pre>
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-2">Select a row to see its prompt, retrieved passages and structured output.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
