'use client';
import { ArrowRight, Inbox, Play } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Chip } from '@/components/common/badges';
import { PackageImport } from '@/components/common/PackageImport';
import { EmptyState } from '@/components/common/ui-bits';
import { UseCaseCard } from '@/components/common/UseCaseCard';
import { REVIEW_STATUS } from '@/components/val/reviewStatus';
import { Button } from '@/components/ui/button';
import { can } from '@/lib/permissions';
import { getModel, PERSONAS } from '@/lib/seed';
import { use2lod, type Review } from '@/stores/store2lod';

const STAGES = ['Scope', 'Blind assessment', 'Compare', 'Findings', 'Opinion'] as const;
type SegmentState = 'done' | 'current' | 'todo';

function reviewSegments(r: Review): SegmentState[] {
  const raw = [
    !!r.run,
    !!r.run && r.run.rows.every((x) => x.decision),
    !!r.revealedAt,
    r.findingExports.length > 0,
    !!r.opinion?.issuedAt,
  ];
  let seen = false;
  return raw.map((done) => {
    if (done) return 'done';
    if (!seen) {
      seen = true;
      return 'current';
    }
    return 'todo';
  });
}

function reviewStageLabel(r: Review) {
  if (r.status === 'opinion_issued') return `Completed · opinion issued ${r.opinion?.issuedAt?.slice(0, 10) ?? ''}`;
  const i = reviewSegments(r).indexOf('current');
  return i < 0 ? REVIEW_STATUS[r.status].label : STAGES[i];
}

export default function ValHome() {
  const reviews = use2lod((s) => (can('2lod', 'read:store2lod') ? s.reviews : {}));
  const importSubmission = use2lod((s) => s.importSubmission);
  const router = useRouter();
  const [filter, setFilter] = useState<'in_progress' | 'completed'>('in_progress');
  const list = Object.values(reviews).sort((a, b) => (b.updatedAt ?? b.importedAt).localeCompare(a.updatedAt ?? a.importedAt));
  const bucket = (r: Review) => (r.status === 'opinion_issued' ? 'completed' : 'in_progress');
  const last = list.find((r) => bucket(r) === 'in_progress');
  const shown = list.filter((r) => bucket(r) === filter);
  const me = PERSONAS['2lod'];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="mx-auto max-w-[1200px]">
      <h1 className="text-2xl font-semibold tracking-tight">
        {greeting}, {me.name.split(' ')[0]}
      </h1>
      <p className="mt-1 text-sm text-ink-2">
        {me.role}, {me.unit}
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-[12px] border-2 border-lod2 bg-white p-5">
          <Inbox className="size-6 text-lod2" aria-hidden />
          <p className="mt-2 text-lg font-semibold">Start a review</p>
          <p className="mb-3 text-sm text-ink-2">Import a submission package from the 1st line</p>
          <PackageImport
            type="submission"
            demoFile="SUB-MDL-01-20270614.rcc.json"
            label="Import submission package (.rcc.json)"
            onVerified={(pkg, sha) => {
              const res = importSubmission(pkg, sha);
              if (res.created) {
                toast.success('Review created', { description: `${res.snapshotId} — the 1st line matrix stays hidden until you reveal it.` });
                router.push(`/val/reviews/${encodeURIComponent(res.snapshotId)}/scope`);
              }
              return (
                <div className="flex flex-wrap items-center gap-2">
                  <span>{res.created ? 'Review created.' : 'Already imported — no changes (idempotent).'}</span>
                  <Button size="xs" onClick={() => router.push(`/val/reviews/${encodeURIComponent(res.snapshotId)}`)}>
                    Open review <ArrowRight aria-hidden />
                  </Button>
                </div>
              );
            }}
          />
        </div>
        {last ? (
          <Link href={`/val/reviews/${encodeURIComponent(last.snapshotId)}`} className="rounded-[12px] border border-line bg-white p-5 transition-shadow hover:shadow-md focus-visible:outline-lod2">
            <Play className="size-6 text-ink-2" aria-hidden />
            <p className="mt-2 text-lg font-semibold">Continue where you left off</p>
            <p className="text-sm text-ink-2">
              {getModel(last.modelId)?.name} · {reviewStageLabel(last)}
            </p>
          </Link>
        ) : (
          <div className="rounded-[12px] border border-dashed border-line bg-white/60 p-5 text-sm text-ink-2">Your active review will appear here.</div>
        )}
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <h2 className="mr-2 text-lg font-semibold">Your reviews</h2>
        <Chip active={filter === 'in_progress'} onClick={() => setFilter('in_progress')} count={list.filter((r) => bucket(r) === 'in_progress').length}>
          In progress
        </Chip>
        <Chip active={filter === 'completed'} onClick={() => setFilter('completed')} count={list.filter((r) => bucket(r) === 'completed').length}>
          Completed
        </Chip>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((r) => {
          const m = getModel(r.modelId);
          return (
            <UseCaseCard
              key={r.snapshotId}
              href={`/val/reviews/${encodeURIComponent(r.snapshotId)}`}
              title={m?.name ?? r.modelId}
              subtitle={`${r.snapshotId} · ${r.pkg.requirementSet.component}`}
              family={m?.model_family ?? 'statistical'}
              stage={reviewStageLabel(r)}
              completed={r.status === 'opinion_issued'}
              states={reviewSegments(r)}
              labels={STAGES}
              updatedAt={r.updatedAt ?? r.importedAt}
            />
          );
        })}
      </div>
      {shown.length === 0 && (
        <div className="mt-4">
          <EmptyState title={filter === 'in_progress' ? 'No reviews in progress' : 'No completed reviews yet'}>
            {filter === 'in_progress' ? 'Import a submission package from the 1st line to start a review.' : 'Reviews move here once the validation opinion is issued.'}
          </EmptyState>
        </div>
      )}
    </div>
  );
}
