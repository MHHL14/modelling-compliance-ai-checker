// Simulated AI assessment against the documentation the user selected (spec §12.7).
import { generateSectionText, GAP_LOCATION, GAP_TEXT, MIT_2LOD, modelSpecificRow1lod, pilotReassess1lod, pilotRow1lod, retrievePilotPassages } from '../ai/pilot';
import { deriveConfidence, factors } from '../confidence';
import { getModelDocs, libReq, type ComponentKey, type MDSection, type ModelDocs, type ModelDocument } from '../content';
import { PILOT, PILOT_MODEL_ID, UPLOAD_EVIDENCE } from '../seed';
import type { AssessmentRow, Citation, ConfidenceFactors, Mitigation, PackageDocument, Requirement, SeedDecision, Verdict, ViewerDoc } from '../types';
import type { DraftResult, DraftStatus, GeneratedSection } from './types';

export interface DocSel {
  modelId: string;
  docId: string;
  version: string;
}

export interface ResolvedDoc extends ViewerDoc {
  type: string;
  component: ComponentKey[];
  status: 'draft' | 'final' | 'upload';
  sections: MDSection[];
  modelId?: string;
}

const PILOT_UPLOAD_TO_DOC: Record<string, string> = {
  'MDD PD-MORT-NL v4.pdf': 'EVD-01-MDD',
  'DoD implementation memo.pdf': 'EVD-01-DODMEMO',
};

// ---------------------------------------------------------------------------
// Pilot fallback documentation (used until data/modeldocs/MDL-01.json exists)
function pilotFallbackDocs(): ModelDocs {
  const ev = (version: string) =>
    PILOT.evidence_document.versions[version].map((s) => ({
      ...s,
      evidence: Object.entries(PILOT.assessment_1lod).flatMap(([req, a]) =>
        a.citations.filter((c) => c.section === s.section && s.text.includes(c.quote)).map((c) => ({ req, coverage: (a.verdict === 'partial' ? 'partial' : 'full') as 'full' | 'partial', quote: c.quote })),
      ),
    }));
  const mdd = UPLOAD_EVIDENCE['MDD PD-MORT-NL v4.pdf'];
  const memo = UPLOAD_EVIDENCE['DoD implementation memo.pdf'];
  return {
    modelId: PILOT_MODEL_ID,
    documents: [
      { id: 'EVD-01-RDS', title: PILOT.evidence_document.title, type: 'RDS documentation', component: ['rds'], owner: 'Retail Credit Risk Modelling', versions: [{ version: '0.7', status: 'draft', date: '2027-05-20', sections: ev('0.7') }, { version: '1.0', status: 'final', date: '2027-06-12', sections: ev('1.0') }] },
      { id: mdd.docId, title: mdd.title, type: 'Model development document', component: ['mdd'], owner: 'Retail Credit Risk Modelling', versions: [{ version: mdd.version, status: 'final', date: '2027-06-10', sections: mdd.sections }] },
      { id: memo.docId, title: memo.title, type: 'Memo', component: ['rds'], owner: 'Credit Risk Management', versions: [{ version: memo.version, status: 'final', date: '2027-03-15', sections: memo.sections }] },
    ],
    deficiencies: [],
    codeFacts: [{ id: 'CC-03', reqs: ['REQ-D07', 'VAL-02'], check: 'materiality threshold in the default-flag code', result: 'fail', detail: 'rds_build.py L214: MAT_ABS = 250 (documented: 100)' }],
    validationTests: [],
  };
}

export function docsOf(modelId: string): ModelDocs | undefined {
  return getModelDocs(modelId) ?? (modelId === PILOT_MODEL_ID ? pilotFallbackDocs() : undefined);
}

export function findDoc(modelId: string, docId: string): ModelDocument | undefined {
  return docsOf(modelId)?.documents.find((d) => d.id === docId);
}

export const finalVersionOf = (d: ModelDocument) => [...d.versions].reverse().find((v) => v.status === 'final') ?? d.versions[d.versions.length - 1];
export const draftVersionOf = (d: ModelDocument) => d.versions.find((v) => v.status === 'draft') ?? finalVersionOf(d);

