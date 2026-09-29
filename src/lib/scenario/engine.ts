import { evidenceDocFor as uploadEvidenceDoc, modelSpecificRow1lod } from '../ai/pilot';
import { deriveConfidence, factors } from '../confidence';
import { getModel, PILOT_MODEL_ID } from '../seed';
import type { AssessmentRow, ConfidenceFactors, Mitigation, PackageDocument, Requirement, Verdict } from '../types';
import { buildGenericScenario } from './generic';
import { buildPilotScenario } from './pilot';
import type { Component, DraftResult, DraftStatus, FindingTemplate, GeneratedSection, Scenario, ScenarioDocument } from './types';

const cache = new Map<string, Scenario>();

export function getScenario(modelId: string, component: Component, tags?: string[]): Scenario {
  const model = getModel(modelId);
  if (!model) throw new Error(`Unknown model ${modelId}`);
  const t = [...(tags ?? model.tags)].sort();
  const key = `${modelId}|${component}|${t.join(',')}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const sc = modelId === PILOT_MODEL_ID && component === 'rds' ? buildPilotScenario(key) : buildGenericScenario({ ...model, tags: t }, component, key);
  cache.set(key, sc);
  return sc;
}

export function assess1lod(sc: Scenario, req: Requirement, evidenceNames: string[]): AssessmentRow {
  if (req.layer === 'model_specific') return modelSpecificRow1lod(req);
  for (const f of sc.evidenceFiles) if (evidenceNames.includes(f.name) && f.resolves[req.id]) return f.resolves[req.id];
  return sc.rows1lod[req.id] ?? modelSpecificRow1lod(req);
}

export function affectedBy(sc: Scenario, fileName: string): string[] {
  return Object.keys(sc.evidenceFiles.find((f) => f.name === fileName)?.resolves ?? {});
}

export function evidenceDocFor(sc: Scenario, fileName: string, textContent?: string): ScenarioDocument {
  return sc.evidenceFiles.find((f) => f.name === fileName)?.doc ?? uploadEvidenceDoc(fileName, textContent);
}

const stripMarks = (s: string) => s.replace(/\{\{|\}\}/g, '');

export function runDraftCheck(sc: Scenario, version: string, requirements: Requirement[], aiBlocks: Record<string, string[]>): DraftResult[] {
  const sections = sc.document.versions[version] ?? [];
  const textOf = (sec: string) => sections.find((s) => s.section === sec)?.text ?? '';
  const allAi = Object.values(aiBlocks).flat().map(stripMarks).join(' ');
  return requirements.map((req) => {
    const seed = sc.rows1lod[req.id];
    const gap = sc.draftGaps.find((g) => g.requirementId === req.id);
    if (!seed) {
      const cf = factors({ match: 'bad', coverage: 'bad', location: 'bad' }, { match: 'No passage found in the draft.' });
      return { requirementId: req.id, status: 'not_in_draft', verdict: 'not_found', citations: [], confidenceFactors: cf, confidence: deriveConfidence(cf), rationale: 'No passage in the draft addresses this requirement.', mitigation: { type: 'verification', text: 'Confirm where this requirement is evidenced, or add a paragraph to the document.' }, script: null, checkType: req.check_type };
    }
    const citations = seed.citations.filter((c) => c.doc === sc.document.id).map((c) => ({ ...c, version }));
    const missing = citations.filter((c) => !textOf(c.section).includes(c.quote));
    const coveredByAi = missing.length > 0 && missing.every((c) => allAi.includes(c.quote));
    if (missing.length > 0 && !coveredByAi) {
      const cf = factors({ match: 'bad', coverage: 'bad', location: 'weak' }, { match: 'Expected passage not found in this draft.', coverage: gap?.rationale ?? 'Required elements not yet written.' });
      return {
        requirementId: req.id, status: 'gap', verdict: 'non_compliant', citations: citations.filter((c) => !missing.includes(c)), confidenceFactors: cf, confidence: deriveConfidence(cf),
        rationale: gap?.rationale ?? 'The passage that would address this requirement is not yet in the draft.',
        mitigation: { type: 'remediation', text: gap?.mitigation ?? 'Add the missing passage to the draft.' },
        script: seed.script ?? null, gapLocation: gap ? { section: gap.section, quote: gap.quote } : { section: missing[0].section }, checkType: req.check_type,
      };
    }
    if (coveredByAi) {
      const cf = factors({}, { verifiability: 'AI-drafted text — confirm the figures against the source before relying on this outcome.' });
      return { requirementId: req.id, status: 'addressed', verdict: 'compliant', citations, confidenceFactors: cf, confidence: deriveConfidence(cf), rationale: `${seed.rationale} (evidence is AI-drafted text inserted in this draft)`, mitigation: null, script: seed.script ?? null, aiDrafted: true, checkType: req.check_type };
    }
    const status: DraftStatus = seed.verdict === 'compliant' ? 'addressed' : seed.verdict === 'partial' ? 'partial' : seed.verdict === 'not_found' ? 'not_in_draft' : 'gap';
    return { requirementId: req.id, status, verdict: seed.verdict, citations, confidenceFactors: seed.confidenceFactors, confidence: seed.confidence, rationale: seed.rationale, mitigation: seed.mitigation, script: seed.script ?? null, checkType: req.check_type };
  });
}

export function sectionText(sc: Scenario, reqId: string, mitigationText?: string): GeneratedSection {
  const gap = sc.draftGaps.find((g) => g.requirementId === reqId);
  if (gap) return gap.generated;
  const sec = sc.rows1lod[reqId]?.citations[0]?.section ?? '1';
  return {
    requirementId: reqId, section: sec, sources: ['model_data_profile', 'dq_report_v2'],
    text: `${mitigationText ? mitigationText.replace(/^Add /, 'This section adds ').replace(/\.$/, '') : 'This section documents the required analysis'}. Results are reproduced from the profiling run ({{run 2027-06-10}}).`,
  };
}

export function assess2lod(sc: Scenario, req: Requirement, docs: PackageDocument[]): AssessmentRow {
  const plan = sc.plan2lod[req.id];
  let citations = (sc.passages[req.id] ?? [])
    .filter((c) => {
      const s = docs.find((d) => d.id === c.doc)?.sections.find((x) => x.section === c.section);
      return !!s && s.text.includes(c.quote);
    })
    .map((c) => ({ ...c, version: docs.find((d) => d.id === c.doc)!.version }));
  let verdict: Verdict = plan?.verdict ?? 'not_found';
  let rationale = plan?.rationale ?? 'No passage in the submitted documents addresses this requirement.';
  const script = plan?.script ?? null;
  if (!plan && req.layer === 'model_specific') {
    citations = [];
    rationale = 'The submitted documentation does not address this model-specific obligation; the evidence may sit in another document.';
  }
  if (citations.length === 0 && !script && verdict !== 'not_applicable') {
    if (verdict !== 'not_found') rationale = `No supporting passage in the submitted documents. ${rationale}`;
    verdict = 'not_found';
  }
  let cf: ConfidenceFactors;
  if (verdict === 'compliant') cf = factors(script?.result === 'pass' ? { verifiability: 'good' } : {}, script?.result === 'pass' ? { verifiability: `Confirmed by script ${script.id}.` } : { verifiability: 'Documentation only.' });
  else if (verdict === 'partial') cf = factors({ coverage: 'weak' }, { coverage: rationale });
  else if (verdict === 'non_compliant' && script?.result === 'fail') cf = factors({ consistency: 'bad', verifiability: 'good' }, { consistency: `Documentation contradicts the implementation: ${script.detail}.`, verifiability: `Script ${script.id} executed on the linked repository.` });
  else if (verdict === 'non_compliant') cf = factors({ consistency: 'bad' }, { consistency: rationale });
  else cf = factors({ match: 'bad', coverage: 'bad', location: 'bad' }, { match: 'No passage found in the frozen package documents.' });
  const confidence = deriveConfidence(cf);
  let mitigation: Mitigation | null = plan?.mitigation ?? null;
  if (!mitigation && (verdict === 'partial' || verdict === 'non_compliant')) mitigation = sc.rows1lod[req.id]?.mitigation ?? { type: 'remediation', text: 'Complete the missing elements identified in the rationale.' };
  if (!mitigation && verdict === 'not_found') mitigation = { type: 'verification', text: req.layer === 'model_specific' ? 'Request evidence that the obligation is implemented before issuing the opinion.' : 'Request the supporting evidence from the 1st line through a finding.' };
  if (!mitigation && confidence === 'low') mitigation = { type: 'verification', text: 'Obtain additional evidence to confirm the outcome.' };
  return { requirementId: req.id, verdict, citations, confidenceFactors: cf, confidence, rationale, mitigation, script };
}

export function findingTemplate(sc: Scenario, reqId: string): FindingTemplate | undefined {
  return sc.findingTemplates[reqId];
}

/** Presenter fast-forward and seeded history use the same scripted decisions. */
export function scriptedDecision(sc: Scenario, row: AssessmentRow): { decision: 'accepted' | 'edited' | 'rejected'; finalVerdict?: Verdict; reason?: string } {
  const s = sc.scriptedDecisions[row.requirementId];
  if (s) {
    if (s.decision === 'edited' && s.final_verdict === row.verdict) return { decision: 'accepted', reason: s.reason };
    return { decision: s.decision, finalVerdict: s.final_verdict, reason: s.reason };
  }
  if (row.verdict === 'not_found' && row.mitigation?.type === 'justification') {
    return { decision: 'edited', finalVerdict: 'not_applicable', reason: 'Evidenced outside the assessed component.' };
  }
  return { decision: 'accepted', reason: row.confidence === 'high' ? undefined : 'Reviewed — evidence sufficient.' };
}
