import type { ReviewStatus } from '@/stores/store2lod';

export const REVIEW_STATUS: Record<ReviewStatus, { label: string; cls: string }> = {
  imported: { label: 'Imported', cls: 'bg-blue-100 text-blue' },
  in_review: { label: 'In review', cls: 'bg-amber-100 text-amber' },
  findings_exported: { label: 'Findings exported', cls: 'bg-lod2/10 text-lod2' },
  opinion_issued: { label: 'Opinion issued', cls: 'bg-green-100 text-green-800' },
};
