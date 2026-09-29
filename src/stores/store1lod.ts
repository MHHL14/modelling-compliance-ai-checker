'use client';
// 1st line store, keyed by use case. Never imported by 2nd line pages; data crosses only via package files.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { COMPONENT_LABEL } from '@/lib/ai/generic';
import { nowISO } from '@/lib/clock';
import { packageId as newPackageId } from '@/lib/packages';
import { uid } from '@/lib/rng';
import { affectedBy, assess1lod, evidenceDocFor, getScenario, runDraftCheck, scriptedDecision } from '@/lib/scenario/engine';
import { buildHistoricCase, buildSubmissionPackage, caseIdFor, HISTORY, historicPackage } from '@/lib/scenario/history';
import type { Component, DraftResult, Scenario } from '@/lib/scenario/types';
import { getModel, LIBRARY_BASE_VERSION, PERSONAS, requirementSetIdFor } from '@/lib/seed';
import type { AssessmentRow, AssessmentRun, Finding, Model, PackageDocument, Requirement, RowDecision, SubmissionPackage, Upload, Verdict } from '@/lib/types';
import { logAudit } from './storeAudit';

const ME = PERSONAS['1lod'].name;

export type ReqStatus = 'proposed' | 'accepted' | 'excluded';

export interface CaseAttributes {
  portfolio: string;
  purpose: string;
  methodology: string;
  model_family: Model['model_family'];
  regulatory_use: string;
  tier: 1 | 2 | 3;
  tags: string[];
}

export interface EvidenceDoc extends PackageDocument {
  title: string;
  uploadName: string;
}

export interface UseCase {
  caseId: string;
  modelId: string;
  cycle: string;
  component: Component;
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  attributes: CaseAttributes;
  reqSetId: string;
  setVersion: number;
  generatedAt?: string;
  reqStatus: Record<string, ReqStatus>;
  excludedReasons: Record<string, string>;
  addedDocuments: { docId: string; reason: string; at: string }[];
  uploads: Upload[];
  modelSpecific: Requirement[];
  proposedToLibrary: string[];
  lockedAt?: string;
  lockedBy?: string;
  draftVersion?: string;
  aiBlocks: Record<string, Record<string, string[]>>;
  draftCheck?: { version: string; at: string; results: DraftResult[] };
  run?: AssessmentRun;
  evidenceDocs: EvidenceDoc[];
  changedRows: string[];
  submission?: { packageId: string; sha256: string; at: string; fileName: string; packageJson: string };
  findings: Finding[];
  importedFindingPackages: { packageId: string; sha256: string; at: string; createdBy: string; createdAt: string; opinionSummary?: string }[];
  responseExports: { packageId: string; sha256: string; at: string }[];
}

// ---------------------------------------------------------------------------
export const caseScenario = (c: Pick<UseCase, 'modelId' | 'component' | 'attributes'>): Scenario => getScenario(c.modelId, c.component, c.attributes.tags);

export function proposalRequirements(c: UseCase): Requirement[] {
  return c.generatedAt ? caseScenario(c).requirements : [];
}
export function setRequirements(c: UseCase): Requirement[] {
  return [...proposalRequirements(c).filter((r) => c.reqStatus[r.id] === 'accepted'), ...c.modelSpecific];
}
export function allCaseRequirements(c: UseCase): Requirement[] {
  return [...proposalRequirements(c), ...c.modelSpecific];
}
export function finalVerdict(row: AssessmentRow): Verdict {
  if ((row.decision?.decision === 'edited' || row.decision?.decision === 'rejected') && row.decision.finalVerdict) return row.decision.finalVerdict;
  return row.verdict;
}
export function attributesFromModel(m: Model): CaseAttributes {
  return { portfolio: m.portfolio, purpose: m.purpose, methodology: m.methodology, model_family: m.model_family, regulatory_use: m.regulatory_use, tier: m.tier, tags: [...m.tags] };
}

function emptyCase(p: { modelId: string; cycle: string; component: Component; attributes: CaseAttributes; at: string }): UseCase {
  return {
    caseId: caseIdFor(p.modelId, p.cycle), modelId: p.modelId, cycle: p.cycle, component: p.component, status: 'active',
    createdAt: p.at, updatedAt: p.at, attributes: p.attributes, reqSetId: requirementSetIdFor(p.modelId), setVersion: 1,
    reqStatus: {}, excludedReasons: {}, addedDocuments: [], uploads: [], modelSpecific: [], proposedToLibrary: [], aiBlocks: {},
    evidenceDocs: [], changedRows: [], findings: [], importedFindingPackages: [], responseExports: [],
  };
}

