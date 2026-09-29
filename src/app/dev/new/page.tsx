'use client';
import { ArrowLeft, ArrowRight, BookOpen, Check, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Chip, FamilyBadge } from '@/components/common/badges';
import { Card, PageHeader } from '@/components/common/ui-bits';
import { defaultCycle } from '@/components/dev/caseProgress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { COMPONENT_LABEL } from '@/lib/ai/generic';
import { applicableDocs } from '@/lib/applicability';
import { getScenario } from '@/lib/scenario/engine';
import type { Component } from '@/lib/scenario/types';
import { getModel, MODELS } from '@/lib/seed';
import { cn } from '@/lib/utils';
import type { Model } from '@/lib/types';
import { attributesFromModel, use1lod, type CaseAttributes } from '@/stores/store1lod';

const STEPS = ['Choose model', 'Confirm characteristics', 'Scope of assessment'] as const;
const ALL_TAGS = [...new Set(MODELS.flatMap((m) => m.tags))].sort();
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
  const docCount = attrs ? applicableDocs({ tags: attrs.tags }).length : 0;
  const scenarioDoc = useMemo(() => (model && attrs ? getScenario(model.id, component, attrs.tags).document : undefined), [model, attrs, component]);
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
          <div className="mt-5">
            <p className="text-sm font-medium text-ink">Characteristics</p>
            <p className="mb-2 text-xs text-ink-2">These determine which regulation and internal standards apply.</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_TAGS.map((t) => (
                <Chip key={t} active={attrs.tags.includes(t)} onClick={() => set('tags', attrs.tags.includes(t) ? attrs.tags.filter((x) => x !== t) : [...attrs.tags, t])}>
                  {t.replace(/_/g, ' ')}
                </Chip>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-2" aria-live="polite">
              <BookOpen className="size-4" aria-hidden /> {docCount} applicable documents
            </p>
          </div>
          <div className="mt-5 flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>
              <ArrowLeft aria-hidden /> Back
            </Button>
            <Button onClick={() => setStep(2)} disabled={!attrs.portfolio.trim() || !attrs.purpose.trim() || attrs.tags.length === 0}>
              Next <ArrowRight aria-hidden />
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && model && attrs && (
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
                  {(Object.keys(COMPONENT_LABEL) as Component[]).map((c) => (
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
          {scenarioDoc && (
            <div className="mt-4 rounded-lg border border-line bg-bg/60 px-4 py-3 text-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-2">Document to be assessed</p>
              <p className="mt-1 font-medium text-ink">{scenarioDoc.title}</p>
              <p className="text-xs text-ink-2">
                Draft v{scenarioDoc.draftVersion} and final v{scenarioDoc.finalVersion} available · {docCount} applicable library documents
              </p>
            </div>
          )}
          <div className="mt-5 flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft aria-hidden /> Back
            </Button>
            <Button
              disabled={!cycle.trim()}
              onClick={() => {
                const id = createCase({ modelId: model.id, cycle: cycle.trim(), component, attributes: attrs });
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
