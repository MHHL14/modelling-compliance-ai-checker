import { COMPONENT_LABEL, genericApplicabilityConfidence, genericQuote, genericRequirements } from '../ai/generic';
import { docApplies } from '../applicability';
import { deriveConfidence, factors } from '../confidence';
import { seeded } from '../rng';
import { DOCUMENTS } from '../seed';
import type { AssessmentRow, Citation, ConfidenceFactors, DocSection, Mitigation, Model, Requirement, ScriptResult, SeedDecision, Verdict } from '../types';
import { FAMILY } from './families';
import type { Component, DraftGap, EvidenceFile, FindingTemplate, NotApplicableReq, Plan2lod, Scenario } from './types';

export const DRAFT_VERSION = '0.9';
export const FINAL_VERSION = '1.0';

const sectionId = (i: number) => `${Math.floor(i / 3) + 2}.${(i % 3) + 1}`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function row(id: string, verdict: Verdict, citations: Citation[], cf: ConfidenceFactors, rationale: string, mitigation: Mitigation | null, script: ScriptResult | null = null): AssessmentRow {
  return { requirementId: id, verdict, citations, confidenceFactors: cf, confidence: deriveConfidence(cf), rationale, mitigation, script };
}

function pickDocument(model: Model, component: Component) {
  const docs = model.evidence_documents.filter((d) => d.type !== 'code');
  const want = component === 'rds' ? /rds|data/i : component === 'mdd' ? /mdd|development|methodolog/i : /mdd|development|documentation/i;
  return docs.find((d) => want.test(`${d.type} ${d.title}`)) ?? docs[0] ?? { id: `EVD-${model.id.slice(4)}-DOC`, title: `${model.name} – model documentation`, type: 'MDD' };
}

function detailFor(r: Requirement, model: Model) {
  const repo = FAMILY[model.model_family].repo(model);
  switch (r.category) {
    case 'data':
      return `The analysis covers the observation period and population described in section 2 and is produced by versioned code in repository ${repo}.`;
    case 'methodology':
      return 'The chosen approach, the alternatives considered and the rationale for the final specification are documented.';
    case 'governance':
      return `Roles, approvals and dates are recorded in the model inventory; the model owner is ${model.owner_1lod}.`;
    case 'validation':
      return 'Results are compared against the thresholds of the Validation Testing Handbook (MV-HB-003).';
    default:
      return 'The section follows the documentation template (MRM-STD-021) and is under version control.';
  }
}