export function resolveSelection(sel: DocSel[], uploads: (PackageDocument & { title: string; uploadName: string })[] = []): ResolvedDoc[] {
  const out: ResolvedDoc[] = [];
  for (const s of sel) {
    const d = findDoc(s.modelId, s.docId);
    const v = d?.versions.find((x) => x.version === s.version);
    if (!d || !v) continue;
    out.push({ id: d.id, title: d.title, version: v.version, type: d.type, component: d.component, status: v.status, sections: v.sections, modelId: s.modelId });
  }
  for (const u of uploads) out.push({ id: u.id, title: u.title, version: u.version, type: 'Uploaded document', component: ['rds', 'mdd'], status: 'upload', sections: u.sections });
  return out;
}

/** An uploaded file whose name matches a library document resolves to that document (final version). */
export function matchUpload(modelId: string, fileName: string): DocSel | null {
  const pilotDoc = PILOT_UPLOAD_TO_DOC[fileName];
  if (pilotDoc && modelId === PILOT_MODEL_ID) {
    const d = findDoc(PILOT_MODEL_ID, pilotDoc);
    if (d) return { modelId, docId: d.id, version: finalVersionOf(d).version };
  }
  const base = fileName.replace(/\.(pdf|docx|txt|md)$/i, '').trim().toLowerCase();
  const d = docsOf(modelId)?.documents.find((x) => x.title.toLowerCase() === base || x.id.toLowerCase() === base);
  return d ? { modelId, docId: d.id, version: finalVersionOf(d).version } : null;
}

// ---------------------------------------------------------------------------
interface Hit {
  doc: ResolvedDoc;
  section: MDSection;
  coverage: 'full' | 'partial';
  quote: string;
}

function hitsFor(reqId: string, docs: ResolvedDoc[]): Hit[] {
  const out: Hit[] = [];
  for (const doc of docs) for (const s of doc.sections) for (const e of s.evidence ?? []) if (e.req === reqId && s.text.includes(e.quote)) out.push({ doc, section: s, coverage: e.coverage, quote: e.quote });
  return out.sort((a, b) => (a.coverage === b.coverage ? 0 : a.coverage === 'full' ? -1 : 1));
}

const cite = (h: Hit): Citation => ({ doc: h.doc.id, version: h.doc.version, section: h.section.section, quote: h.quote });
const where = (h: Hit) => `§${h.section.section} of “${h.doc.title}”`;

function row(id: string, verdict: Verdict, citations: Citation[], cf: ConfidenceFactors, rationale: string, mitigation: Mitigation | null, script: AssessmentRow['script'] = null): AssessmentRow {
  return { requirementId: id, verdict, citations, confidenceFactors: cf, confidence: deriveConfidence(cf), rationale, mitigation, script };
}

/** Documents (not selected) in the model's library that would evidence the requirement. */
function expectedIn(modelId: string, reqId: string, selected: ResolvedDoc[]): ModelDocument[] {
  return (docsOf(modelId)?.documents ?? []).filter((d) => !selected.some((s) => s.id === d.id) && finalVersionOf(d).sections.some((s) => s.evidence?.some((e) => e.req === reqId)));
}

export interface Ctx {
  modelId: string;
  docs: ResolvedDoc[];
}