async function historicCases(): Promise<Record<string, UseCase>> {
  const out: Record<string, UseCase> = {};
  for (const spec of HISTORY) {
    const model = getModel(spec.modelId)!;
    const { sc, run, uploads, findings } = buildHistoricCase(spec);
    const pkg = await historicPackage(spec);
    const c = emptyCase({ modelId: spec.modelId, cycle: spec.cycle, component: spec.component, attributes: attributesFromModel(model), at: spec.createdAt });
    out[c.caseId] = {
      ...c,
      status: spec.status,
      updatedAt: spec.closedAt ?? spec.submittedAt,
      completedAt: spec.status === 'completed' ? spec.closedAt : undefined,
      generatedAt: spec.createdAt,
      reqStatus: Object.fromEntries(sc.requirements.map((r) => [r.id, 'accepted' as const])),
      lockedAt: spec.lockedAt,
      lockedBy: ME,
      draftVersion: sc.document.finalVersion,
      draftCheck: { version: sc.document.finalVersion, at: spec.runAt, results: runDraftCheck(sc, sc.document.finalVersion, sc.requirements, {}) },
      run,
      uploads,
      evidenceDocs: sc.evidenceFiles.map((f) => ({ ...f.doc, uploadName: f.name })),
      submission: { packageId: pkg.manifest.packageId, sha256: pkg.manifest.sha256, at: spec.submittedAt, fileName: `${pkg.manifest.packageId}.rcc.json`, packageJson: JSON.stringify(pkg) },
      findings,
      importedFindingPackages: spec.status === 'completed' ? [{ packageId: `FND-${spec.modelId}-${spec.revealedAt!.slice(0, 10).replace(/-/g, '')}`, sha256: '', at: spec.revealedAt!, createdBy: PERSONAS['2lod'].name, createdAt: spec.revealedAt! }] : [],
      responseExports: spec.status === 'completed' ? [{ packageId: `RSP-${spec.modelId}-${spec.closedAt!.slice(0, 10).replace(/-/g, '')}`, sha256: '', at: spec.closedAt! }] : [],
    };
  }
  return out;
}

// ---------------------------------------------------------------------------
interface State1 {
  seeded: boolean;
  cases: Record<string, UseCase>;
  ensureSeed: () => Promise<void>;
  patch: (caseId: string, fn: (c: UseCase) => Partial<UseCase>) => void;
  createCase: (p: { modelId: string; cycle: string; component: Component; attributes: CaseAttributes }) => string;

  generate: (caseId: string) => void;
  setReqStatus: (caseId: string, ids: string[], status: ReqStatus, reason?: string) => void;
  addDocument: (caseId: string, docId: string, reason: string) => void;
  addUpload: (caseId: string, upload: Upload) => void;
  addModelSpecific: (caseId: string, req: Requirement) => void;
  markProposed: (caseId: string, reqId: string) => void;
  lock: (caseId: string) => boolean;
  unlock: (caseId: string) => void;

  setDraftVersion: (caseId: string, v: string) => void;
  insertAiBlock: (caseId: string, version: string, section: string, text: string) => void;
  runDraftCheck: (caseId: string) => void;

  runAssessment: (caseId: string) => void;
  rerunChanged: (caseId: string) => string[];
  decide: (caseId: string, ids: string[], d: Omit<RowDecision, 'by' | 'at'>) => void;
  clearDecision: (caseId: string, reqId: string) => void;
  uploadEvidence: (caseId: string, upload: Upload, textContent?: string, reassessNow?: boolean) => string[];
  fastForward: (caseId: string) => number;

  buildSubmission: (caseId: string) => Promise<SubmissionPackage>;
  recordSubmission: (caseId: string, s: NonNullable<UseCase['submission']>) => void;
  importFindings: (caseId: string, pkg: { packageId: string; sha256: string; createdBy: string; createdAt: string; opinionSummary?: string }, findings: Finding[]) => number;
  saveResponse: (caseId: string, findingId: string, plan: string, evidence: Upload[]) => void;
  recordResponseExport: (caseId: string, packageId: string, sha256: string, findingIds: string[]) => void;
}

let seeding = false;

