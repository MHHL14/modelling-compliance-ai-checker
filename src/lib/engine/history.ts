// Seeded history (spec §5.8) and the submission package builder, on the documentation-based engine.
import { COMPONENT_LABEL } from '../ai/generic';
import { applicableDocs } from '../applicability';
import { libReq } from '../content';
import { manifest, seal } from '../packages';
import { getModel, LIBRARY_BASE_VERSION, PERSONAS, requirementSetIdFor } from '../seed';
import type { AssessmentRow, AssessmentRun, Finding, PackageDocument, Requirement, SubmissionPackage, Upload } from '../types';
import { assess1lod, assess2lod, docsOf, finalVersionOf, findingTemplate, resolveSelection, scriptedDecision, validationLayerIds, type DocSel } from './assess';
import { deriveRequirements, MANDATORY_SOURCES, type Component } from './sources';

export interface HistorySpec {
  modelId: string;
  cycle: string;
  component: Component;
  status: 'active' | 'completed';
  createdAt: string;
  lockedAt: string;
  runAt: string;
  decidedAt: string;
  submittedAt: string;
  packageId: string;
  blindRunAt: string;
  revealedAt?: string;
  closedAt?: string;
  opinionAt?: string;
}

export const HISTORY: HistorySpec[] = [
  { modelId: 'MDL-07', cycle: 'Annual review 2026', component: 'full', status: 'completed', createdAt: '2026-09-01T09:10:00', lockedAt: '2026-09-08T10:05:00', runAt: '2026-09-15T14:00:00', decidedAt: '2026-09-22T16:20:00', submittedAt: '2026-09-30T11:00:00', packageId: 'SUB-MDL-07-20260930', blindRunAt: '2026-10-07T09:30:00', revealedAt: '2026-10-14T10:00:00', closedAt: '2026-12-02T15:00:00', opinionAt: '2026-11-05T14:00:00' },
  { modelId: 'MDL-02', cycle: 'Annual validation 2026', component: 'full', status: 'completed', createdAt: '2026-05-04T09:00:00', lockedAt: '2026-05-11T11:30:00', runAt: '2026-05-18T13:45:00', decidedAt: '2026-05-27T16:00:00', submittedAt: '2026-06-12T10:15:00', packageId: 'SUB-MDL-02-20260612', blindRunAt: '2026-06-19T09:00:00', revealedAt: '2026-06-26T11:00:00', closedAt: '2026-09-18T15:30:00', opinionAt: '2026-07-10T14:00:00' },
  { modelId: 'MDL-04', cycle: 'Initial validation 2027', component: 'full', status: 'active', createdAt: '2027-03-01T09:00:00', lockedAt: '2027-03-15T10:00:00', runAt: '2027-03-29T14:00:00', decidedAt: '2027-04-19T16:00:00', submittedAt: '2027-04-22T11:05:00', packageId: 'SUB-MDL-04-20270422', blindRunAt: '2027-05-06T08:55:00' },
];

export const caseIdFor = (modelId: string, cycle: string) => `UC-${modelId}-${cycle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')}`;

/** The sources a model developer would typically select for this model (used for the seeded history). */
export function typicalSources(modelId: string): string[] {
  const m = getModel(modelId)!;
  return [...new Set([...MANDATORY_SOURCES, ...applicableDocs(m).filter((d) => d.type !== 'validation_standard' && d.binding_level !== 'reference').map((d) => d.id)])];
}

export function allFinalSelection(modelId: string, asOf?: string): DocSel[] {
  const docs = docsOf(modelId)?.documents ?? [];
  const dated = asOf ? docs.filter((d) => finalVersionOf(d).date <= asOf.slice(0, 10)) : docs;
  return (dated.length ? dated : docs).map((d) => ({ modelId, docId: d.id, version: finalVersionOf(d).version }));
}

export function buildHistoricCase(spec: HistorySpec) {
  const m = getModel(spec.modelId)!;
  const sources = typicalSources(spec.modelId);
  const { applicable } = deriveRequirements({ model: m, tags: m.tags, component: spec.component, sources, libraryVersion: LIBRARY_BASE_VERSION });
  const selection = allFinalSelection(spec.modelId, spec.runAt);
  const ctx = { modelId: spec.modelId, docs: resolveSelection(selection) };
  const by = PERSONAS['1lod'].name;
  const rows: AssessmentRow[] = applicable.map((r) => {
    const row = assess1lod(ctx, r);
    return { ...row, decision: { ...scriptedDecision(spec.modelId, row), by, at: spec.decidedAt } };
  });
  const run: AssessmentRun = {
    id: `RUN-1L-${spec.modelId.slice(4)}${spec.runAt.slice(2, 4)}`,
    line: '1lod', modelId: spec.modelId, requirementSetId: requirementSetIdFor(spec.modelId), libraryVersion: LIBRARY_BASE_VERSION,
    documentVersions: Object.fromEntries(selection.map((s) => [s.docId, s.version])), startedAt: spec.runAt, provider: 'simulated',
    inputsSummary: `${selection.length} document(s), ${rows.length} requirements, library v${LIBRARY_BASE_VERSION}.`, rows,
  };
  return { sources, requirements: applicable as Requirement[], selection, run, findings: spec.status === 'completed' ? historicFindings(spec, rows) : [] };
}

