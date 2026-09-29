import { seeded } from '@/lib/rng';
import { PILOT_MODEL_ID } from '@/lib/seed';
import type { Model } from '@/lib/types';
import { finalVerdict, type ModelWork } from '@/stores/store1lod';

export function lifecycleTone(stage: string) {
  if (stage.startsWith('Development')) return 'bg-blue-100 text-blue';
  if (stage.startsWith('Pre-submission')) return 'bg-amber-100 text-amber';
  if (stage.startsWith('Validation')) return 'bg-lod2/10 text-lod2';
  if (stage.startsWith('Change')) return 'bg-[#efe7f7] text-[#5b3a86]';
  return 'bg-green-50 text-green-800';
}

/** Open findings from earlier validation cycles (model inventory) for non-pilot models — illustrative. */
export function inventoryOpenFindings(m: Model) {
  if (m.id === PILOT_MODEL_ID || m.lifecycle_stage.startsWith('Development')) return 0;
  return Math.floor(seeded(`${m.id}:findings`)() * 5);
}

export function openGaps(w?: ModelWork) {
  if (!w?.run) return 0;
  return w.run.rows.filter((r) => {
    const v = finalVerdict(r);
    return v === 'non_compliant' || v === 'partial' || v === 'not_found';
  }).length;
}

export function currentStageLabel(m: Model, w?: ModelWork) {
  if (m.id !== PILOT_MODEL_ID) return m.lifecycle_stage;
  if (!w) return 'Stage 3 – Self-assessment';
  if (w.findings.length) return 'Findings received';
  if (w.submission) return 'Submitted – awaiting validation';
  if (!w.lockedAt) return 'Stage 3 – Self-assessment (set not locked)';
  return 'Stage 3 – Self-assessment';
}