export const use1lod = create<State1>()(
  persist(
    (set, get) => {
      const patch = (caseId: string, fn: (c: UseCase) => Partial<UseCase>) =>
        set((s) => (s.cases[caseId] ? { cases: { ...s.cases, [caseId]: { ...s.cases[caseId], ...fn(s.cases[caseId]), updatedAt: nowISO() } } } : s));
      const uc = (caseId: string) => get().cases[caseId];
      const audit = (caseId: string, type: string, detail: string) => logAudit({ line: '1lod', modelId: uc(caseId)?.modelId, type, detail });

      return {
        seeded: false,
        cases: {},
        ensureSeed: async () => {
          if (get().seeded || seeding) return;
          seeding = true;
          try {
            const hist = await historicCases();
            set((s) => ({ seeded: true, cases: { ...hist, ...s.cases } }));
          } finally {
            seeding = false;
          }
        },
        patch,
        createCase: ({ modelId, cycle, component, attributes }) => {
          const existing = Object.values(get().cases).find((c) => c.modelId === modelId && c.status === 'active');
          if (existing) return existing.caseId;
          const c = emptyCase({ modelId, cycle, component, attributes, at: nowISO() });
          set((s) => ({ cases: { ...s.cases, [c.caseId]: c } }));
          audit(c.caseId, 'Use case created', `${c.caseId}: ${getModel(modelId)?.name} · ${COMPONENT_LABEL[component]} · ${cycle}.`);
          return c.caseId;
        },

        generate: (caseId) => {
          const c = uc(caseId);
          const reqs = caseScenario(c).requirements;
          patch(caseId, (x) => ({ generatedAt: nowISO(), reqStatus: Object.fromEntries(reqs.map((r) => [r.id, x.reqStatus[r.id] ?? ('proposed' as const)])) }));
          audit(caseId, 'Requirement set proposed', `AI proposed requirement set ${c.reqSetId}: ${reqs.length} requirements, all awaiting a decision.`);
        },
        setReqStatus: (caseId, ids, status, reason) => {
          patch(caseId, (c) => {
            const reqStatus = { ...c.reqStatus };
            const excludedReasons = { ...c.excludedReasons };
            for (const id of ids) {
              reqStatus[id] = status;
              if (status === 'excluded' && reason) excludedReasons[id] = reason;
              if (status !== 'excluded') delete excludedReasons[id];
            }
            return { reqStatus, excludedReasons };
          });
          audit(caseId, status === 'excluded' ? 'Requirement excluded' : status === 'accepted' ? 'Requirements accepted' : 'Requirement reset', `${ids.join(', ')}${reason ? ` — reason: ${reason}` : ''}`);
        },
        addDocument: (caseId, docId, reason) => {
          patch(caseId, (c) => ({ addedDocuments: [...c.addedDocuments.filter((d) => d.docId !== docId), { docId, reason, at: nowISO() }] }));
          audit(caseId, 'Document added', `${docId} added from library — reason: ${reason}`);
        },
        addUpload: (caseId, upload) => {
          patch(caseId, (c) => ({ uploads: [...c.uploads.filter((u) => u.name !== upload.name), upload] }));
          audit(caseId, 'Upload', `${upload.name} uploaded as ${upload.kind === 'evidence' ? 'evidence' : 'requirement source'}${upload.extractedRequirements?.length ? ` — ${upload.extractedRequirements.length} requirement(s) extracted` : ''}.`);
        },
        addModelSpecific: (caseId, req) => {
          patch(caseId, (c) => ({ modelSpecific: [...c.modelSpecific.filter((r) => r.id !== req.id), { ...req, layer: 'model_specific' }] }));
          audit(caseId, 'Model-specific requirement added', `${req.id} added: “${req.text}”`);
        },
        markProposed: (caseId, reqId) => patch(caseId, (c) => ({ proposedToLibrary: [...new Set([...c.proposedToLibrary, reqId])] })),
        lock: (caseId) => {
          const c = uc(caseId);
          if (!c || c.lockedAt || !c.generatedAt) return false;
          if (Object.values(c.reqStatus).some((s) => s === 'proposed')) return false;
          patch(caseId, () => ({ lockedAt: nowISO(), lockedBy: ME }));
          audit(caseId, 'Requirement set locked', `${c.reqSetId} v${c.setVersion} locked · library v${LIBRARY_BASE_VERSION} · ${setRequirements(uc(caseId)).length} requirements.`);
          return true;
        },
        unlock: (caseId) => {
          patch(caseId, (c) => ({ lockedAt: undefined, lockedBy: undefined, setVersion: c.setVersion + 1, run: undefined }));
          audit(caseId, 'Requirement set unlocked', `${uc(caseId).reqSetId} unlocked — new version v${uc(caseId).setVersion}.`);
        },

        setDraftVersion: (caseId, v) => patch(caseId, () => ({ draftVersion: v })),
        insertAiBlock: (caseId, version, section, text) => {
          patch(caseId, (c) => {
            const byV = { ...(c.aiBlocks[version] ?? {}) };
            byV[section] = [...(byV[section] ?? []), text];
            return { aiBlocks: { ...c.aiBlocks, [version]: byV } };
          });
          audit(caseId, 'AI-drafted text inserted', `AI-drafted paragraph inserted in draft v${version} §${section} (marked as AI-drafted).`);
        },
        runDraftCheck: (caseId) => {
          const c = uc(caseId);
          const sc = caseScenario(c);
          const version = c.draftVersion ?? sc.document.draftVersion;
          const reqs = proposalRequirements(c).filter((r) => c.reqStatus[r.id] !== 'excluded');
          const results = runDraftCheck(sc, version, reqs, c.aiBlocks[version] ?? {});
          patch(caseId, () => ({ draftVersion: version, draftCheck: { version, at: nowISO(), results } }));
          const gaps = results.filter((r) => r.status === 'gap').map((r) => r.requirementId);
          audit(caseId, 'Draft check run', `Sandbox draft check on v${version}: ${gaps.length} gap(s)${gaps.length ? ` (${gaps.join(', ')})` : ''}. No status, no sign-off.`);
        },

        runAssessment: (caseId) => {
          const c = uc(caseId);
          const sc = caseScenario(c);
          const names = c.evidenceDocs.map((d) => d.uploadName);
          const rows = setRequirements(c).map((r) => assess1lod(sc, r, names));
          const run: AssessmentRun = {
            id: uid('RUN-1L'), line: '1lod', modelId: c.modelId, requirementSetId: c.reqSetId, libraryVersion: LIBRARY_BASE_VERSION,
            documentVersions: { [sc.document.id]: sc.document.finalVersion, ...Object.fromEntries(c.evidenceDocs.map((d) => [d.id, d.version])) },
            startedAt: nowISO(), provider: 'simulated',
            inputsSummary: `${1 + c.evidenceDocs.length} document(s), ${rows.length} requirements, library v${LIBRARY_BASE_VERSION}.`, rows,
          };
          patch(caseId, () => ({ run, changedRows: [] }));
          audit(caseId, 'Assessment run', `Self-assessment run ${run.id} · ${run.requirementSetId} · ${rows.length} requirements.`);
        },
        rerunChanged: (caseId) => {
          const c = uc(caseId);
          if (!c.run) return [];
          const sc = caseScenario(c);
          const names = c.evidenceDocs.map((d) => d.uploadName);
          const changed = new Set(c.changedRows);
          const reqs = allCaseRequirements(c);
          const done: string[] = [];
          const rows = c.run.rows.map((r) => {
            if (!changed.has(r.requirementId)) return r;
            const req = reqs.find((x) => x.id === r.requirementId);
            if (!req) return r;
            const nr = assess1lod(sc, req, names);
            if (nr.verdict === r.verdict && nr.citations.length === r.citations.length) return r;
            done.push(r.requirementId);
            return { ...nr, reassessedAt: nowISO() };
          });
          patch(caseId, (x) => ({ run: x.run && { ...x.run, rows, documentVersions: { ...x.run.documentVersions, ...Object.fromEntries(x.evidenceDocs.map((d) => [d.id, d.version])) } }, changedRows: [] }));
          if (done.length) audit(caseId, 'Rows re-assessed', `Re-run of changed rows: ${done.join(', ')} (new evidence). Other rows kept their human decision.`);
          return done;
        },
        decide: (caseId, ids, d) => {
          const at = nowISO();
          patch(caseId, (c) => (c.run ? { run: { ...c.run, rows: c.run.rows.map((r) => (ids.includes(r.requirementId) ? { ...r, decision: { ...d, by: ME, at } } : r)) } } : {}));
          audit(caseId, d.decision === 'accepted' ? (ids.length > 1 ? 'Bulk accept' : 'Row accepted') : d.decision === 'edited' ? 'Row edited' : 'Row rejected', `${ids.join(', ')}${d.finalVerdict ? ` → final outcome ${d.finalVerdict.replace('_', ' ')}` : ''}${d.reason ? ` — reason: ${d.reason}` : ''}`);
        },
        clearDecision: (caseId, reqId) => {
          patch(caseId, (c) => (c.run ? { run: { ...c.run, rows: c.run.rows.map((r) => (r.requirementId === reqId ? { ...r, decision: undefined } : r)) } } : {}));
          audit(caseId, 'Decision withdrawn', `${reqId}: human decision withdrawn.`);
        },
        uploadEvidence: (caseId, upload, textContent, reassessNow) => {
          const c = uc(caseId);
          const sc = caseScenario(c);
          const doc = evidenceDocFor(sc, upload.name, textContent);
          const affected = affectedBy(sc, upload.name);
          patch(caseId, (x) => ({
            uploads: [...x.uploads.filter((u) => u.name !== upload.name), upload],
            evidenceDocs: [...x.evidenceDocs.filter((d) => d.id !== doc.id), { ...doc, uploadName: upload.name }],
            changedRows: [...new Set([...x.changedRows, ...affected])],
          }));
          audit(caseId, 'Evidence uploaded', `${upload.name} uploaded as evidence (${doc.title}, v${doc.version}); affects ${affected.length ? affected.join(', ') : 'no open rows'}.`);
          return reassessNow ? get().rerunChanged(caseId) : [];
        },
        fastForward: (caseId) => {
          const at = nowISO();
          let n = 0;
          patch(caseId, (c) => {
            if (!c.run) return {};
            const sc = caseScenario(c);
            const rows = c.run.rows.map((r) => {
              if (r.decision) return r;
              n++;
              return { ...r, decision: { ...scriptedDecision(sc, r), by: ME, at } };
            });
            return { run: { ...c.run, rows } };
          });
          audit(caseId, 'Fast-forward (demo)', `Scripted decisions applied to ${n} remaining row(s).`);
          return n;
        },

        buildSubmission: async (caseId) => {
          const c = uc(caseId);
          const sc = caseScenario(c);
          return buildSubmissionPackage({
            modelId: c.modelId, component: c.component, tags: c.attributes.tags, reqSetId: c.reqSetId, requirements: setRequirements(c),
            excluded: Object.entries(c.excludedReasons).map(([id, reason]) => ({ id, reason })),
            addedDocuments: c.addedDocuments.map((d) => ({ docId: d.docId, reason: d.reason })), uploads: c.uploads,
            lockedAt: c.lockedAt, lockedBy: c.lockedBy, run: c.run!, sc, packageId: newPackageId('submission', c.modelId),
          });
        },
        recordSubmission: (caseId, s) => {
          patch(caseId, () => ({ submission: s }));
          audit(caseId, 'Submission package exported', `${s.packageId} frozen and exported · SHA-256 ${s.sha256.slice(0, 12)}… · matrix read-only.`);
        },
        importFindings: (caseId, pkg, findings) => {
          const c = uc(caseId);
          if (c.importedFindingPackages.some((p) => p.packageId === pkg.packageId)) return 0;
          patch(caseId, (x) => {
            const byId = new Map(x.findings.map((f) => [f.id, f]));
            for (const f of findings) {
              const prev = byId.get(f.id);
              byId.set(f.id, prev?.response ? { ...f, response: prev.response, status: f.status === 'closed' ? 'closed' : prev.status } : f);
            }
            return { findings: [...byId.values()], importedFindingPackages: [...x.importedFindingPackages, { ...pkg, at: nowISO() }] };
          });
          audit(caseId, 'Findings package imported', `${pkg.packageId} imported · integrity verified · ${findings.length} issued finding(s).`);
          return findings.length;
        },
        saveResponse: (caseId, findingId, plan, evidence) => {
          patch(caseId, (c) => ({ findings: c.findings.map((f) => (f.id === findingId ? { ...f, response: { plan, evidence, at: nowISO() } } : f)) }));
          audit(caseId, 'Response drafted', `Remediation plan saved for ${findingId}${evidence.length ? ` with ${evidence.length} evidence file(s)` : ''}.`);
        },
        recordResponseExport: (caseId, packageId, sha256, findingIds) => {
          patch(caseId, (c) => ({ responseExports: [...c.responseExports, { packageId, sha256, at: nowISO() }], findings: c.findings.map((f) => (findingIds.includes(f.id) ? { ...f, status: 'response_submitted' } : f)) }));
          audit(caseId, 'Response package exported', `${packageId} exported · responses for ${findingIds.join(', ')}.`);
        },
      };
    },
    { name: 'mcw-store1lod', version: 2, storage: createJSONStorage(() => localStorage) },
  ),
);

export function useCase(caseId: string): UseCase | undefined {
  return use1lod((s) => s.cases[caseId]);
}
