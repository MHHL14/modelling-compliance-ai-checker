import {
  GAP_LOCATION, GAP_TEXT, generateSectionText, MIT_2LOD, PILOT_APPLICABILITY_CONFIDENCE, PILOT_NOT_APPLICABLE,
  pilotReassess1lod, pilotRow1lod, RDS_ID, RDS_TITLE, retrievePilotPassages,
} from '../ai/pilot';
import { PILOT, PILOT_MODEL_ID, PILOT_SHARED_REQS, PILOT_VAL_REQS, UPLOAD_EVIDENCE } from '../seed';
import type { AssessmentRow } from '../types';
import type { DraftGap, EvidenceFile, FindingTemplate, Plan2lod, Scenario } from './types';

export function buildPilotScenario(key: string): Scenario {
  const rows1lod: Record<string, AssessmentRow> = Object.fromEntries(PILOT_SHARED_REQS.map((r) => [r.id, pilotRow1lod(r.id)!]));
  const draftGaps: DraftGap[] = ['REQ-D12b', 'REQ-D12c'].map((id) => ({
    requirementId: id,
    section: GAP_LOCATION[id].section,
    quote: GAP_LOCATION[id].quote,
    rationale: GAP_TEXT[id].rationale,
    mitigation: GAP_TEXT[id].mitigation,
    generated: generateSectionText(id),
  }));
  const evidenceFiles: EvidenceFile[] = Object.entries(UPLOAD_EVIDENCE).map(([name, e]) => {
    const resolves: Record<string, AssessmentRow> = {};
    for (const id of ['REQ-D21', 'REQ-D09']) {
      const r = pilotReassess1lod(id, [name]);
      if (r) resolves[id] = r;
    }
    return { name, sizeKb: name.startsWith('MDD') ? 2355 : 348, doc: { id: e.docId, version: e.version, title: e.title, sections: e.sections }, resolves };
  });
  const plan2lod: Record<string, Plan2lod> = {};
  for (const [id, s] of Object.entries(PILOT.assessment_2lod_blind)) {
    plan2lod[id] = { verdict: s.verdict, rationale: s.rationale, script: s.script, mitigation: MIT_2LOD[id] ?? PILOT.assessment_1lod[id]?.mitigation ?? null };
  }
  const passages = Object.fromEntries([...PILOT_SHARED_REQS, ...PILOT_VAL_REQS].map((r) => [r.id, retrievePilotPassages(r.id)]));
  const findingTemplates: Record<string, FindingTemplate> = {};
  for (const f of PILOT.draft_findings_2lod) {
    const refs = f.requirement.split(' / ');
    for (const ref of refs) {
      findingTemplates[ref] = { id: f.id, requirementRefs: refs, severity: f.severity, title: f.title, observation: f.observation, impact: f.impact, challenge: f.challenge, deadline: f.deadline };
    }
  }
  return {
    key, modelId: PILOT_MODEL_ID, component: 'rds', pilot: true,
    requirements: PILOT_SHARED_REQS,
    notApplicable: PILOT_NOT_APPLICABLE,
    applicabilityConfidence: PILOT_APPLICABILITY_CONFIDENCE,
    document: { id: RDS_ID, title: RDS_TITLE, draftVersion: '0.7', finalVersion: '1.0', versions: PILOT.evidence_document.versions },
    rows1lod,
    scriptedDecisions: { ...PILOT.decisions_1lod_initial, ...PILOT.decisions_1lod_scripted },
    draftGaps, evidenceFiles,
    validationLayer: PILOT_VAL_REQS,
    plan2lod, passages, findingTemplates,
  };
}