// ---------------------------------------------------------------------------
// 1st line
export function assess1lod(ctx: Ctx, req: Requirement): AssessmentRow {
  if (req.layer === 'model_specific') return modelSpecificRow1lod(req);
  const md = docsOf(ctx.modelId);
  // Pilot: hand-written seed results take precedence while the final RDS document is selected
  if (ctx.modelId === PILOT_MODEL_ID && PILOT.assessment_1lod[req.id] && ctx.docs.some((d) => d.id === 'EVD-01-RDS' && d.status === 'final')) {
    const names = Object.entries(PILOT_UPLOAD_TO_DOC).filter(([, docId]) => ctx.docs.some((d) => d.id === docId)).map(([n]) => n);
    const r = pilotReassess1lod(req.id, names) ?? pilotRow1lod(req.id)!;
    const rdsVersion = ctx.docs.find((d) => d.id === 'EVD-01-RDS')!.version;
    return { ...r, citations: r.citations.map((c) => (c.doc === 'EVD-01-RDS' ? { ...c, version: rdsVersion } : c)).filter((c) => ctx.docs.some((d) => d.id === c.doc && d.sections.some((s) => s.section === c.section && s.text.includes(c.quote)))) };
  }
  const hits = hitsFor(req.id, ctx.docs);
  const art = libReq(req.id)?.article ?? req.article;
  if (!hits.length) {
    const exp = expectedIn(ctx.modelId, req.id, ctx.docs);
    const cf = factors({ match: 'bad', coverage: 'bad', location: 'bad' }, { match: 'No passage in the selected documents addresses this requirement.' });
    return row(
      req.id,
      'not_found',
      [],
      cf,
      exp.length
        ? `No passage in the selected documents addresses this requirement. The model documentation library suggests the evidence sits in “${exp[0].title}”, which is not selected.`
        : 'No passage in the selected documents addresses this requirement. The evidence may sit in a document that has not been selected or uploaded.',
      { type: 'verification', text: exp.length ? `Select “${exp[0].title}” or upload the document that evidences ${art}.` : `Upload or select the document that evidences ${art}, or add the analysis to the model documentation.` },
    );
  }
  const best = hits[0];
  const def = md?.deficiencies.find((d) => d.req === req.id && d.detected_by !== '2lod' && ctx.docs.some((x) => x.id === d.doc));
  const code = md?.codeFacts.find((c) => c.reqs.includes(req.id));
  const reqComps = libReq(req.id)?.components ?? ['rds', 'mdd'];
  const inPlace = hits.some((h) => h.doc.component.some((c) => reqComps.includes(c)));
  const mixed = hits.some((h) => h.coverage === 'full') && hits.some((h) => h.coverage === 'partial');
  const lv = {
    match: best.coverage === 'full' ? 'good' : 'weak',
    coverage: def?.verdict === 'non_compliant' ? 'bad' : best.coverage === 'full' && !def ? 'good' : 'weak',
    location: inPlace ? 'good' : 'weak',
    consistency: mixed ? 'weak' : 'good',
    verifiability: code ? 'bad' : 'weak',
  } as const;
  const notes: ConfidenceFactors['notes'] = {};
  if (lv.match === 'weak') notes.match = 'The selected documents address the requirement only indirectly or in part.';
  if (def) notes.coverage = def.rationale;
  if (!inPlace) notes.location = `Evidence found in ${where(best)}, not in the document type where this requirement is normally evidenced.`;
  if (mixed) notes.consistency = 'Documents differ in how completely they address the requirement.';
  notes.verifiability = code ? `The implementation (${code.check}) is not linked to this run and cannot be confirmed.` : 'Documentation only.';
  const cf = factors(lv, notes);
  const verdict: Verdict = def ? def.verdict : best.coverage === 'full' ? 'compliant' : 'partial';
  const also = hits.length > 1 ? ` Also addressed in ${hits.slice(1, 3).map(where).join(' and ')}.` : '';
  const rationale = def
    ? `${def.rationale} (${where(best)})`
    : verdict === 'compliant'
      ? `${where(best)} addresses the requirement.${also}${code ? ' Confidence is lowered because only the documentation was assessed.' : ''}`
      : `${where(best)} addresses the requirement only in part; not all elements of ${art} are covered.${also}`;
  const mitigation: Mitigation | null = def
    ? def.mitigation
    : verdict === 'partial'
      ? { type: 'remediation', text: `Complete §${best.section.section} of “${best.doc.title}” so that all elements of ${art} are addressed.` }
      : code
        ? { type: 'verification', text: `Link the code repository and run script check ${code.id} (${code.check}).` }
        : null;
  return row(req.id, verdict, hits.slice(0, 3).map(cite), cf, rationale, mitigation);
}

export function affectedBy(modelId: string, sel: DocSel): string[] {
  const d = findDoc(sel.modelId, sel.docId);
  const v = d?.versions.find((x) => x.version === sel.version);
  const ids = new Set<string>();
  for (const s of v?.sections ?? []) for (const e of s.evidence ?? []) ids.add(e.req);
  if (modelId === PILOT_MODEL_ID && sel.docId === 'EVD-01-MDD') ids.add('REQ-D21');
  if (modelId === PILOT_MODEL_ID && sel.docId === 'EVD-01-DODMEMO') ids.add('REQ-D09');
  return [...ids];
}

// ---------------------------------------------------------------------------
// Draft check (interim assessment on draft versions)
const stripMarks = (s: string) => s.replace(/\{\{|\}\}/g, '');

