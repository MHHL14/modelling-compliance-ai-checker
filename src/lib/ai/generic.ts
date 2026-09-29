// Deterministic generation for non-pilot models (spec 9.4). Seeded by model ID + requirement ID.
import { applicableDocs } from '../applicability';
import { deriveConfidence, factors } from '../confidence';
import { seeded } from '../rng';
import type { AssessmentRow, LibraryDocument, Model, PackageDocument, Requirement, Verdict } from '../types';

export type Component = 'rds' | 'mdd' | 'full';

export const COMPONENT_LABEL: Record<Component, string> = {
  rds: 'RDS documentation',
  mdd: 'Methodology (MDD)',
  full: 'Full model',
};

function categoryFor(topic: string): Requirement['category'] {
  const t = topic.toLowerCase();
  if (/(data|lineage|quality|representativ|default|record|bcbs)/.test(t)) return 'data';
  if (/(validation|back-?test|benchmark|monitor)/.test(t)) return 'validation';
  if (/(document|template|report)/.test(t)) return 'documentation';
  if (/(governance|approval|committee|roles|inventory|tiering|oversight|outsourc|third)/.test(t)) return 'governance';
  return 'methodology';
}

const clean = (t: string) => t.replace(/\s*\(.*?\)\s*/g, ' ').trim();

function reqText(topic: string, doc: LibraryDocument): string {
  const tp = clean(topic);
  const cap = tp.charAt(0).toUpperCase() + tp.slice(1);
  const cat = categoryFor(topic);
  switch (cat) {
    case 'data':
      return `${cap} is documented for the model data and meets the expectations of ${doc.reference}.`;
    case 'validation':
      return `${cap} is performed and its results are documented with thresholds and follow-up actions.`;
    case 'documentation':
      return `${cap} is complete, version-controlled and consistent with ${doc.reference}.`;
    case 'governance':
      return `${cap} is defined and evidenced (roles, approvals and dates recorded).`;
    default:
      return `The model documentation addresses ${tp.toLowerCase()} as required by ${doc.reference}.`;
  }
}

const COMPONENT_CATS: Record<Component, Requirement['category'][]> = {
  rds: ['data', 'documentation', 'governance'],
  mdd: ['methodology', 'validation', 'documentation', 'governance'],
  full: ['data', 'methodology', 'validation', 'documentation', 'governance'],
};

/** ~15 generic requirements from the model's applicable high-priority documents. */
export function genericRequirements(model: Model, component: Component = 'rds'): Requirement[] {
  const docs = applicableDocs(model);
  const ordered = [...docs.filter((d) => d.extraction_priority === 'high'), ...docs.filter((d) => d.extraction_priority === 'medium')];
  const out: Requirement[] = [];
  const num = parseInt(model.id.replace(/\D/g, ''), 10);
  const cats = COMPONENT_CATS[component];
  for (const doc of ordered) {
    const rnd = seeded(`${model.id}:${doc.id}`);
    const topics = doc.key_topics.filter((t) => cats.includes(categoryFor(t)));
    const pick = topics.length ? topics : doc.key_topics;
    const take = Math.min(pick.length, rnd() > 0.5 ? 2 : 1);
    for (let i = 0; i < take && out.length < 15; i++) {
      const topic = pick[i];
      out.push({
        id: `G${String(num).padStart(2, '0')}-${String(out.length + 1).padStart(2, '0')}`,
        text: reqText(topic, doc),
        source_doc: doc.id,
        article: `${doc.reference}${/\(.*\)/.test(topic) ? ` ${topic.match(/\((.*)\)/)?.[1] ?? ''}` : ''}`.trim(),
        category: categoryFor(topic),
        check_type: /(data|default|replicat|threshold)/i.test(topic) && rnd() > 0.6 ? 'ai+script' : 'ai',
        applicability_rationale: `${doc.title.split('–')[0].trim()} applies (${doc.binding_level.replace(/_/g, ' ')}); topic “${clean(topic)}”.`,
        layer: 'shared',
        origin: 'library',
      });
    }
    if (out.length >= 15) break;
  }
  return out;
}

