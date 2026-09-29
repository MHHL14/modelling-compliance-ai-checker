'use client';
import { ArrowRight, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { VerificationCard } from '@/components/common/PackageImport';
import { Banner, Card, CardHeader, Dl, PageHeader } from '@/components/common/ui-bits';
import { REVIEW_STATUS } from '@/components/val/reviewStatus';
import { useReviewCtx } from '@/components/val/useReviewCtx';
import { Button } from '@/components/ui/button';
import { fmtDateTime } from '@/lib/clock';

export default function ReviewOverview() {
  const { snapshotId } = useParams<{ snapshotId: string }>();
  const { review, model, reqs, id } = useReviewCtx(snapshotId);
  if (!review) return null;
  const base = `/val/reviews/${encodeURIComponent(id)}`;
  const next = !review.run ? 'scope' : !review.revealedAt ? 'assess' : review.findingExports.length ? 'opinion' : 'compare';
  return (
    <div>
      <PageHeader
        eyebrow={`Review · ${review.modelId} · ${REVIEW_STATUS[review.status].label}`}
        title={model?.name ?? review.modelId}
        subtitle={`Frozen snapshot ${id} — the 1st line can no longer change it.`}
        actions={
          <Button asChild>
            <Link href={`${base}/${next}`}>
              Continue <ArrowRight aria-hidden />
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <VerificationCard m={review.pkg.manifest} sha={review.sha256} note={`Imported ${fmtDateTime(review.importedAt)}`} />
          {!review.revealedAt && (
            <Banner tone="blind" icon={<EyeOff className="size-4" aria-hidden />}>
              The 1st line matrix ({review.pkg.matrix1lod.length} rows) is part of the package but hidden until you reveal it on the Compare stage.
            </Banner>
          )}
        </div>
        <Card>
          <CardHeader title="Snapshot contents" />
          <div className="px-5 py-4">
            <Dl
              items={[
                ['Requirement set', `${review.pkg.requirementSet.id} · ${review.pkg.requirementSet.component} · locked ${fmtDateTime(review.pkg.requirementSet.lockedAt)} by ${review.pkg.requirementSet.lockedBy ?? '—'}`],
                ['Shared requirements', `${review.pkg.requirements?.length ?? review.pkg.requirementSet.requirementIds.length}`],
                ['Validation layer', `${review.validationLayer.length} (owned by the 2nd line)`],
                ['Excluded by 1st line', review.pkg.requirementSet.excluded.length ? review.pkg.requirementSet.excluded.map((e) => `${e.id}: ${e.reason}`).join('; ') : 'None'],
                ['Documents', review.pkg.documents.map((d) => `${d.title ?? d.id} v${d.version}`).join(' · ')],
                ['Uploads', review.pkg.requirementSet.uploads.map((u) => u.name).join(' · ') || '—'],
                ['Statement', `“${review.pkg.statement}”`],
                ['Blind run', review.run ? `${review.run.id} · ${fmtDateTime(review.run.startedAt)}` : 'Not run'],
                ['Reveal', review.revealedAt ? fmtDateTime(review.revealedAt) : 'Not revealed'],
                ['Total requirements', `${reqs.length}`],
              ]}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