export function runDraftCheck(ctx: Ctx, requirements: Requirement[], aiBlocks: Record<string, string[]>): DraftResult[] {
  const allAi = Object.values(aiBlocks).flat().map(stripMarks).join(' ');
  const pilot = ctx.modelId === PILOT_MODEL_ID;
  return requirements.map((req) => {
    const check = req.check_type;
    const assessed = assess1lod(ctx, req);
    if (assessed.verdict !== 'not_found' || req.layer === 'model_specific') {
      const status: DraftStatus = assessed.verdict === 'compliant' ? 'addressed' : assessed.verdict === 'partial' ? 'partial' : assessed.verdict === 'not_found' ? 'not_in_draft' : 'gap';
      return { requirementId: req.id, status, verdict: assessed.verdict, citations: assessed.citations, confidenceFactors: assessed.confidenceFactors, confidence: assessed.confidence, rationale: assessed.rationale, mitigation: assessed.mitigation, script: assessed.script ?? null, checkType: check };
    }
    // Is it evidenced in the final version of a selected document? Then it is a drafting gap.
    for (const d of ctx.docs) {
      const doc = d.modelId ? findDoc(d.modelId, d.id) : undefined;
      if (!doc || d.status !== 'draft') continue;
      const fin = finalVersionOf(doc);
      const sec = fin.sections.find((s) => s.evidence?.some((e) => e.req === req.id));
      if (!sec) continue;
      const ev = sec.evidence!.find((e) => e.req === req.id)!;
      if (allAi.includes(ev.quote)) {
        const cf = factors({}, { verifiability: 'AI-drafted text — confirm against the source before relying on this outcome.' });
        return { requirementId: req.id, status: 'addressed', verdict: 'compliant', citations: [{ doc: d.id, version: d.version, section: sec.section, quote: ev.quote }], confidenceFactors: cf, confidence: deriveConfidence(cf), rationale: 'Addressed by AI-drafted text inserted in this draft.', mitigation: null, script: null, aiDrafted: true, checkType: check };
      }
      const gt = pilot ? GAP_TEXT[req.id] : undefined;
      const inDraft = d.sections.find((s) => s.section === sec.section);
      const cf = factors({ match: 'bad', coverage: 'bad', location: 'weak' }, { match: 'Expected passage not found in this draft.', coverage: gt?.rationale ?? `§${sec.section} (${sec.heading}) does not yet address the requirement.` });
      return {
        requirementId: req.id, status: 'gap', verdict: 'non_compliant', citations: [], confidenceFactors: cf, confidence: deriveConfidence(cf),
        rationale: gt?.rationale ?? (inDraft ? `§${sec.section} (${sec.heading}) is incomplete in this draft; the requirement is not yet addressed.` : `§${sec.section} (${sec.heading}) is not yet written in this draft.`),
        mitigation: { type: 'remediation', text: gt?.mitigation ?? `Complete §${sec.section} (${sec.heading}) in “${d.title}” to address ${libReq(req.id)?.article ?? req.article}.` },
        script: null, gapLocation: pilot && GAP_LOCATION[req.id] ? { ...GAP_LOCATION[req.id], doc: d.id } : { section: sec.section, doc: d.id }, checkType: check,
      };
    }
    return { requirementId: req.id, status: 'not_in_draft', verdict: 'not_found', citations: [], confidenceFactors: assessed.confidenceFactors, confidence: assessed.confidence, rationale: assessed.rationale, mitigation: assessed.mitigation, script: null, checkType: check };
  });
}

/** Text proposed by "Generate section text" for a drafting gap. */
export function sectionText(ctx: Ctx, reqId: string, mitigationText?: string): GeneratedSection {
  if (ctx.modelId === PILOT_MODEL_ID && (reqId === 'REQ-D12b' || reqId === 'REQ-D12c')) return { ...generateSectionText(reqId), docId: 'EVD-01-RDS' };
  for (const d of ctx.docs) {
    const doc = d.modelId ? findDoc(d.modelId, d.id) : undefined;
    if (!doc) continue;
    const sec = finalVersionOf(doc).sections.find((s) => s.evidence?.some((e) => e.req === reqId));
    if (sec) return { requirementId: reqId, docId: d.id, section: sec.section, text: sec.text.replace(/(\d[\d,.]*\s?%?)/g, '{{$1}}'), sources: [`${doc.id} working papers`, 'model data profile'] };
  }
  return { requirementId: reqId, section: '1', sources: ['model data profile'], text: `${mitigationText ? mitigationText.replace(/\.$/, '') : 'This section documents the required analysis'}.` };
}

