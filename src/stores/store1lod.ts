'use client';
// 1st line store. Never imported by 2nd line pages; data crosses only via package files.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { genericApplicabilityConfidence, genericRequirements, genericRow, type Component } from '@/lib/ai/generic';
import {
  draftCheck,
  evidenceDocFor,
  EVIDENCE_AFFECTS,
  modelSpecificRow1lod,
  PILOT_APPLICABILITY_CONFIDENCE,
  pilotReassess1lod,
  pilotRow1lod,
  RDS_ID,
  type DraftResult,
} from '@/lib/ai/pilot';
import { nowISO } from '@/lib/clock';
import { uid } from '@/lib/rng';
import { getModel, LIBRARY_BASE_VERSION, PERSONAS, PILOT, PILOT_MODEL_ID, PILOT_SHARED_REQS, requirementSetIdFor } from '@/lib/seed';
import type { AssessmentRow, AssessmentRun, Finding, PackageDocument, Requirement, RowDecision, Upload, Verdict } from '@/lib/types';
import { logAudit } from './storeAudit';

const ME = PERSONAS['1lod'].name;

export type ReqStatus = 'proposed' | 'accepted' | 'excluded';

export interface EvidenceDoc extends PackageDocument {
  title: string;
  uploadName: string;
}

export interface ModelWork {
  modelId: string;
  component: Component;
  reqSetId: string;
  setVersion: number;
  generatedAt: string;
  reqStatus: Record<string, ReqStatus>;
  excludedReasons: Record<string, string>;
  addedDocuments: { docId: string; reason: string; at: string }[];
  uploads: Upload[];
  modelSpecific: Requirement[];
  proposedToLibrary: string[];
  lockedAt?: string;
  lockedBy?: string;
  draftVersion: string;
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
export function proposalRequirements(w: Pick<ModelWork, 'modelId' | 'component'>): Requirement[] {
  const model = getModel(w.modelId);
  if (!model) return [];
  if (w.modelId === PILOT_MODEL_ID && w.component === 'rds') return PILOT_SHARED_REQS;
  return genericRequirements(model, w.component);
}

export function applicabilityConfidence(modelId: string, reqId: string, component: Component) {
  if (modelId === PILOT_MODEL_ID && component === 'rds' && PILOT_APPLICABILITY_CONFIDENCE[reqId]) return PILOT_APPLICABILITY_CONFIDENCE[reqId];
  return genericApplicabilityConfidence(modelId, reqId);
}

/** Requirements in the (current or locked) set: accepted + model-specific. */
export function setRequirements(w: ModelWork): Requirement[] {
  return [...proposalRequirements(w).filter((r) => w.reqStatus[r.id] === 'accepted'), ...w.modelSpecific];
}

export function allModelRequirements(w: ModelWork): Requirement[] {
  return [...proposalRequirements(w), ...w.modelSpecific];
}

export function finalVerdict(row: AssessmentRow): Verdict {
  if (row.decision?.decision === 'edited' && row.decision.finalVerdict) return row.decision.finalVerdict;
  if (row.decision?.decision === 'rejected' && row.decision.finalVerdict) return row.decision.finalVerdict;
  return row.verdict;
}

function initialStatuses(modelId: string, component: Component, reqs: Requirement[]): Record<string, ReqStatus> {
  const out: Record<string, ReqStatus> = {};
  for (const r of reqs) out[r.id] = applicabilityConfidence(modelId, r.id, component) >= 0.85 ? 'accepted' : 'proposed';
  return out;
}

function pilotInitialRun(): AssessmentRun {
  const rows: AssessmentRow[] = PILOT_SHARED_REQS.map((r) => pilotRow1lod(r.id)!).map((row) => {
    const d = PILOT.decisions_1lod_initial[row.requirementId];
    return d ? { ...row, decision: { by: ME, at: '2027-06-13T09:41:00', decision: d.decision, reason: d.reason } } : row;
  });
  return {
    id: 'RUN-1L-0412',
    line: '1lod',
    modelId: PILOT_MODEL_ID,
    requirementSetId: requirementSetIdFor(PILOT_MODEL_ID),
    libraryVersion: LIBRARY_BASE_VERSION,
    documentVersions: { [RDS_ID]: '1.0' },
    startedAt: '2027-06-12T16:05:00',
    provider: 'simulated',
    inputsSummary: `1 document (RDS documentation v1.0), ${rows.length} requirements, library v${LIBRARY_BASE_VERSION}.`,
    rows,
  };
}

function newWork(modelId: string): ModelWork {
  const component: Component = 'rds';
  const reqs = proposalRequirements({ modelId, component });
  const pilot = modelId === PILOT_MODEL_ID;
  return {
    modelId,
    component,
    reqSetId: requirementSetIdFor(modelId),
    setVersion: 1,
    generatedAt: pilot ? '2027-05-02T10:03:00' : '2027-06-01T09:00:00',
    reqStatus: initialStatuses(modelId, component, reqs),
    excludedReasons: {},
    addedDocuments: [],
    uploads: [],
    modelSpecific: [],
    proposedToLibrary: [],
    draftVersion: '0.7',
    aiBlocks: {},
    draftCheck: pilot ? { version: '0.7', at: '2027-05-28T13:47:00', results: draftCheck('0.7', PILOT_SHARED_REQS) } : undefined,
    run: pilot ? pilotInitialRun() : undefined,
    evidenceDocs: [],
    changedRows: [],
    findings: [],
    importedFindingPackages: [],
    responseExports: [],
  };
}

function initialModels(): Record<string, ModelWork> {
  return { [PILOT_MODEL_ID]: newWork(PILOT_MODEL_ID) };
}

// ---------------------------------------------------------------------------
interface State1 {
  models: Record<string, ModelWork>;
  ensure: (modelId: string) => void;
  patch: (modelId: string, fn: (w: ModelWork) => Partial<ModelWork>) => void;