export function buildGenericScenario(model: Model, component: Component, key: string): Scenario {
  const fam = FAMILY[model.model_family];
  const base = genericRequirements(model, component);
  const lowIdx = Math.max(0, base.findIndex((r) => r.category === 'data' || r.check_type !== 'ai'));
  const others = base.map((_, i) => i).filter((i) => i !== lowIdx);
  const [nfIdx, partIdx, gapA, gapB, diffIdx] = others;
  const requirements: Requirement[] = base.map((r, i) => (i === lowIdx ? { ...r, check_type: 'ai+script' } : r));
  const doc = pickDocument(model, component);
  const docId = doc.id;
  const evidenceName = fam.evidenceFile(model);
  const heading = (r: Requirement) => r.text.split(' ').slice(0, 6).join(' ').replace(/[.,;:]$/, '');
  const quote = (i: number) => genericQuote(requirements[i]);
  const cite = (i: number): Citation[] => [{ doc: docId, version: FINAL_VERSION, section: sectionId(i), quote: quote(i) }];

  // Documents
  const purpose: DocSection = {
    section: '1',
    heading: 'Purpose and scope',
    text: `This document describes ${model.name} (${COMPONENT_LABEL[component]}). Purpose: ${model.purpose}. Methodology: ${model.methodology}. It follows the documentation template of MRM-STD-021 and is approved by the model owner (${model.owner_1lod}).`,
  };
  const finalSections: DocSection[] = [purpose];
  requirements.forEach((r, i) => {
    if (i === nfIdx) return;
    finalSections.push({ section: sectionId(i), heading: heading(r), text: `${quote(i)}. ${detailFor(r, model)}` });
  });
  const draftSections = finalSections.map((s) =>
    s.section === sectionId(gapA) || s.section === sectionId(gapB) ? { ...s, text: `${s.heading}: to be completed before approval.` } : s,
  );

  // 1st line AI results
  const rnd = seeded(`${model.id}:${component}:rows`);
  const rows1lod: Record<string, AssessmentRow> = {};
  requirements.forEach((r, i) => {
    if (i === lowIdx) {
      rows1lod[r.id] = row(r.id, 'compliant', cite(i),
        factors({ verifiability: 'bad' }, { verifiability: `Code repository ${fam.repo(model)} is not linked to this run; the ${fam.scriptLabel} cannot be confirmed.` }),
        'The documentation meets the requirement. Confidence is lowered because only the documentation was assessed.',
        { type: 'verification', text: `Link repository ${fam.repo(model)} and run script check ${fam.scriptId} (${fam.scriptLabel}).` });
    } else if (i === nfIdx) {
      rows1lod[r.id] = row(r.id, 'not_found', [],
        factors({ match: 'bad', coverage: 'bad', location: 'bad' }, { match: 'No passage in the assessed document addresses this requirement.' }),
        `The assessed document does not address this requirement. The evidence is expected in “${evidenceName}”.`,
        { type: 'verification', text: `Upload “${evidenceName}” or add the missing analysis to the document.` });
    } else if (i === partIdx) {
      rows1lod[r.id] = row(r.id, 'partial', cite(i),
        factors({ coverage: 'weak' }, { coverage: 'Some sub-elements of the requirement are not addressed.' }),
        `§${sectionId(i)} addresses the requirement in part; not all sub-elements are covered.`,
        { type: 'remediation', text: `Extend §${sectionId(i)} to cover all sub-elements of ${r.id} (${r.article}).` });
    } else {
      const x = rnd();
      const forced = i === gapA || i === gapB || i === diffIdx;
      if (forced || x < 0.8) {
        rows1lod[r.id] = row(r.id, 'compliant', cite(i), factors({}, { verifiability: 'Documentation only.' }), `The documentation addresses the requirement explicitly in §${sectionId(i)}.`, null);
      } else if (x < 0.95) {
        rows1lod[r.id] = row(r.id, 'partial', cite(i), factors({ coverage: 'weak' }, { coverage: 'Some sub-elements are not addressed.' }),
          `§${sectionId(i)} addresses the requirement in part.`, { type: 'remediation', text: `Complete §${sectionId(i)} for ${r.id}.` });
      } else {
        rows1lod[r.id] = row(r.id, 'non_compliant', cite(i), factors({ coverage: 'weak' }, { coverage: 'The documented approach deviates from the requirement.' }),
          `§${sectionId(i)} describes an approach that does not meet ${r.article}.`,
          { type: 'remediation', text: `Revise the approach in §${sectionId(i)} to meet ${r.article}, or document a justified deviation.` });
      }
    }
  });

  // Evidence file that resolves the not-found row
  const nfReq = requirements[nfIdx];
  const evDoc = {
    id: `${docId}-SUPP`,
    version: '1.0',
    title: evidenceName.replace(/\.pdf$/, ''),
    sections: [{ section: '1', heading: fam.evidenceHeading, text: `${genericQuote(nfReq)}. The analysis is approved by the model owner and referenced from the model documentation.` }],
  };
  const evCite: Citation = { doc: evDoc.id, version: '1.0', section: '1', quote: genericQuote(nfReq) };
  const evidenceFiles: EvidenceFile[] = [
    {
      name: evidenceName,
      sizeKb: 412,
      doc: evDoc,
      resolves: {
        [nfReq.id]: row(nfReq.id, 'compliant', [evCite], factors({ location: 'weak' }, { location: `Evidence in “${evDoc.title}”, not in the assessed document.` }),
          'The supplementary document addresses the requirement.', null),
      },
    },
  ];

  // Draft gaps
  const draftGaps: DraftGap[] = [gapA, gapB].map((i) => ({
    requirementId: requirements[i].id,
    section: sectionId(i),
    rationale: `§${sectionId(i)} is not yet written in the draft, so the requirement is not addressed.`,
    mitigation: `Complete §${sectionId(i)} to address ${requirements[i].id} (${requirements[i].article}).`,
    generated: { requirementId: requirements[i].id, section: sectionId(i), text: finalSections.find((s) => s.section === sectionId(i))!.text, sources: [fam.repo(model), 'dq_report_v2'] },
  }));

  // 2nd line plan and retrievable passages
  const plan2lod: Record<string, Plan2lod> = {};
  const passages: Record<string, Citation[]> = {};
  requirements.forEach((r, i) => {
    passages[r.id] = i === nfIdx ? [evCite] : cite(i);
    const lod = rows1lod[r.id];
    if (i === lowIdx) {
      plan2lod[r.id] = {
        verdict: 'non_compliant',
        rationale: `The documentation meets the requirement, but script ${fam.scriptId} shows the implementation deviates: ${fam.scriptFailDetail}.`,
        script: { id: fam.scriptId, result: 'fail', detail: fam.scriptFailDetail },
        mitigation: { type: 'remediation', text: `Align the implementation with the documentation (${fam.scriptLabel}) and quantify the impact on model outcomes.` },
      };
    } else if (i === nfIdx) {
      plan2lod[r.id] = { verdict: 'compliant', rationale: 'The supplementary document addresses the requirement.', script: null, mitigation: null };
    } else if (i === diffIdx) {
      plan2lod[r.id] = {
        verdict: 'partial',
        rationale: `The documented analysis does not demonstrate all sub-elements required by ${r.article}; testing under MV-HB-003 indicates a gap.`,
        script: null,
        mitigation: { type: 'remediation', text: `Add the missing analysis for ${r.id} and evidence it against ${r.article}.` },
      };
    } else {
      plan2lod[r.id] = { verdict: lod.verdict, rationale: lod.verdict === 'compliant' ? 'Consistent with the evidence.' : lod.rationale, script: null, mitigation: lod.mitigation };
    }
  });
  const purposeQuote = `This document describes ${model.name}`;
  const validationLayer: Requirement[] = [
    { id: 'VAL-01', text: 'Validation independently replicates the model data and results from source.', source_doc: 'INT-VAL-GEN', article: 'MV-STD-001 §5.1', category: 'validation', check_type: 'script', applicability_rationale: `Tier ${model.tier} model – replication required.`, layer: '2lod' },
    { id: 'VAL-02', text: `The implemented ${fam.scriptLabel} match the documented methodology.`, source_doc: 'INT-VAL-GEN', article: 'MV-STD-001 §5.3', category: 'validation', check_type: 'script', applicability_rationale: 'Code-versus-documentation check is mandatory.', layer: '2lod' },
    { id: 'VAL-03', text: 'Performance and representativeness are tested against the thresholds of the Validation Testing Handbook.', source_doc: 'INT-VAL-TEST', article: 'MV-HB-003 §6', category: 'validation', check_type: 'ai+script', applicability_rationale: 'Testing handbook applies to all models.', layer: '2lod' },
  ];
  plan2lod['VAL-01'] = { verdict: 'compliant', rationale: `Replication successful: ${fam.replicationDetail}.`, script: { id: 'VR-01', result: 'pass', detail: fam.replicationDetail }, mitigation: null };
  plan2lod['VAL-02'] = { verdict: 'non_compliant', rationale: `Implementation differs from documentation: ${fam.scriptFailDetail}.`, script: { id: fam.scriptId, result: 'fail', detail: fam.scriptFailDetail }, mitigation: plan2lod[requirements[lowIdx].id].mitigation };
  plan2lod['VAL-03'] = { verdict: 'partial', rationale: 'Performance tests pass; the representativeness comparison on outcome levels is missing.', script: null, mitigation: { type: 'remediation', text: 'Add an outcome-level representativeness comparison per segment (MV-HB-003 §6).' } };
  passages['VAL-01'] = [{ doc: docId, version: FINAL_VERSION, section: '1', quote: purposeQuote }];
  passages['VAL-02'] = cite(lowIdx);
  passages['VAL-03'] = cite(partIdx);

  // Finding templates
  const low = requirements[lowIdx];
  const diff = requirements[diffIdx];
  const part = requirements[partIdx];
  const high: FindingTemplate = {
    requirementRefs: [low.id, 'VAL-02'], severity: 'high', title: fam.findingTitle,
    observation: `The documentation (§${sectionId(lowIdx)}) states the approved approach; script ${fam.scriptId} shows ${fam.scriptFailDetail}.`,
    impact: fam.findingImpact, challenge: fam.findingChallenge, deadline: '2027-10-31',
  };
  const findingTemplates: Record<string, FindingTemplate> = {
    [low.id]: high,
    'VAL-02': high,
    [diff.id]: {
      requirementRefs: [diff.id], severity: 'medium', title: `${diff.text.replace(/\.$/, '')} — not fully demonstrated`,
      observation: plan2lod[diff.id].rationale, impact: 'Compliance with the requirement cannot be confirmed.',
      challenge: `Please provide the analysis that demonstrates ${diff.article}.`, deadline: '2027-12-31',
    },
    [part.id]: {
      requirementRefs: [part.id], severity: 'low', title: `${part.text.replace(/\.$/, '')} — partially addressed`,
      observation: rows1lod[part.id].rationale, impact: 'Limited.', challenge: rows1lod[part.id].mitigation?.text ?? 'Complete the analysis.', deadline: '2028-03-31',
    },
  };

  // Scripted decisions (presenter fast-forward and seeded history)
  const scriptedDecisions: Record<string, SeedDecision> = {};
  requirements.forEach((r, i) => {
    if (i === lowIdx) scriptedDecisions[r.id] = { decision: 'accepted', reason: 'Documentation matches the requirement; the code check is outside the documentation scope.' };
    else if (i === nfIdx) scriptedDecisions[r.id] = { decision: 'edited', final_verdict: 'compliant', reason: `Evidenced in “${evidenceName}”.` };
    else if (rows1lod[r.id].verdict !== 'compliant') scriptedDecisions[r.id] = { decision: 'accepted', reason: 'Remediation planned in the next document version.' };
    else scriptedDecisions[r.id] = { decision: 'accepted' };
  });

  // Not applicable
  const naDocs = DOCUMENTS.filter((d) => !docApplies(model, d) && d.extraction_priority === 'high').slice(0, 7);
  const notApplicable: NotApplicableReq[] = naDocs.map((d) => ({
    id: `NA-${d.id}`,
    text: `${cap(d.key_topics[0].replace(/\s*\(.*?\)\s*/g, ' ').trim())} is addressed as required by ${d.reference}.`,
    source_doc: d.id, article: d.reference, category: 'methodology', check_type: 'ai', applicability_rationale: '', layer: 'shared',
    why_not: d.applicability.any.length
      ? `Applies to models with ${d.applicability.any.join(' or ')}; this model has none of these characteristics.`
      : `Applies only to models with ${d.applicability.all.join(' and ')}.`,
  }));

  const applicabilityConfidence = Object.fromEntries(requirements.map((r) => [r.id, genericApplicabilityConfidence(model.id, r.id)]));

  return {
    key, modelId: model.id, component, pilot: false, requirements, notApplicable, applicabilityConfidence,
    document: { id: docId, title: doc.title, draftVersion: DRAFT_VERSION, finalVersion: FINAL_VERSION, versions: { [DRAFT_VERSION]: draftSections, [FINAL_VERSION]: finalSections } },
    rows1lod, scriptedDecisions, draftGaps, evidenceFiles, validationLayer, plan2lod, passages, findingTemplates,
  };
}