// ---------------------------------------------------------------------------
// 2nd line (independent; only the frozen package documents and the validation team's own tests)
export function assess2lod(modelId: string, req: Requirement, pkgDocs: PackageDocument[]): AssessmentRow {
  const md = docsOf(modelId);
  // Pilot seed plan
  if (modelId === PILOT_MODEL_ID && PILOT.assessment_2lod_blind[req.id]) {
    const s = PILOT.assessment_2lod_blind[req.id];
    const citations = retrievePilotPassages(req.id)
      .filter((c) => pkgDocs.some((d) => d.id === c.doc && d.sections.some((x) => x.section === c.section && x.text.includes(c.quote))))
      .map((c) => ({ ...c, version: pkgDocs.find((d) => d.id === c.doc)!.version }));
    return finish2lod(req, s.verdict, s.rationale, s.script, MIT_2LOD[req.id] ?? PILOT.assessment_1lod[req.id]?.mitigation ?? null, citations);
  }
  // Validation-layer requirement: the validation team's own test
  const test = md?.validationTests.find((t) => t.req === req.id);
  if (req.layer === '2lod') {
    if (!test) return finish2lod(req, 'not_found', 'No validation test result is recorded for this requirement in this review.', null, { type: 'verification', text: 'Perform and document the validation test.' }, []);
    return finish2lod(req, test.verdict, test.detail, { id: test.id, result: test.result === 'partial' ? 'fail' : test.result, detail: test.detail }, test.verdict === 'compliant' ? null : { type: 'remediation', text: `Address the validation test outcome (${test.id}).` }, []);
  }
  const resolved: ResolvedDoc[] = pkgDocs.map((p) => {
    const lib = md?.documents.find((d) => d.id === p.id)?.versions.find((v) => v.version === p.version);
    return { id: p.id, title: p.title ?? p.id, version: p.version, type: '', component: ['rds', 'mdd'], status: 'final', sections: lib?.sections ?? p.sections.map((s) => ({ ...s })) };
  });
  const hits = hitsFor(req.id, resolved);
  const code = md?.codeFacts.find((c) => c.reqs.includes(req.id));
  const def = md?.deficiencies.find((d) => d.req === req.id && resolved.some((x) => x.id === d.doc));
  if (!hits.length && !code) return finish2lod(req, req.layer === 'model_specific' ? 'not_found' : 'not_found', 'No passage in the submitted documents addresses this requirement.', null, null, []);
  const citations = hits.slice(0, 3).map(cite);
  if (code?.result === 'fail') return finish2lod(req, 'non_compliant', `The documentation addresses the requirement, but script ${code.id} shows the implementation differs: ${code.detail}.`, { id: code.id, result: 'fail', detail: code.detail }, { type: 'remediation', text: `Align the implementation with the documentation (${code.check}) and quantify the impact on model outcomes.` }, citations);
  if (def) return finish2lod(req, def.verdict, def.rationale, code ? { id: code.id, result: code.result, detail: code.detail } : null, def.mitigation, citations);
  const best = hits[0];
  return finish2lod(req, best?.coverage === 'full' ? 'compliant' : 'partial', best?.coverage === 'full' ? `Consistent with the evidence in ${where(best)}.` : `${where(best)} addresses the requirement only in part.`, code ? { id: code.id, result: code.result, detail: code.detail } : null, best?.coverage === 'full' ? null : { type: 'remediation', text: `Complete the documentation for ${libReq(req.id)?.article ?? req.article}.` }, citations);
}

function finish2lod(req: Requirement, verdict: Verdict, rationale: string, script: AssessmentRow['script'], mitigation: Mitigation | null, citations: Citation[]): AssessmentRow {
  let v = verdict;
  let why = rationale;
  if (citations.length === 0 && !script && v !== 'not_applicable' && v !== 'not_found') {
    why = `No supporting passage in the submitted documents. ${rationale}`;
    v = 'not_found';
  }
  let cf: ConfidenceFactors;
  if (v === 'compliant') cf = factors(script?.result === 'pass' ? { verifiability: 'good' } : {}, script?.result === 'pass' ? { verifiability: `Confirmed by script ${script.id}.` } : { verifiability: 'Documentation only.' });
  else if (v === 'partial') cf = factors({ coverage: 'weak' }, { coverage: why });
  else if (v === 'non_compliant' && script?.result === 'fail') cf = factors({ consistency: 'bad', verifiability: 'good' }, { consistency: `Documentation contradicts the implementation: ${script.detail}.`, verifiability: `Script ${script.id} executed on the linked repository.` });
  else if (v === 'non_compliant') cf = factors({ consistency: 'bad' }, { consistency: why });
  else cf = factors({ match: 'bad', coverage: 'bad', location: 'bad' }, { match: 'No passage found in the frozen package documents.' });
  const confidence = deriveConfidence(cf);
  let m = mitigation;
  if (!m && (v === 'partial' || v === 'non_compliant')) m = { type: 'remediation', text: 'Complete the missing elements identified in the rationale.' };
  if (!m && v === 'not_found') m = { type: 'verification', text: req.layer === 'model_specific' ? 'Request evidence that the obligation is implemented before issuing the opinion.' : 'Request the supporting evidence from the 1st line through a finding.' };
  if (!m && confidence === 'low') m = { type: 'verification', text: 'Obtain additional evidence to confirm the outcome.' };
  return { requirementId: req.id, verdict: v, citations, confidenceFactors: cf, confidence, rationale: why, mitigation: m, script };
}