export async function historicPackage(spec: HistorySpec): Promise<SubmissionPackage> {
  const h = buildHistoricCase(spec);
  return buildSubmissionPackage({
    modelId: spec.modelId, component: spec.component, tags: getModel(spec.modelId)!.tags, sources: h.sources, reqSetId: requirementSetIdFor(spec.modelId),
    requirements: h.requirements, excluded: [], uploads: [], lockedAt: spec.lockedAt, lockedBy: PERSONAS['1lod'].name, run: h.run,
    documents: resolvedToPackage(h.selection, []), packageId: spec.packageId, createdAt: spec.submittedAt,
  });
}

export function resolvedToPackage(selection: DocSel[], uploads: (PackageDocument & { title: string; uploadName: string })[]): PackageDocument[] {
  return resolveSelection(selection, uploads).map((d) => ({ id: d.id, version: d.version, title: d.title, sections: d.sections.map((s) => ({ section: s.section, heading: s.heading, text: s.text })) }));
}

export async function buildSubmissionPackage(input: {
  modelId: string; component: Component; tags: string[]; sources: string[]; reqSetId: string; requirements: Requirement[];
  excluded: { id: string; reason: string }[]; uploads: Upload[]; lockedAt?: string; lockedBy?: string; run: AssessmentRun;
  documents: PackageDocument[]; packageId: string; createdAt?: string;
}): Promise<SubmissionPackage> {
  return seal<SubmissionPackage>({
    manifest: manifest({
      packageType: 'submission', packageId: input.packageId, modelId: input.modelId, createdAt: input.createdAt, createdBy: PERSONAS['1lod'].name,
      line: '1lod', libraryVersion: input.run.libraryVersion, requirementSetId: input.reqSetId,
      documentVersions: Object.fromEntries(input.documents.map((d) => [d.id, d.version])),
    }),
    requirementSet: {
      id: input.reqSetId, modelId: input.modelId, component: COMPONENT_LABEL[input.component], componentKey: input.component, tags: input.tags,
      libraryVersion: input.run.libraryVersion, requirementIds: input.requirements.map((r) => r.id), excluded: input.excluded,
      addedDocuments: input.sources.map((docId) => ({ docId, reason: 'Selected requirement source' })), uploads: input.uploads, lockedAt: input.lockedAt, lockedBy: input.lockedBy,
    },
    requirements: input.requirements,
    documents: input.documents,
    matrix1lod: input.run.rows,
    statement: 'I confirm this self-assessment reflects the model documentation as submitted.',
  });
}

export function historicFindings(spec: HistorySpec, rows: AssessmentRow[] = []): Finding[] {
  const md = docsOf(spec.modelId);
  const refs = [...new Set([...(md?.codeFacts.filter((c) => c.result === 'fail').flatMap((c) => c.reqs.slice(0, 1)) ?? []), ...(md?.deficiencies.map((d) => d.req) ?? [])])];
  const out: Finding[] = [];
  const seen = new Set<string>();
  let n = 1;
  for (const r of refs) {
    const t = findingTemplate(spec.modelId, r);
    if (!t || seen.has(t.requirementRefs.join('|'))) continue;
    seen.add(t.requirementRefs.join('|'));
    out.push({
      id: t.id ?? `F-${String(n++).padStart(2, '0')}`, modelId: spec.modelId, snapshotId: spec.packageId, requirementRefs: t.requirementRefs, severity: t.severity,
      title: t.title, observation: t.observation, impact: t.impact, challenge: t.challenge, owner: getModel(spec.modelId)!.owner_1lod,
      deadline: t.deadline.replace('2027', spec.submittedAt.slice(0, 4)), status: 'closed', aiDrafted: true, kind: 'finding', issuedAt: spec.revealedAt,
      response: { plan: 'Remediation completed and evidenced in the updated model documentation.', evidence: [], at: spec.closedAt ?? spec.submittedAt },
      closure: { note: 'Remediation verified by Model Validation.', at: spec.closedAt ?? spec.submittedAt, by: PERSONAS['2lod'].name },
    });
    if (out.length >= 4) break;
  }
  void rows;
  return out;
}

/** Validation-layer requirements for a model (library records). */
export function validationLayerFor(modelId: string): Requirement[] {
  return validationLayerIds(modelId).map((id) => libReq(id)).filter((r): r is NonNullable<typeof r> => !!r);
}

export function historicBlindRows(spec: HistorySpec, pkg: SubmissionPackage): AssessmentRow[] {
  return [...(pkg.requirements ?? []), ...validationLayerFor(spec.modelId)].map((r) => ({
    ...assess2lod(spec.modelId, r, pkg.documents),
    decision: { by: PERSONAS['2lod'].name, at: spec.blindRunAt, decision: 'accepted' as const },
  }));
}
