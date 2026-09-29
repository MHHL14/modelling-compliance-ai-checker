'use client';
import { useMemo } from 'react';
import { getModel } from '@/lib/seed';
import type { ViewerDoc } from '@/lib/types';
import { reviewRequirements, use2lod } from '@/stores/store2lod';

/** 2nd line context. Reads store2lod and the library only (never store1lod). */
export function useReviewCtx(snapshotId: string) {
  const review = use2lod((s) => s.reviews[decodeURIComponent(snapshotId)]);
  const seeded = use2lod((s) => s.seeded);
  const model = review ? getModel(review.modelId) : undefined;
  const docs: ViewerDoc[] = useMemo(
    () => (review ? review.pkg.documents.map((d) => ({ id: d.id, version: d.version, title: d.title ?? d.id, sections: d.sections })) : []),
    [review],
  );
  const reqs = useMemo(() => (review ? reviewRequirements(review) : []), [review]);
  return { review, model, docs, reqs, seeded, id: decodeURIComponent(snapshotId) };
}
