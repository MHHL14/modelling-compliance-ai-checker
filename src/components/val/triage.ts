import type { AssessmentRow, Requirement, Verdict } from '@/lib/types';
import { final2lod } from '@/stores/store2lod';

export type TriageCat = 'code_diff' | 'disagree' | 'overruled' | 'agree' | 'val_only';

export const TRIAGE: Record<TriageCat, { label: string; action: string; cls: string; order: number }> = {
  code_diff: { label: 'Code/data check differs from documentation', action: 'Raise finding', cls: 'bg-red text-white', order: 0 },
  disagree: { label: 'Disagree', action: 'Full review', cls: 'bg-red-100 text-red', order: 1 },
  overruled: { label: '1st line overruled their AI', action: 'Verify 1st line reason', cls: 'bg-amber-100 text-amber', order: 2 },
  val_only: { label: '2nd line only requirement', action: 'Show result', cls: 'bg-lod2/10 text-lod2', order: 3 },
  agree: { label: 'Agree', action: 'Check a sample citation', cls: 'bg-green-100 text-green-800', order: 4 },
};

/** 1st line final outcome as recorded in the (frozen) package matrix. */
export function lodFinal(r: AssessmentRow): Verdict {
  if ((r.decision?.decision === 'edited' || r.decision?.decision === 'rejected') && r.decision.finalVerdict) return r.decision.finalVerdict;
  return r.verdict;
}

export interface TriageRow {
  req: Requirement;
  cat: TriageCat;
  lod?: AssessmentRow;
  val?: AssessmentRow;
}

export function triage(reqs: Requirement[], matrix: AssessmentRow[], valRows: AssessmentRow[]): TriageRow[] {
  return reqs
    .map((req) => {
      const lod = matrix.find((r) => r.requirementId === req.id);
      const val = valRows.find((r) => r.requirementId === req.id);
      let cat: TriageCat;
      if (req.layer === '2lod' || !lod) cat = 'val_only';
      else if (val?.script?.result === 'fail' && lodFinal(lod) === 'compliant') cat = 'code_diff';
      else if (val && lodFinal(lod) !== final2lod(val)) cat = 'disagree';
      else if (lod.decision?.decision === 'edited' || lod.decision?.decision === 'rejected') cat = 'overruled';
      else cat = 'agree';
      return { req, cat, lod, val };
    })
    .sort((a, b) => TRIAGE[a.cat].order - TRIAGE[b.cat].order);
}
