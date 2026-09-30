'use client';
import { ArrowLeft, ArrowRight, BookOpen, Check, FileUp, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { FamilyBadge } from '@/components/common/badges';
import { FileDrop } from '@/components/common/FileDrop';
import { SourcePicker } from '@/components/common/SourcePicker';
import { useContent } from '@/components/common/useContent';
import { toast } from 'sonner';
import { Card, PageHeader } from '@/components/common/ui-bits';
import { defaultCycle } from '@/components/dev/caseProgress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { COMPONENT_LABEL } from '@/lib/ai/generic';
import { extractFromUpload } from '@/lib/ai/pilot';
import { simulateShort } from '@/lib/ai/provider';
import { nowISO } from '@/lib/clock';
import { docsOf, finalVersionOf } from '@/lib/engine/assess';
import { MANDATORY_SOURCES, type Component } from '@/lib/engine/sources';
import { uid } from '@/lib/rng';
import { getModel, MODELS, PILOT, PILOT_MODEL_ID } from '@/lib/seed';
import { cn } from '@/lib/utils';
import type { Model } from '@/lib/types';
import { attributesFromModel, use1lod, type CaseAttributes } from '@/stores/store1lod';

const STEPS = ['Choose model', 'Model details', 'Requirement sources', 'Scope of assessment'] as const;
const FAMILIES: Model['model_family'][] = ['statistical', 'ml', 'genai', 'expert'];
const FAMILY_LABEL: Record<Model['model_family'], string> = { statistical: 'Statistical', ml: 'Machine learning', genai: 'Generative AI', expert: 'Expert-based' };

function Wizard() {
  const router = useRouter();
  const params = useSearchParams();
  const cases = use1lod((s) => s.cases);
  const createCase = use1lod((s) => s.createCase);
  const [step, setStep] = useState(0);
  const [q, setQ] = useState('');
  const [modelId, setModelId] = useState<string | null>(null);
  const [attrs, setAttrs] = useState<CaseAttributes | null>(null);
  const [component, setComponent] = useState<Component>('rds');
  const [cycle, setCycle] = useState('');
  const [sources, setSources] = useState<string[]>(MANDATORY_SOURCES);
  const [files, setFiles] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);
  const ready = useContent(modelId ? [modelId] : []);

  const activeCase = (id: string) => Object.values(cases).find((c) => c.modelId === id && c.status === 'active');

  function choose(m: Model) {
    setModelId(m.id);
    setAttrs(attributesFromModel(m));
    setCycle(defaultCycle(m));
    setComponent(m.evidence_documents.some((d) => /rds/i.test(d.type)) ? 'rds' : 'full');
    setStep(1);
  }

  useEffect(() => {
    const pre = params.get('model');
    const m = pre ? getModel(pre) : undefined;
    if (m && !modelId && !activeCase(m.id)) choose(m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const model = modelId ? getModel(modelId) : undefined;
  const list = MODELS.filter((m) => !q.trim() || `${m.id} ${m.name} ${m.portfolio} ${m.regulatory_use}`.toLowerCase().includes(q.trim().toLowerCase()));
  const modelDocs = useMemo(() => (model && ready ? (docsOf(model.id)?.documents ?? []) : []), [model, ready]);
  const set = <K extends keyof CaseAttributes>(k: K, v: CaseAttributes[K]) => setAttrs((a) => (a ? { ...a, [k]: v } : a));

  return (
    <div className="mx-auto max-w-[980px]">
      <PageHeader eyebrow={<Link href="/dev" className="hover:underline">← Your use cases</Link>} title="New use case" subtitle="Describe your model and start scoping." />
      <ol className="mb-5 flex items-center gap-3" aria-label="Wizard steps">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-3">
            <span className={cn('flex items-center gap-2 text-sm', step === i ? 'font-semibold text-green-900' : 'text-ink-2')} aria-current={step === i ? 'step' : undefined}>
              <span className={cn('flex size-6 items-center justify-center rounded-full border text-xs', i < step ? 'border-green-600 bg-green-600 text-white' : step === i ? 'border-green-600 text-green-700' : 'border-[#b9c3c3]')}>
                {i < step ? <Check className="size-3.5" aria-hidden /> : i + 1}
              </span>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-line" aria-hidden />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <Card>
          <div className="border-b border-line px-4 py-3">
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by model name, ID, portfolio or regulatory use" className="pl-8" aria-label="Search models" autoFocus />
            </div>
          </div>
          <ul className="max-h-[560px] divide-y divide-line overflow-y-auto">
            {list.map((m) => {
              const active = activeCase(m.id);
              return (
                <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-14 font-mono text-xs font-semibold text-green-800">{m.id}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{m.name}</p>
                    <p className="text-xs text-ink-2">
                      {m.regulatory_use} · Tier {m.tier} · {m.portfolio}
                    </p>
                  </div>
                  <FamilyBadge family={m.model_family} />
                  {active ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dev/cases/${encodeURIComponent(active.caseId)}`}>Continue</Link>
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => choose(m)}>
                      Select
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {step === 1 && model && attrs && (
        <Card className="px-5 py-5">
          <p className="text-base font-semibold text-ink">{model.name}</p>
          <p className="text-sm text-ink-2">
            {model.id} · pre-filled from the model inventory — adjust where needed
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="portfolio">Portfolio</Label>
              <Input id="portfolio" value={attrs.portfolio} onChange={(e) => set('portfolio', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="use">Regulatory use</Label>
              <Input id="use" value={attrs.regulatory_use} onChange={(e) => set('regulatory_use', e.target.value)} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea id="purpose" rows={2} value={attrs.purpose} onChange={(e) => set('purpose', e.target.value)} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="method">Methodology</Label>
              <Textarea id="method" rows={2} value={attrs.methodology} onChange={(e) => set('methodology', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Model family</Label>
              <Select value={attrs.model_family} onValueChange={(v) => set('model_family', v as Model['model_family'])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FAMILIES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {FAMILY_LABEL[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tier</Label>
              <Select value={String(attrs.tier)} onValueChange={(v) => set('tier', Number(v) as 1 | 2 | 3)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3].map((t) => (
                    <SelectItem key={t} value={String(t)}>
                      Tier {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-5 flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>
              <ArrowLeft aria-hidden /> Back
            </Button>
            <Button onClick={() => setStep(2)} disabled={!attrs.portfolio.trim() || !attrs.purpose.trim()}>
              Next <ArrowRight aria-hidden />
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && model && attrs && (
        <Card className="px-5 py-5">
          <p className="text-base font-semibold text-ink">Requirement sources</p>
          <p className="mb-4 text-sm text-ink-2">
            Select the regulation, guidelines, standards and policies {model.name} must be assessed against. The mandatory internal base is pre-selected; everything else is your choice. The AI derives the requirements from exactly these sources.
          </p>
          {ready ? (
            <SourcePicker selected={sources} onToggle={(id, on) => setSources((s) => (on ? [...new Set([...s, id])] : s.filter((x) => x !== id)))} />
          ) : (
            <p className="text-sm text-ink-2">Loading the requirement library…</p>
          )}
          <div className="mt-5 space-y-2">
            <p className="text-sm font-medium text-ink">Additional requirement sources (upload)</p>
            <p className="text-xs text-ink-2">A supervisory decision, previous validation report, letter or memo with obligations. Requirements are extracted after the use case is created.</p>
            <FileDrop compact label="Upload a requirement source" onFiles={(f) => setFiles((x) => [...x, ...f])} />
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
              <span className="text-ink-3">Demo files:</span>
              {(model.id === PILOT_MODEL_ID ? PILOT.upload_examples.filter((u) => u.kind === 'requirement_source').map((u) => u.name) : [`Supervisory letter – ${model.id} (2027).pdf`]).map((n) => (
                <button key={n} type="button" className="flex items-center gap-1 text-green-800 hover:underline" onClick={() => setFiles((x) => [...x.filter((y) => y.name !== n), new File([new Uint8Array(184_320)], n, { type: 'application/pdf' })])}>
                  <FileUp className="size-3" aria-hidden /> {n}
                </button>
              ))}
            </div>
            {files.length > 0 && (
              <ul className="text-xs text-ink-2">
                {files.map((f) => (
                  <li key={f.name}>{f.name}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-5 flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft aria-hidden /> Back
            </Button>
            <span className="text-sm text-ink-2">
              <BookOpen className="mr-1 inline size-4" aria-hidden />
              {sources.length} sources selected{files.length ? ` · ${files.length} upload(s)` : ''}
            </span>
            <Button onClick={() => setStep(3)}>
              Next <ArrowRight aria-hidden />
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && model && attrs && (
        <Card className="px-5 py-5">
          <p className="text-base font-semibold text-ink">{model.name}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Component to assess</Label>
              <Select value={component} onValueChange={(v) => setComponent(v as Component)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['rds', 'mdd', 'full'] as Component[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {COMPONENT_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="cycle">Cycle</Label>
              <Input id="cycle" value={cycle} onChange={(e) => setCycle(e.target.value)} placeholder="Annual review 2027" aria-invalid={!cycle.trim()} />
              {!cycle.trim() && <p className="text-xs text-red">Enter a cycle, for example “Annual review 2027”.</p>}
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-line bg-bg/60 px-4 py-3 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-2">Model documentation in the library</p>
            {modelDocs.length ? (
              <ul className="mt-1 space-y-0.5">
                {modelDocs.map((d) => (
                  <li key={d.id} className="text-ink">
                    {d.title} <span className="text-xs text-ink-2">· {d.type} · v{finalVersionOf(d).version}{d.versions.some((v) => v.status === 'draft') ? ' (draft available)' : ''}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-ink-2">No documentation in the library yet; you can upload it in the draft check and the self-assessment.</p>
            )}
            <p className="mt-1 text-xs text-ink-2">You select which documents to assess in the draft check and the self-assessment.</p>
          </div>
          <div className="mt-5 flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft aria-hidden /> Back
            </Button>
            <Button
              disabled={!cycle.trim() || creating}
              onClick={async () => {
                setCreating(true);
                const id = createCase({ modelId: model.id, cycle: cycle.trim(), component, attributes: attrs, sources });
                for (const f of files) {
                  await simulateShort(`Extracting requirements from ${f.name}`, ['Reading document…', 'Extracting text…', 'Identifying obligations and limitations…'], 1400);
                  use1lod.getState().addUpload(id, { id: uid('UPL'), name: f.name, size: f.size, kind: 'requirement_source', uploadedAt: nowISO(), mime: f.type, extractedRequirements: extractFromUpload(f.name, model.id) });
                }
                if (files.length) toast.success(`${files.length} requirement source(s) processed`, { description: 'Review the extracted requirements in Scoping → Sources.' });
                router.push(`/dev/cases/${encodeURIComponent(id)}/scope`);
              }}
            >
              Create use case <ArrowRight aria-hidden />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function NewUseCasePage() {
  return (
    <Suspense fallback={null}>
      <Wizard />
    </Suspense>
  );
}
