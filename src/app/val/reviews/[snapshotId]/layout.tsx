'use client';
import { useParams } from 'next/navigation';
import { DocViewerProvider } from '@/components/common/DocViewer';
import { StageRail, type Stage } from '@/components/common/StageRail';
import { EmptyState } from '@/components/common/ui-bits';
import { useReviewCtx } from '@/components/val/useReviewCtx';

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  const { snapshotId } = useParams<{ snapshotId: string }>();
  const { review, model, docs, seeded, id } = useReviewCtx(snapshotId);
  if (!review) return seeded ? <EmptyState title="Review not found">No imported submission package with ID {id} in this workspace.</EmptyState> : null;
  const base = `/val/reviews/${encodeURIComponent(id)}`;
  const decided = review.run?.rows.filter((r) => r.decision).length ?? 0;
  const issued = review.findings.filter((f) => f.status !== 'draft').length;
  const stages: Stage[] = [
    { key: 'overview', label: 'Overview', href: base, status: 'optional', note: 'Snapshot & manifest' },
    { key: 'scope', label: 'Scope', href: `${base}/scope`, status: review.run ? 'done' : 'current', note: `${review.validationLayer.length} validation-layer reqs` },
    { key: 'assess', label: 'Blind assessment', href: `${base}/assess`, status: review.revealedAt ? 'done' : review.run ? 'current' : 'todo', note: review.run ? `${decided}/${review.run.rows.length} decided` : 'Not run' },
    { key: 'compare', label: 'Compare', href: `${base}/compare`, status: review.revealedAt ? 'done' : 'todo', note: review.revealedAt ? '1st line matrix revealed' : review.run && decided < review.run.rows.length ? 'Decide every row first' : '1st line matrix hidden' },
    { key: 'findings', label: 'Findings', href: `${base}/findings`, status: review.findingExports.length ? 'done' : review.findings.length ? 'current' : 'todo', note: `${review.findings.length - issued} draft · ${issued} issued` },
    { key: 'opinion', label: 'Opinion', href: `${base}/opinion`, status: review.opinion?.issuedAt ? 'done' : review.findingExports.length ? 'current' : 'todo', note: review.opinion?.issuedAt ? 'Issued' : 'Not issued' },
  ];
  return (
    <DocViewerProvider docs={docs}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <StageRail title={model?.name ?? review.modelId} subtitle={<span className="font-mono">{id}</span>} stages={stages} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </DocViewerProvider>
  );
}
