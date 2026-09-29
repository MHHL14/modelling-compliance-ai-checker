import type { Model } from '@/lib/types';
import type { UseCase } from '@/stores/store1lod';

export type SegmentState = 'done' | 'current' | 'todo';
export const CASE_STAGES = ['Scoping', 'Draft check', 'Self-assessment', 'Submit', 'Findings'] as const;

export function caseSegments(c: UseCase): SegmentState[] {
  const scoping = c.lockedAt ? 'done' : 'current';
  const draft = c.draftCheck ? 'done' : c.lockedAt ? 'current' : 'todo';
  const decided = c.run ? c.run.rows.every((r) => r.decision) : false;
  const assess = c.submission || decided ? 'done' : c.lockedAt ? 'current' : 'todo';
  const submit = c.submission ? 'done' : decided ? 'current' : 'todo';
  const findings = c.status === 'completed' || c.responseExports.length ? 'done' : c.findings.length ? 'current' : 'todo';
  const s: SegmentState[] = [scoping, draft, assess, submit, findings];
  // only the first not-done stage is "current"
  let seen = false;
  return s.map((x) => {
    if (x === 'done') return x;
    if (!seen) {
      seen = true;
      return 'current';
    }
    return 'todo';
  });
}

export function caseStageLabel(c: UseCase): string {
  if (c.status === 'completed') return `Completed · ${c.completedAt?.slice(0, 10) ?? ''}`;
  if (c.findings.length) return 'Findings received';
  if (c.submission) return 'Submitted — awaiting validation';
  const i = caseSegments(c).indexOf('current');
  return CASE_STAGES[Math.max(0, i)];
}

export function defaultCycle(m: Model): string {
  if (m.lifecycle_stage.startsWith('Live')) return 'Annual review 2027';
  if (m.lifecycle_stage.startsWith('Change')) return 'Material change 2027';
  return 'Initial validation 2027';
}
