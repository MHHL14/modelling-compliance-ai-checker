import { COMPONENT_LABEL } from '../ai/generic';
import { manifest, seal } from '../packages';
import { getModel, LIBRARY_BASE_VERSION, PERSONAS, requirementSetIdFor } from '../seed';
import type { AssessmentRow, AssessmentRun, Finding, Requirement, SubmissionPackage, Upload } from '../types';
import { assess1lod, assess2lod, getScenario, scriptedDecision } from './engine';
import type { Component, Scenario } from './types';

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

export function historicScenario(spec: HistorySpec): Scenario {
  return getScenario(spec.modelId, spec.component);
}

export function buildHistoricCase(spec: HistorySpec) {
  const sc = historicScenario(spec);
  const evidenceNames = sc.evidenceFiles.map((f) => f.name);
  const by = PERSONAS['1lod'].name;
  const rows: AssessmentRow[] = sc.requirements.map((r) => {
    const row = assess1lod(sc, r, evidenceNames);
    return { ...row, decision: { ...scriptedDecision(sc, row), by, at: spec.decidedAt } };
  });
  const run: AssessmentRun = {
    id: `RUN-1L-${spec.modelId.slice(4)}${spec.runAt.slice(2, 4)}`,
    line: '1lod', modelId: spec.modelId, requirementSetId: requirementSetIdFor(spec.modelId), libraryVersion: LIBRARY_BASE_VERSION,
    documentVersions: { [sc.document.id]: sc.document.finalVersion, ...Object.fromEntries(sc.evidenceFiles.map((f) => [f.doc.id, f.doc.version])) },
    startedAt: spec.runAt, provider: 'simulated',
    inputsSummary: `${1 + sc.evidenceFiles.length} document(s), ${rows.length} requirements, library v${LIBRARY_BASE_VERSION}.`, rows,
  };
  const uploads: Upload[] = sc.evidenceFiles.map((f, i) => ({ id: `UPL-H${i}`, name: f.name, size: f.sizeKb * 1024, kind: 'evidence', uploadedAt: spec.runAt, mime: 'application/pdf' }));
  const findings = spec.status === 'completed' ? historicFindings(spec) : [];
  return { sc, run, uploads, findings };
}

export async function historicPackage(spec: HistorySpec): Promise<SubmissionPackage> {
  const { sc, run, uploads } = buildHistoricCase(spec);
  return buildSubmissionPackage({
    modelId: spec.modelId, component: spec.component, tags: getModel(spec.modelId)!.tags, reqSetId: requirementSetIdFor(spec.modelId),
    requirements: sc.requirements, excluded: [], addedDocuments: [], uploads, lockedAt: spec.lockedAt, lockedBy: PERSONAS['1lod'].name,
    run, sc, packageId: spec.packageId, createdAt: spec.submittedAt,
  });
}

export async function buildSubmissionPackage(input: {
  modelId: string; component: Component; tags: string[]; reqSetId: string; requirements: Requirement[];
  excluded: { id: string; reason: string }[]; addedDocuments: { docId: string; reason: string }[]; uploads: Upload[];
  lockedAt?: string; lockedBy?: string; run: AssessmentRun; sc: Scenario; evidenceDocIds?: string[]; packageId: string; createdAt?: string;
}): Promise<SubmissionPackage> {
  const { sc } = input;
  const evidence = sc.evidenceFiles.filter((f) => !input.evidenceDocIds || input.evidenceDocIds.includes(f.doc.id)).filter((f) => input.uploads.some((u) => u.name === f.name));
  return seal<SubmissionPackage>({
    manifest: manifest({
      packageType: 'submission', packageId: input.packageId, modelId: input.modelId, createdAt: input.createdAt,
      createdBy: PERSONAS['1lod'].name, line: '1lod', libraryVersion: input.run.libraryVersion, requirementSetId: input.reqSetId,
      documentVersions: { [sc.document.id]: sc.document.finalVersion, ...Object.fromEntries(evidence.map((f) => [f.doc.id, f.doc.version])) },
    }),
    requirementSet: {
      id: input.reqSetId, modelId: input.modelId, component: COMPONENT_LABEL[input.component], componentKey: input.component, tags: input.tags,
      libraryVersion: input.run.libraryVersion, requirementIds: input.requirements.map((r) => r.id), excluded: input.excluded,
      addedDocuments: input.addedDocuments, uploads: input.uploads, lockedAt: input.lockedAt, lockedBy: input.lockedBy,
    },
    requirements: input.requirements,
    documents: [
      { id: sc.document.id, version: sc.document.finalVersion, title: sc.document.title, sections: sc.document.versions[sc.document.finalVersion] },
      ...evidence.map((f) => ({ id: f.doc.id, version: f.doc.version, title: f.doc.title, sections: f.doc.sections })),
    ],
    matrix1lod: input.run.rows,
    statement: 'I confirm this self-assessment reflects the model documentation as submitted.',
  });
}

export function historicFindings(spec: HistorySpec): Finding[] {
  const sc = historicScenario(spec);
  const seen = new Set<string>();
  const out: Finding[] = [];
  let n = 1;
  for (const t of Object.values(sc.findingTemplates)) {
    const k = t.requirementRefs.join('|');
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({
      id: t.id ?? `F-${String(n++).padStart(2, '0')}`, modelId: spec.modelId, snapshotId: spec.packageId, requirementRefs: t.requirementRefs,
      severity: t.severity, title: t.title, observation: t.observation, impact: t.impact, challenge: t.challenge, owner: getModel(spec.modelId)!.owner_1lod,
      deadline: t.deadline.replace('2027', spec.submittedAt.slice(0, 4)), status: 'closed', aiDrafted: true, kind: 'finding', issuedAt: spec.revealedAt,
      response: { plan: 'Remediation completed and evidenced in the updated model documentation.', evidence: [], at: spec.closedAt ?? spec.revealedAt ?? spec.submittedAt },
      closure: { note: 'Remediation verified by Model Validation.', at: spec.closedAt ?? spec.submittedAt, by: PERSONAS['2lod'].name },
    });
  }
  return out;
}

/** 2nd line blind rows for a historic review, all decided by the validator. */
export function historicBlindRows(spec: HistorySpec, pkg: SubmissionPackage): AssessmentRow[] {
  const sc = historicScenario(spec);
  return [...(pkg.requirements ?? []), ...sc.validationLayer].map((r) => ({ ...assess2lod(sc, r, pkg.documents), decision: { by: PERSONAS['2lod'].name, at: spec.blindRunAt, decision: 'accepted' as const } }));
}
