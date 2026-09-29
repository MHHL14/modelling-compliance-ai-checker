'use client';
import { ArrowRight, List, Play, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Chip } from '@/components/common/badges';
import { EmptyState } from '@/components/common/ui-bits';
import { UseCaseCard } from '@/components/common/UseCaseCard';
import { CASE_STAGES, caseSegments, caseStageLabel } from '@/components/dev/caseProgress';
import { COMPONENT_LABEL } from '@/lib/ai/generic';
import { can } from '@/lib/permissions';
import { getModel, MODELS, PERSONAS } from '@/lib/seed';
import { use1lod } from '@/stores/store1lod';

type F = 'in_progress' | 'submitted' | 'completed';

export default function DevHome() {
  const cases = use1lod((s) => (can('1lod', 'read:store1lod') ? s.cases : {}));
  const [filter, setFilter] = useState<F>('in_progress');
  const list = Object.values(cases).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const bucket = (c: (typeof list)[number]): F => (c.status === 'completed' ? 'completed' : c.submission ? 'submitted' : 'in_progress');
  const last = list.find((c) => c.status === 'active' && !c.submission) ?? list.find((c) => c.status === 'active');
  const me = PERSONAS['1lod'];
  const shown = list.filter((c) => bucket(c) === filter);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="mx-auto max-w-[1200px]">
      <h1 className="text-2xl font-semibold tracking-tight">{greeting}, {me.name.split(' ')[0]}</h1>
      <p className="mt-1 text-sm text-ink-2">{me.role}, {me.unit}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Link href="/dev/new" className="rounded-[12px] border-2 border-green-600 bg-white p-5 transition-shadow hover:shadow-md focus-visible:outline-green-600">
          <Plus className="size-6 text-green-600" aria-hidden />
          <p className="mt-2 text-lg font-semibold">New use case</p>
          <p className="text-sm text-ink-2">Describe your model and start scoping</p>
        </Link>
        {last ? (
          <Link href={`/dev/cases/${encodeURIComponent(last.caseId)}`} className="rounded-[12px] border border-line bg-white p-5 transition-shadow hover:shadow-md focus-visible:outline-green-600">
            <Play className="size-6 text-ink-2" aria-hidden />
            <p className="mt-2 text-lg font-semibold">Continue where you left off</p>
            <p className="text-sm text-ink-2">{getModel(last.modelId)?.name} · {caseStageLabel(last)}</p>
          </Link>
        ) : (
          <div className="rounded-[12px] border border-dashed border-line bg-white/60 p-5 text-sm text-ink-2">Your active use case will appear here.</div>
        )}
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <h2 className="mr-2 text-lg font-semibold">Your use cases</h2>
        {(['in_progress', 'submitted', 'completed'] as F[]).map((f) => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)} count={list.filter((c) => bucket(c) === f).length}>
            {f === 'in_progress' ? 'In progress' : f === 'submitted' ? 'Submitted' : 'Completed'}
          </Chip>
        ))}
        <Link href="/dev/inventory" className="ml-auto flex items-center gap-1 text-sm text-green-800 hover:underline">
          <List className="size-4" aria-hidden /> Full model inventory ({MODELS.length}) <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((c) => {
          const m = getModel(c.modelId)!;
          return (
            <UseCaseCard key={c.caseId} href={`/dev/cases/${encodeURIComponent(c.caseId)}`} title={m.name} subtitle={`${c.cycle} · ${COMPONENT_LABEL[c.component]}`}
              family={m.model_family} stage={caseStageLabel(c)} completed={c.status === 'completed'} states={caseSegments(c)} labels={CASE_STAGES} updatedAt={c.updatedAt} />
          );
        })}
      </div>
      {shown.length === 0 && (
        <div className="mt-4">
          <EmptyState title={filter === 'in_progress' ? 'Start your first use case' : 'Nothing here yet'}>
            {filter === 'in_progress' ? 'Choose one of the 20 models in the inventory and take it through scoping, draft check, self-assessment and submission.' : 'Use cases move here as they progress.'}
          </EmptyState>
        </div>
      )}
    </div>
  );
}
