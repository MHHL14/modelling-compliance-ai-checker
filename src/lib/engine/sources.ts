// Requirement sources (spec §12.2) and the AI derivation of requirements from them (§12.3).
import { libraryReqs, type ComponentKey, type LibReq } from '../content';
import { seeded } from '../rng';
import { DOCUMENTS, getDocument, PILOT, PILOT_MODEL_ID } from '../seed';
import type { LibraryDocument, Model } from '../types';

export type Component = 'rds' | 'mdd' | 'full';

/** Internal base that applies to every model; pre-selected in the wizard. */
export const MANDATORY_SOURCES = ['INT-POL-MRM', 'INT-POL-DATA', 'INT-STD-INV', 'INT-STD-DEV', 'INT-STD-DOC', 'INT-STD-DQ', 'INT-STD-EJ', 'INT-STD-IMPL'];

export const SOURCE_GROUPS: { key: string; label: string; match: (d: LibraryDocument) => boolean }[] = [
  { key: 'eu', label: 'EU and national legislation', match: (d) => ['eu_regulation', 'eu_directive', 'eu_delegated_reg', 'national_law'].includes(d.type) },
  { key: 'eba', label: 'EBA guidelines and reports', match: (d) => d.type === 'eba_guideline' || d.type === 'eba_report' },
  { key: 'sup', label: 'ECB and other supervisors', match: (d) => ['ecb_guide', 'ecb_instruction', 'supervisory_guidance'].includes(d.type) },
  { key: 'intl', label: 'Accounting and international standards', match: (d) => ['accounting_standard', 'international_standard', 'international_reference'].includes(d.type) },
  { key: 'pol', label: 'Internal policies', match: (d) => d.type === 'policy' || d.type === 'governance' },
  { key: 'std', label: 'Internal standards', match: (d) => d.type === 'standard' },
];

/** Documents the 1st line can choose as requirement sources (validation standards belong to the 2nd line). */
export const SELECTABLE_SOURCES = DOCUMENTS.filter((d) => d.type !== 'validation_standard');

export function tagMatch(tags: string[], cond?: { any?: string[]; all?: string[] }) {
  if (!cond) return true;
  const any = cond.any ?? [];
  const all = cond.all ?? [];
  return (any.length === 0 || any.some((t) => tags.includes(t))) && all.every((t) => tags.includes(t));
}

const versionNum = (v: string) => parseFloat(v);

export interface NotApplicable extends LibReq {
  why_not: string;
}

/** AI derivation: the requirements of the selected sources that apply to this model and component. */
export function deriveRequirements(p: { model: Model; tags: string[]; component: Component; sources: string[]; libraryVersion: string }) {
  const sel = new Set(p.sources);
  const comps: ComponentKey[] = p.component === 'full' ? ['rds', 'mdd'] : [p.component];
  const applicable: LibReq[] = [];
  const notApplicable: NotApplicable[] = [];
  for (const r of libraryReqs()) {
    if (!sel.has(r.docId) || r.layer === '2lod') continue;
    if (r.introduced_in && versionNum(r.introduced_in) > versionNum(p.libraryVersion)) continue;
    if (!r.components.some((c) => comps.includes(c))) continue;
    if (r.level === 'institution') notApplicable.push({ ...r, why_not: `Institution-level obligation. ${r.level_reason ?? ''}`.trim() });
    else if (tagMatch(p.tags, r.applies_if)) applicable.push(r);
    else notApplicable.push({ ...r, why_not: r.not_applicable_reason ?? 'Does not apply to this model type.' });
  }
  return { applicable, notApplicable };
}

const BASE_CONF: Record<LibraryDocument['binding_level'], [number, number]> = {
  binding_law: [0.88, 0.99],
  comply_or_explain: [0.85, 0.97],
  supervisory_expectation: [0.78, 0.95],
  internal_mandatory: [0.86, 0.99],
  reference: [0.68, 0.84],
};

/** Applicability confidence shown in scoping (deterministic). */
export function applicabilityConfidence(modelId: string, r: LibReq): number {
  if (modelId === PILOT_MODEL_ID) {
    const pilot: Record<string, number> = { 'REQ-D25': 0.74, 'REQ-D26': 0.71, 'REQ-D31': 0.69, 'REQ-G01': 0.78 };
    if (pilot[r.id]) return pilot[r.id];
  }
  const [lo, hi] = BASE_CONF[getDocument(r.docId)?.binding_level ?? 'reference'];
  const specific = (r.applies_if?.any?.length ?? 0) + (r.applies_if?.all?.length ?? 0) > 0 ? 0.02 : 0;
  return Math.min(0.99, Math.round((lo + seeded(`${modelId}:${r.id}:app`)() * (hi - lo) + specific) * 100) / 100);
}

export function whyApplicable(r: LibReq, model: Model): string {
  const doc = getDocument(r.docId);
  const cond = [...(r.applies_if?.any ?? []), ...(r.applies_if?.all ?? [])].filter((t) => model.tags.includes(t));
  const binding = doc?.binding_level.replace(/_/g, ' ') ?? '';
  if (PILOT.requirements.some((x) => x.id === r.id)) return PILOT.requirements.find((x) => x.id === r.id)!.applicability_rationale;
  return cond.length
    ? `Selected source (${binding}); applies to ${cond.map((t) => t.replace(/_/g, ' ')).join(', ')} models such as this one.`
    : `Selected source (${binding}); applies to all models in its scope.`;
}