  // Scoping
  setComponent: (modelId: string, c: Component) => void;
  regenerate: (modelId: string) => void;
  setReqStatus: (modelId: string, reqIds: string[], status: ReqStatus, reason?: string) => void;
  addDocument: (modelId: string, docId: string, reason: string) => void;
  removeDocument: (modelId: string, docId: string) => void;
  addUpload: (modelId: string, upload: Upload) => void;
  addModelSpecific: (modelId: string, req: Requirement) => void;
  markProposed: (modelId: string, reqId: string) => void;
  lock: (modelId: string) => void;
  unlock: (modelId: string) => void;

  // Draft check
  setDraftVersion: (modelId: string, v: string) => void;
  insertAiBlock: (modelId: string, version: string, section: string, text: string) => void;
  runDraftCheck: (modelId: string) => void;

  // Self-assessment
  runAssessment: (modelId: string) => void;
  rerunChanged: (modelId: string) => string[];
  decide: (modelId: string, reqIds: string[], d: Omit<RowDecision, 'by' | 'at'>) => void;
  clearDecision: (modelId: string, reqId: string) => void;
  uploadEvidence: (modelId: string, upload: Upload, textContent?: string, reassessNow?: string) => string[];
  fastForward: (modelId: string) => number;

  // Submit & findings
  recordSubmission: (modelId: string, s: ModelWork['submission']) => void;
  importFindings: (modelId: string, pkg: { packageId: string; sha256: string; createdBy: string; createdAt: string; opinionSummary?: string }, findings: Finding[]) => number;
  saveResponse: (modelId: string, findingId: string, plan: string, evidence: Upload[]) => void;
  recordResponseExport: (modelId: string, packageId: string, sha256: string, findingIds: string[]) => void;
}

export const use1lod = create<State1>()(
  persist(
    (set, get) => {
      const patch = (modelId: string, fn: (w: ModelWork) => Partial<ModelWork>) =>
        set((s) => {
          const w = s.models[modelId] ?? newWork(modelId);
          return { models: { ...s.models, [modelId]: { ...w, ...fn(w) } } };
        });
      const work = (modelId: string) => get().models[modelId] ?? newWork(modelId);

      return {
        models: initialModels(),
        ensure: (modelId) => {
          if (!get().models[modelId] && getModel(modelId)) set((s) => ({ models: { ...s.models, [modelId]: newWork(modelId) } }));
        },
        patch,

        setComponent: (modelId, c) => {
          const reqs = proposalRequirements({ modelId, component: c });
          patch(modelId, () => ({ component: c, reqStatus: initialStatuses(modelId, c, reqs), excludedReasons: {}, generatedAt: nowISO() }));
          logAudit({ line: '1lod', modelId, type: 'Requirement set regenerated', detail: `Component changed to “${c}”; requirement set regenerated (${reqs.length} proposed).` });
        },
        regenerate: (modelId) => {
          const w = work(modelId);
          const reqs = proposalRequirements(w);
          const fresh = initialStatuses(modelId, w.component, reqs);
          // keep human decisions for requirements that are still proposed by the generator
          const merged: Record<string, ReqStatus> = {};
          for (const r of reqs) merged[r.id] = w.reqStatus[r.id] ?? fresh[r.id];
          patch(modelId, () => ({ reqStatus: merged, generatedAt: nowISO() }));
          logAudit({ line: '1lod', modelId, type: 'Requirement set proposed', detail: `AI generated requirement set ${w.reqSetId}: ${reqs.length} proposed. Existing decisions kept.` });
        },
        setReqStatus: (modelId, reqIds, status, reason) => {
          patch(modelId, (w) => {
            const reqStatus = { ...w.reqStatus };
            const excludedReasons = { ...w.excludedReasons };
            for (const id of reqIds) {
              reqStatus[id] = status;
              if (status === 'excluded' && reason) excludedReasons[id] = reason;
              if (status !== 'excluded') delete excludedReasons[id];
            }
            return { reqStatus, excludedReasons };
          });
          logAudit({
            line: '1lod',
            modelId,
            type: status === 'excluded' ? 'Requirement excluded' : status === 'accepted' ? 'Requirements accepted' : 'Requirement reset',
            detail: `${reqIds.join(', ')}${reason ? ` — reason: ${reason}` : ''}`,
          });
        },
        addDocument: (modelId, docId, reason) => {
          patch(modelId, (w) => ({ addedDocuments: [...w.addedDocuments.filter((d) => d.docId !== docId), { docId, reason, at: nowISO() }] }));
          logAudit({ line: '1lod', modelId, type: 'Document added', detail: `${docId} added from library — reason: ${reason}` });
        },
        removeDocument: (modelId, docId) => {
          patch(modelId, (w) => ({ addedDocuments: w.addedDocuments.filter((d) => d.docId !== docId) }));
          logAudit({ line: '1lod', modelId, type: 'Document removed', detail: `${docId} removed from scope.` });
        },
        addUpload: (modelId, upload) => {
          patch(modelId, (w) => ({ uploads: [...w.uploads.filter((u) => u.name !== upload.name), upload] }));
          logAudit({
            line: '1lod',
            modelId,
            type: 'Upload',
            detail: `${upload.name} uploaded as ${upload.kind === 'evidence' ? 'evidence' : 'requirement source'}${upload.extractedRequirements?.length ? ` — ${upload.extractedRequirements.length} requirement(s) extracted` : ''}.`,
          });
        },
        addModelSpecific: (modelId, req) => {
          patch(modelId, (w) => ({ modelSpecific: [...w.modelSpecific.filter((r) => r.id !== req.id), { ...req, layer: 'model_specific' }] }));
          logAudit({ line: '1lod', modelId, type: 'Model-specific requirement added', detail: `${req.id} added to this model: “${req.text}”` });
        },
        markProposed: (modelId, reqId) => patch(modelId, (w) => ({ proposedToLibrary: [...new Set([...w.proposedToLibrary, reqId])] })),
        lock: (modelId) => {
          if (work(modelId).lockedAt) return;
          const at = nowISO();
          patch(modelId, (w) => {
            const reqStatus = { ...w.reqStatus };
            for (const k of Object.keys(reqStatus)) if (reqStatus[k] === 'proposed') reqStatus[k] = 'accepted';
            const next: ModelWork = { ...w, reqStatus, lockedAt: at, lockedBy: ME };
            // Sync an existing run with the locked set (new rows are AI-assessed, excluded rows drop out)
            if (w.run) {
              const inSet = setRequirements(next);
              const ids = new Set(inSet.map((r) => r.id));
              const model = getModel(modelId)!;
              const rows = w.run.rows.filter((r) => ids.has(r.requirementId));
              inSet.forEach((req, i) => {
                if (rows.some((r) => r.requirementId === req.id)) return;
                rows.push(req.layer === 'model_specific' ? modelSpecificRow1lod(req) : pilotRow1lod(req.id) ?? genericRow(model, req, i));
              });
              next.run = { ...w.run, rows, requirementSetId: w.reqSetId };
            }
            return next;
          });
          const w = work(modelId);
          logAudit({
            line: '1lod',
            modelId,
            type: 'Requirement set locked',
            detail: `${w.reqSetId} v${w.setVersion} locked · library v${LIBRARY_BASE_VERSION} · ${setRequirements(w).length} requirements.`,
          });
        },
        unlock: (modelId) => {
          patch(modelId, (w) => ({ lockedAt: undefined, lockedBy: undefined, setVersion: w.setVersion + 1 }));
          const w = work(modelId);
          logAudit({ line: '1lod', modelId, type: 'Requirement set unlocked', detail: `${w.reqSetId} unlocked — new version v${w.setVersion} created.` });
        },

        setDraftVersion: (modelId, v) => patch(modelId, () => ({ draftVersion: v })),
        insertAiBlock: (modelId, version, section, text) => {
          patch(modelId, (w) => {
            const byV = { ...(w.aiBlocks[version] ?? {}) };
            byV[section] = [...(byV[section] ?? []), text];
            return { aiBlocks: { ...w.aiBlocks, [version]: byV } };
          });
          logAudit({ line: '1lod', modelId, type: 'AI-drafted text inserted', detail: `AI-drafted paragraph inserted in draft v${version} §${section} (marked as AI-drafted).` });
        },
        runDraftCheck: (modelId) => {
          const w = work(modelId);
          const results = draftCheck(w.draftVersion, proposalRequirements(w).filter((r) => w.reqStatus[r.id] !== 'excluded'), w.aiBlocks[w.draftVersion] ?? {});
          patch(modelId, () => ({ draftCheck: { version: w.draftVersion, at: nowISO(), results } }));
          const gaps = results.filter((r) => r.status === 'gap').map((r) => r.requirementId);
          logAudit({
            line: '1lod',
            modelId,
            type: 'Draft check run',
            detail: `Sandbox draft check on RDS v${w.draftVersion}: ${gaps.length} gap(s)${gaps.length ? ` (${gaps.join(', ')})` : ''}. No status, no sign-off.`,
          });
        },

        runAssessment: (modelId) => {
          const w = work(modelId);
          const model = getModel(modelId)!;
          const reqs = setRequirements(w);
          const evidenceNames = w.evidenceDocs.map((d) => d.uploadName);
          const rows = reqs.map((req, i) => {
            if (req.layer === 'model_specific') return modelSpecificRow1lod(req);
            return pilotReassess1lod(req.id, evidenceNames) ?? pilotRow1lod(req.id) ?? genericRow(model, req, i);
          });
          const run: AssessmentRun = {
            id: uid('RUN-1L'),
            line: '1lod',
            modelId,
            requirementSetId: w.reqSetId,
            libraryVersion: LIBRARY_BASE_VERSION,
            documentVersions: { [RDS_ID]: '1.0', ...Object.fromEntries(w.evidenceDocs.map((d) => [d.id, d.version])) },
            startedAt: nowISO(),
            provider: 'simulated',
            inputsSummary: `${1 + w.evidenceDocs.length} document(s), ${rows.length} requirements, library v${LIBRARY_BASE_VERSION}.`,
            rows,
          };
          patch(modelId, () => ({ run, changedRows: [] }));
          logAudit({ line: '1lod', modelId, type: 'Assessment run', detail: `Self-assessment run ${run.id} · ${run.requirementSetId} · library v${run.libraryVersion} · ${rows.length} requirements.` });
        },
        rerunChanged: (modelId) => {
          const w = work(modelId);
          if (!w.run) return [];
          const evidenceNames = w.evidenceDocs.map((d) => d.uploadName);
          const changed = new Set(w.changedRows);
          const done: string[] = [];
          const rows = w.run.rows.map((r) => {
            if (!changed.has(r.requirementId)) return r;
            const nr = pilotReassess1lod(r.requirementId, evidenceNames);
            if (!nr) return r;
            done.push(r.requirementId);
            return { ...nr, reassessedAt: nowISO() };
          });
          patch(modelId, (x) => ({
            run: x.run ? { ...x.run, rows, documentVersions: { ...x.run.documentVersions, ...Object.fromEntries(x.evidenceDocs.map((d) => [d.id, d.version])) } } : x.run,
            changedRows: [],
          }));
          if (done.length) logAudit({ line: '1lod', modelId, type: 'Rows re-assessed', detail: `Re-run of changed rows: ${done.join(', ')} (new evidence). Other rows kept their human decision.` });
          return done;
        },
        decide: (modelId, reqIds, d) => {
          const at = nowISO();
          patch(modelId, (w) =>
            w.run ? { run: { ...w.run, rows: w.run.rows.map((r) => (reqIds.includes(r.requirementId) ? { ...r, decision: { ...d, by: ME, at } } : r)) } } : {},
          );
          logAudit({
            line: '1lod',
            modelId,
            type: d.decision === 'accepted' ? (reqIds.length > 1 ? 'Bulk accept' : 'Row accepted') : d.decision === 'edited' ? 'Row edited' : 'Row rejected',
            detail: `${reqIds.join(', ')}${d.finalVerdict ? ` → final outcome ${d.finalVerdict.replace('_', ' ')}` : ''}${d.reason ? ` — reason: ${d.reason}` : ''}`,
          });
        },
        clearDecision: (modelId, reqId) => {
          patch(modelId, (w) => (w.run ? { run: { ...w.run, rows: w.run.rows.map((r) => (r.requirementId === reqId ? { ...r, decision: undefined } : r)) } } : {}));
          logAudit({ line: '1lod', modelId, type: 'Decision withdrawn', detail: `${reqId}: human decision withdrawn.` });
        },
        uploadEvidence: (modelId, upload, textContent, reassessNow) => {
          const doc = evidenceDocFor(upload.name, textContent);
          const affected = EVIDENCE_AFFECTS[upload.name] ?? [];
          patch(modelId, (w) => ({
            uploads: [...w.uploads.filter((u) => u.name !== upload.name), upload],
            evidenceDocs: [...w.evidenceDocs.filter((d) => d.id !== doc.id), { ...doc, uploadName: upload.name }],
            changedRows: [...new Set([...w.changedRows, ...affected])],
          }));
          logAudit({ line: '1lod', modelId, type: 'Evidence uploaded', detail: `${upload.name} uploaded as evidence (${doc.title}, v${doc.version}); affects ${affected.length ? affected.join(', ') : 'no open rows'}.` });
          if (reassessNow) return get().rerunChanged(modelId);
          return [];
        },
        fastForward: (modelId) => {
          const at = nowISO();
          let n = 0;
          patch(modelId, (w) => {
            if (!w.run) return {};
            const rows = w.run.rows.map((r) => {
              if (r.decision) return r;
              const s = PILOT.decisions_1lod_scripted[r.requirementId];
              n++;
              if (s) {
                const dec: RowDecision =
                  s.decision === 'edited' && s.final_verdict === r.verdict
                    ? { by: ME, at, decision: 'accepted', reason: s.reason }
                    : { by: ME, at, decision: s.decision, finalVerdict: s.final_verdict, reason: s.reason };
                return { ...r, decision: dec };
              }
              if (r.verdict === 'not_found' && r.mitigation?.type === 'justification') {
                return { ...r, decision: { by: ME, at, decision: 'edited' as const, finalVerdict: 'not_applicable' as Verdict, reason: 'Evidenced outside the RDS component: PD add-on applied at calibration (MDD §7).' } };
              }
              return { ...r, decision: { by: ME, at, decision: 'accepted' as const, reason: r.confidence === 'high' ? undefined : 'Reviewed — evidence sufficient.' } };
            });
            return { run: { ...w.run, rows } };
          });
          logAudit({ line: '1lod', modelId, type: 'Fast-forward (demo)', detail: `Scripted decisions applied to ${n} remaining row(s).` });
          return n;
        },

        recordSubmission: (modelId, s) => {
          patch(modelId, () => ({ submission: s }));
          logAudit({ line: '1lod', modelId, type: 'Submission package exported', detail: `${s?.packageId} frozen and exported · SHA-256 ${s?.sha256.slice(0, 12)}… · matrix read-only.` });
        },
        importFindings: (modelId, pkg, findings) => {
          const w = work(modelId);
          if (w.importedFindingPackages.some((p) => p.packageId === pkg.packageId)) return 0;
          patch(modelId, (x) => {
            const byId = new Map(x.findings.map((f) => [f.id, f]));
            for (const f of findings) {
              const prev = byId.get(f.id);
              byId.set(f.id, prev?.response ? { ...f, response: prev.response, status: f.status === 'closed' ? 'closed' : prev.status } : f);
            }
            return {
              findings: [...byId.values()],
              importedFindingPackages: [...x.importedFindingPackages, { ...pkg, at: nowISO() }],
            };
          });
          logAudit({ line: '1lod', modelId, type: 'Findings package imported', detail: `${pkg.packageId} imported · integrity verified · ${findings.length} issued finding(s).` });
          return findings.length;
        },
        saveResponse: (modelId, findingId, plan, evidence) => {
          patch(modelId, (w) => ({
            findings: w.findings.map((f) => (f.id === findingId ? { ...f, response: { plan, evidence, at: nowISO() } } : f)),
          }));
          logAudit({ line: '1lod', modelId, type: 'Response drafted', detail: `Remediation plan saved for ${findingId}${evidence.length ? ` with ${evidence.length} evidence file(s)` : ''}.` });
        },
        recordResponseExport: (modelId, packageId, sha256, findingIds) => {
          patch(modelId, (w) => ({
            responseExports: [...w.responseExports, { packageId, sha256, at: nowISO() }],
            findings: w.findings.map((f) => (findingIds.includes(f.id) ? { ...f, status: 'response_submitted' } : f)),
          }));
          logAudit({ line: '1lod', modelId, type: 'Response package exported', detail: `${packageId} exported · responses for ${findingIds.join(', ')}.` });
        },
      };
    },
    { name: 'mcw-store1lod', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);

export function useWork(modelId: string): ModelWork | undefined {
  return use1lod((s) => s.models[modelId]);
}