// ---------------------------------------------------------------------------
export function validationLayerIds(modelId: string): string[] {
  if (modelId === PILOT_MODEL_ID) return ['VAL-01', 'VAL-02', 'VAL-03', 'VAL-04'];
  return (docsOf(modelId)?.validationTests ?? []).map((t) => t.req);
}

export interface FindingTemplate {
  id?: string;
  requirementRefs: string[];
  severity: 'high' | 'medium' | 'low';
  title: string;
  observation: string;
  impact: string;
  challenge: string;
  deadline: string;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function findingTemplate(modelId: string, reqId: string): FindingTemplate | undefined {
  if (modelId === PILOT_MODEL_ID) {
    const f = PILOT.draft_findings_2lod.find((x) => x.requirement.split(' / ').includes(reqId));
    if (f) return { id: f.id, requirementRefs: f.requirement.split(' / '), severity: f.severity, title: f.title, observation: f.observation, impact: f.impact, challenge: f.challenge, deadline: f.deadline };
  }
  const md = docsOf(modelId);
  const code = md?.codeFacts.find((c) => c.result === 'fail' && c.reqs.includes(reqId));
  if (code)
    return {
      requirementRefs: code.reqs, severity: 'high', title: `${cap(code.check)} differs from the documentation`,
      observation: `The model documentation states the approved approach; script ${code.id} shows ${code.detail}.`,
      impact: 'Model outcomes are produced with an implementation that differs from the approved documentation.',
      challenge: 'Since when has the implemented value been used, and which model runs and reported figures are affected?', deadline: '2027-10-31',
    };
  const def = md?.deficiencies.find((d) => d.req === reqId);
  if (def) {
    const r = libReq(reqId);
    return {
      requirementRefs: [reqId], severity: def.verdict === 'non_compliant' ? 'high' : 'medium', title: `${(r?.text ?? reqId).replace(/\.$/, '')} — ${def.verdict === 'non_compliant' ? 'not met' : 'not fully demonstrated'}`,
      observation: def.rationale, impact: def.verdict === 'non_compliant' ? 'Requirement not met; potential impact on model outcomes.' : 'Compliance cannot be fully confirmed.',
      challenge: def.mitigation.text, deadline: def.verdict === 'non_compliant' ? '2027-10-31' : '2027-12-31',
    };
  }
  return undefined;
}

/** Presenter fast-forward and seeded history. */
export function scriptedDecision(modelId: string, row: AssessmentRow): { decision: 'accepted' | 'edited' | 'rejected'; finalVerdict?: Verdict; reason?: string } {
  const s: SeedDecision | undefined = modelId === PILOT_MODEL_ID ? { ...PILOT.decisions_1lod_initial, ...PILOT.decisions_1lod_scripted }[row.requirementId] : undefined;
  if (s) {
    if (s.decision === 'edited' && s.final_verdict === row.verdict) return { decision: 'accepted', reason: s.reason };
    return { decision: s.decision, finalVerdict: s.final_verdict, reason: s.reason };
  }
  if (row.verdict === 'not_found' && row.mitigation?.type === 'justification') return { decision: 'edited', finalVerdict: 'not_applicable', reason: 'Evidenced outside the assessed component.' };
  if (row.verdict === 'not_found') return { decision: 'accepted', reason: 'Evidence to be added in the next document version.' };
  if (row.verdict === 'partial' || row.verdict === 'non_compliant') return { decision: 'accepted', reason: 'Remediation planned in the next document version.' };
  return { decision: 'accepted', reason: row.confidence === 'high' ? undefined : 'Reviewed — evidence sufficient.' };
}