export function genericApplicabilityConfidence(modelId: string, reqId: string) {
  const r = seeded(`${modelId}:${reqId}:app`)();
  return Math.round((0.66 + r * 0.32) * 100) / 100;
}

export function genericEvidenceDocId(model: Model) {
  return model.evidence_documents[0]?.id ?? `EVD-${model.id.slice(4)}-DOC`;
}

function sectionFor(i: number) {
  return `${Math.floor(i / 3) + 2}.${(i % 3) + 1}`;
}

/** Deterministic pseudo-random assessment (~70/15/8/7). */
export function genericRow(model: Model, req: Requirement, index: number, salt = ''): AssessmentRow {
  const rnd = seeded(`${model.id}:${req.id}${salt}`);
  const r = rnd();
  const docId = genericEvidenceDocId(model);
  const section = sectionFor(index);
  const quote = genericQuote(req);
  let verdict: Verdict;
  if (r < 0.7) verdict = 'compliant';
  else if (r < 0.85) verdict = 'partial';
  else if (r < 0.93) verdict = 'not_found';
  else verdict = 'non_compliant';

  if (verdict === 'compliant') {
    const cf = factors({}, { verifiability: 'Documentation only.' });
    return {
      requirementId: req.id, verdict, citations: [{ doc: docId, version: '1.0', section, quote }],
      confidenceFactors: cf, confidence: deriveConfidence(cf),
      rationale: `The documentation addresses the requirement explicitly in §${section}.`, mitigation: null, script: null,
    };
  }
  if (verdict === 'partial') {
    const cf = factors({ coverage: 'weak' }, { coverage: 'Some sub-elements of the requirement are not addressed.' });
    return {
      requirementId: req.id, verdict, citations: [{ doc: docId, version: '1.0', section, quote }],
      confidenceFactors: cf, confidence: deriveConfidence(cf),
      rationale: `§${section} addresses the requirement in part; not all sub-elements are covered.`,
      mitigation: { type: 'remediation', text: `Extend §${section} to cover the missing sub-elements of ${req.id}.` }, script: null,
    };
  }
  if (verdict === 'not_found') {
    const cf = factors({ match: 'bad', coverage: 'bad', location: 'bad' }, { match: 'No passage found in the linked documents.' });
    return {
      requirementId: req.id, verdict, citations: [], confidenceFactors: cf, confidence: deriveConfidence(cf),
      rationale: 'No passage addressing this requirement was retrieved. Evidence may sit in another document.',
      mitigation: { type: 'verification', text: 'Identify the document that evidences this requirement and link it to the run.' }, script: null,
    };
  }
  const cf = factors({ coverage: 'weak' }, { coverage: 'The documented approach deviates from the requirement.' });
  return {
    requirementId: req.id, verdict, citations: [{ doc: docId, version: '1.0', section, quote }],
    confidenceFactors: cf, confidence: deriveConfidence(cf),
    rationale: `§${section} describes an approach that does not meet the requirement.`,
    mitigation: { type: 'remediation', text: `Revise the approach in §${section} to meet ${req.article}, or document a justified deviation.` }, script: null,
  };
}

export function genericQuote(req: Requirement) {
  const core = req.text.replace(/ is (documented|performed|complete|defined).*$/i, '').replace(/^The model documentation addresses /, '');
  return `${core.charAt(0).toUpperCase()}${core.slice(1).replace(/\.$/, '')} is described in this section`;
}

/** Generic evidence document built so that citations resolve in the viewer. */
export function genericEvidenceDoc(model: Model, reqs: Requirement[]): PackageDocument & { title: string } {
  const title = model.evidence_documents[0]?.title ?? `${model.name} – model documentation`;
  return {
    id: genericEvidenceDocId(model),
    version: '1.0',
    title,
    sections: [
      { section: '1', heading: 'Purpose and scope', text: `This document describes ${model.name}. Purpose: ${model.purpose}. Methodology: ${model.methodology}.` },
      ...reqs.map((r, i) => ({
        section: sectionFor(i),
        heading: r.text.split(' ').slice(0, 5).join(' ').replace(/[.,]$/, ''),
        text: `${genericQuote(r)}. The approach follows ${r.article} and is reviewed annually by the model owner (${model.owner_1lod}).`,
      })),
    ],
  };
}
