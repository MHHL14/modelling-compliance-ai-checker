import { FACTOR_KEYS, FACTOR_LABEL } from './confidence';
import { VERDICT_LABEL, MITIGATION_LABEL } from '@/components/common/badges';
import type { AssessmentRow, AssessmentRun, Requirement } from './types';

/** Excel columns per spec 8.4. */
export function matrixRows(rows: AssessmentRow[], reqs: Requirement[], run: AssessmentRun) {
  const byId = new Map(reqs.map((r) => [r.id, r]));
  const docVersions = Object.entries(run.documentVersions).map(([k, v]) => `${k} v${v}`).join('; ');
  return rows.map((r) => {
    const req = byId.get(r.requirementId);
    const fv = r.decision?.finalVerdict ?? (r.decision ? r.verdict : undefined);
    return {
      'Req ID': r.requirementId,
      Requirement: req?.text ?? '',
      Source: `${req?.article ?? ''} (${req?.source_doc ?? ''})`,
      'AI assessment': VERDICT_LABEL[r.verdict],
      Confidence: r.confidence,
      'Confidence rationale': FACTOR_KEYS.map((k) => `${FACTOR_LABEL[k]}: ${r.confidenceFactors.levels[k]}${r.confidenceFactors.notes[k] ? ` (${r.confidenceFactors.notes[k]})` : ''}`).join(' | '),
      Citations: r.citations.map((c) => `${c.doc} v${c.version} §${c.section}: "${c.quote}"`).join(' | ') || (r.script ? `Script ${r.script.id}: ${r.script.detail}` : 'Not found'),
      'Mitigation type': r.mitigation ? MITIGATION_LABEL[r.mitigation.type] : '',
      Mitigation: r.mitigation?.text ?? '',
      'Human decision': r.decision?.decision ?? 'pending',
      'Final outcome': fv ? VERDICT_LABEL[fv] : '',
      Reason: r.decision?.reason ?? '',
      'Decided by/at': r.decision ? `${r.decision.by} · ${r.decision.at.slice(0, 16).replace('T', ' ')}` : '',
      'Library version': run.libraryVersion,
      'Doc version': docVersions,
    };
  });
}
