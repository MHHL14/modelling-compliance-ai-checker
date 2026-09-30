'use client';
// 1st line store, keyed by use case. Never imported by 2nd line pages; data crosses only via package files.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { workspaceStorage } from '@/lib/storage';
import { COMPONENT_LABEL } from '@/lib/ai/generic';
import { evidenceDocFor as uploadEvidenceDoc } from '@/lib/ai/pilot';
import { nowISO } from '@/lib/clock';
import { loadContent, type LibReq } from '@/lib/content';
import { affectedBy, assess1lod, docsOf, draftVersionOf, finalVersionOf, matchUpload, resolveSelection, runDraftCheck, scriptedDecision, type Ctx, type DocSel } from '@/lib/engine/assess';
import { buildHistoricCase, buildSubmissionPackage, caseIdFor, HISTORY, historicPackage, resolvedToPackage } from '@/lib/engine/history';
import { deriveRequirements, MANDATORY_SOURCES, type Component, type NotApplicable } from '@/lib/engine/sources';
import type { DraftResult } from '@/lib/engine/types';
import { packageId as newPackageId } from '@/lib/packages';
import { uid } from '@/lib/rng';
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
  /** inventory metadata, not a user control (spec §12.1) */
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
  /** requirement sources chosen by the user (library document IDs) */
  sources: string[];
  sourceReasons: Record<string, string>;
  libraryVersion: string;
  reqSetId: string;
  setVersion: number;
  generatedAt?: string;
  reqStatus: Record<string, ReqStatus>;
  excludedReasons: Record<string, string>;
  uploads: Upload[];
  modelSpecific: Requirement[];
  proposedToLibrary: string[];
  lockedAt?: string;
  lockedBy?: string;
  /** documentation selected for the draft check */
  draftSelection: DocSel[];
  /** documentation selected for the self-assessment and submission */
  submissionSelection?: DocSel[];
  selectionConfirmedAt?: string;
  aiBlocks: Record<string, Record<string, string[]>>;
  draftCheck?: { at: string; results: DraftResult[] };
  run?: AssessmentRun;
  evidenceDocs: EvidenceDoc[];
  changedRows: string[];
  submission?: { packageId: string; sha256: string; at: string; fileName: string; packageJson: string };
  findings: Finding[];
  importedFindingPackages: { packageId: string; sha256: string; at: string; createdBy: string; createdAt: string; opinionSummary?: string }[];
  responseExports: { packageId: string; sha256: string; at: string }[];
}

// ---------------------------------------------------------------------------
const deriveCache = new Map<string, { applicable: LibReq[]; notApplicable: NotApplicable[] }>();

export function derived(c: Pick<UseCase, 'modelId' | 'attributes' | 'component' | 'sources' | 'libraryVersion'>) {
  const key = `${c.modelId}|${c.component}|${c.libraryVersion}|${[...c.sources].sort().join(',')}|${[...c.attributes.tags].sort().join(',')}`;
  let hit = deriveCache.get(key);
  if (!hit) {
    hit = deriveRequirements({ model: getModel(c.modelId)!, tags: c.attributes.tags, component: c.component, sources: c.sources, libraryVersion: c.libraryVersion });
    deriveCache.set(key, hit);
  }
  return hit;
}

export function proposalRequirements(c: UseCase): LibReq[] {
  if (!c.generatedAt) return [];
  return derived(c).applicable.filter((r) => r.id in c.reqStatus);
}
export function notApplicableRequirements(c: UseCase): NotApplicable[] {
  return c.generatedAt ? derived(c).notApplicable : [];
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
export const selKey = (s: DocSel) => `${s.docId}@${s.version}`;

/** Default selection: this model's documents, draft versions (for the draft check) or final versions. */
export function defaultSelection(modelId: string, kind: 'draft' | 'final'): DocSel[] {
  return (docsOf(modelId)?.documents ?? [])
    .filter((d) => kind === 'final' || d.versions.some((v) => v.status === 'draft'))
    .map((d) => ({ modelId, docId: d.id, version: (kind === 'draft' ? draftVersionOf(d) : finalVersionOf(d)).version }));
}

export function caseCtx(c: UseCase, kind: 'draft' | 'submission'): Ctx {
  const sel = kind === 'draft' ? c.draftSelection : (c.submissionSelection ?? []);
  return { modelId: c.modelId, docs: resolveSelection(sel, c.evidenceDocs) };
}

function emptyCase(p: { modelId: string; cycle: string; component: Component; attributes: CaseAttributes; sources: string[]; at: string }): UseCase {
  return {
    caseId: caseIdFor(p.modelId, p.cycle), modelId: p.modelId, cycle: p.cycle, component: p.component, status: 'active', createdAt: p.at, updatedAt: p.at,
    attributes: p.attributes, sources: p.sources, sourceReasons: {}, libraryVersion: LIBRARY_BASE_VERSION, reqSetId: requirementSetIdFor(p.modelId), setVersion: 1,
    reqStatus: {}, excludedReasons: {}, uploads: [], modelSpecific: [], proposedToLibrary: [], draftSelection: [], aiBlocks: {},
    evidenceDocs: [], changedRows: [], findings: [], importedFindingPackages: [], responseExports: [],
  };
}

async function historicCases(): Promise<Record<string, UseCase>> {
  await loadContent(HISTORY.map((h) => h.modelId));
  const out: Record<string, UseCase> = {};
  for (const spec of HISTORY) {
    const model = getModel(spec.modelId)!;
    const h = buildHistoricCase(spec);
    const pkg = await historicPackage(spec);
    const c = emptyCase({ modelId: spec.modelId, cycle: spec.cycle, component: spec.component, attributes: attributesFromModel(model), sources: h.sources, at: spec.createdAt });
    const completed = spec.status === 'completed';
    out[c.caseId] = {
      ...c,
      status: spec.status,
      updatedAt: spec.closedAt ?? spec.submittedAt,
      completedAt: completed ? spec.closedAt : undefined,
      generatedAt: spec.createdAt,
      reqStatus: Object.fromEntries(h.requirements.map((r) => [r.id, 'accepted' as const])),
      lockedAt: spec.lockedAt,
      lockedBy: ME,
      draftSelection: defaultSelection(spec.modelId, 'draft'),
      submissionSelection: h.selection,
      selectionConfirmedAt: spec.runAt,
      run: h.run,
      submission: { packageId: pkg.manifest.packageId, sha256: pkg.manifest.sha256, at: spec.submittedAt, fileName: `${pkg.manifest.packageId}.rcc.json`, packageJson: JSON.stringify(pkg) },
      findings: h.findings,
      importedFindingPackages: completed ? [{ packageId: `FND-${spec.modelId}-${spec.revealedAt!.slice(0, 10).replace(/-/g, '')}`, sha256: '', at: spec.revealedAt!, createdBy: PERSONAS['2lod'].name, createdAt: spec.revealedAt! }] : [],
      responseExports: completed ? [{ packageId: `RSP-${spec.modelId}-${spec.closedAt!.slice(0, 10).replace(/-/g, '')}`, sha256: '', at: spec.closedAt! }] : [],
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
  createCase: (p: { modelId: string; cycle: string; component: Component; attributes: CaseAttributes; sources: string[] }) => string;

  setSources: (caseId: string, ids: string[]) => void;
  addSource: (caseId: string, docId: string, reason: string) => void;
  removeSource: (caseId: string, docId: string) => void;
  generate: (caseId: string) => void;
  setReqStatus: (caseId: string, ids: string[], status: ReqStatus, reason?: string) => void;
  addUpload: (caseId: string, upload: Upload) => void;
  addModelSpecific: (caseId: string, req: Requirement) => void;
  markProposed: (caseId: string, reqId: string) => void;
  lock: (caseId: string) => boolean;
  unlock: (caseId: string) => void;

  setDraftSelection: (caseId: string, sel: DocSel[]) => void;
  insertAiBlock: (caseId: string, docKey: string, section: string, text: string) => void;
  runDraftCheck: (caseId: string) => void;

  setSubmissionSelection: (caseId: string, sel: DocSel[]) => void;
  confirmSelection: (caseId: string) => void;
  runAssessment: (caseId: string) => void;
  rerunChanged: (caseId: string) => string[];
  decide: (caseId: string, ids: string[], d: Omit<RowDecision, 'by' | 'at'>) => void;
  clearDecision: (caseId: string, reqId: string) => void;
  uploadEvidence: (caseId: string, upload: Upload, textContent: string | undefined, target: 'draft' | 'submission', reassessNow?: boolean) => string[];
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
      const rederive = (caseId: string) => {
        const c = uc(caseId);
        if (!c.generatedAt || c.lockedAt) return;
        const ids = derived(c).applicable.map((r) => r.id);
        patch(caseId, (x) => ({ reqStatus: Object.fromEntries(ids.map((id) => [id, x.reqStatus[id] ?? ('proposed' as const)])) }));
      };

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
        createCase: ({ modelId, cycle, component, attributes, sources }) => {
          const existing = Object.values(get().cases).find((c) => c.modelId === modelId && c.status === 'active');
          if (existing) return existing.caseId;
          const c = emptyCase({ modelId, cycle, component, attributes, sources: [...new Set([...MANDATORY_SOURCES, ...sources])], at: nowISO() });
          c.draftSelection = defaultSelection(modelId, 'draft');
          set((s) => ({ cases: { ...s.cases, [c.caseId]: c } }));
          audit(c.caseId, 'Use case created', `${c.caseId}: ${getModel(modelId)?.name} · ${COMPONENT_LABEL[component]} · ${cycle} · ${c.sources.length} requirement sources selected.`);
          return c.caseId;
        },

        setSources: (caseId, ids) => {
          patch(caseId, () => ({ sources: [...new Set([...MANDATORY_SOURCES, ...ids])] }));
          rederive(caseId);
        },
        addSource: (caseId, docId, reason) => {
          patch(caseId, (c) => ({ sources: [...new Set([...c.sources, docId])], sourceReasons: { ...c.sourceReasons, [docId]: reason } }));
          rederive(caseId);
          audit(caseId, 'Requirement source added', `${docId} added — reason: ${reason}`);
        },
        removeSource: (caseId, docId) => {
          if (MANDATORY_SOURCES.includes(docId)) return;
          patch(caseId, (c) => ({ sources: c.sources.filter((d) => d !== docId) }));
          rederive(caseId);
          audit(caseId, 'Requirement source removed', `${docId} removed from the requirement sources.`);
        },
        generate: (caseId) => {
          const c = uc(caseId);
          const d = derived(c);
          patch(caseId, (x) => ({ generatedAt: nowISO(), reqStatus: Object.fromEntries(d.applicable.map((r) => [r.id, x.reqStatus[r.id] ?? ('proposed' as const)])) }));
          audit(caseId, 'Requirements derived', `AI derived ${d.applicable.length} requirements from ${c.sources.length} selected sources for ${COMPONENT_LABEL[c.component]}; ${d.notApplicable.length} not applicable. All await a decision.`);
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
          audit(caseId, status === 'excluded' ? 'Requirement excluded' : status === 'accepted' ? 'Requirements accepted' : 'Requirement reset', `${ids.length > 6 ? `${ids.length} requirements` : ids.join(', ')}${reason ? ` — reason: ${reason}` : ''}`);
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
          audit(caseId, 'Requirement set locked', `${c.reqSetId} v${c.setVersion} locked · library v${c.libraryVersion} · ${setRequirements(uc(caseId)).length} requirements from ${c.sources.length} sources.`);
          return true;
        },
        unlock: (caseId) => {
          patch(caseId, (c) => ({ lockedAt: undefined, lockedBy: undefined, setVersion: c.setVersion + 1, run: undefined, selectionConfirmedAt: undefined }));
          audit(caseId, 'Requirement set unlocked', `${uc(caseId).reqSetId} unlocked — new version v${uc(caseId).setVersion}.`);
        },

        setDraftSelection: (caseId, sel) => patch(caseId, () => ({ draftSelection: sel })),
        insertAiBlock: (caseId, docKey, section, text) => {
          patch(caseId, (c) => {
            const byDoc = { ...(c.aiBlocks[docKey] ?? {}) };
            byDoc[section] = [...(byDoc[section] ?? []), text];
            return { aiBlocks: { ...c.aiBlocks, [docKey]: byDoc } };
          });
          audit(caseId, 'AI-drafted text inserted', `AI-drafted paragraph inserted in ${docKey} §${section} (marked as AI-drafted).`);
        },
        runDraftCheck: (caseId) => {
          const c = uc(caseId);
          const ctx = caseCtx(c, 'draft');
          const reqs = allCaseRequirements(c).filter((r) => c.reqStatus[r.id] !== 'excluded');
          const blocks: Record<string, string[]> = {};
          for (const s of c.draftSelection) Object.entries(c.aiBlocks[selKey(s)] ?? {}).forEach(([sec, t]) => (blocks[`${s.docId}#${sec}`] = t));
          const results = runDraftCheck(ctx, reqs, blocks);
          patch(caseId, () => ({ draftCheck: { at: nowISO(), results } }));
          const gaps = results.filter((r) => r.status === 'gap').length;
          audit(caseId, 'Draft check run', `Interim assessment of ${ctx.docs.length} selected document(s): ${gaps} drafting gap(s). No status, no sign-off.`);
        },

        setSubmissionSelection: (caseId, sel) => patch(caseId, () => ({ submissionSelection: sel, selectionConfirmedAt: undefined })),
        confirmSelection: (caseId) => {
          patch(caseId, () => ({ selectionConfirmedAt: nowISO() }));
          const c = uc(caseId);
          audit(caseId, 'Documentation confirmed', `${(c.submissionSelection ?? []).length} document(s) confirmed for the self-assessment: ${(c.submissionSelection ?? []).map(selKey).join(', ')}.`);
        },
        runAssessment: (caseId) => {
          const c = uc(caseId);
          const ctx = caseCtx(c, 'submission');
          const rows = setRequirements(c).map((r) => assess1lod(ctx, r));
          const run: AssessmentRun = {
            id: uid('RUN-1L'), line: '1lod', modelId: c.modelId, requirementSetId: c.reqSetId, libraryVersion: c.libraryVersion,
            documentVersions: Object.fromEntries(ctx.docs.map((d) => [d.id, d.version])), startedAt: nowISO(), provider: 'simulated',
            inputsSummary: `${ctx.docs.length} document(s), ${rows.length} requirements, library v${c.libraryVersion}.`, rows,
          };
          patch(caseId, () => ({ run, changedRows: [] }));
          audit(caseId, 'Assessment run', `Self-assessment run ${run.id} · ${run.requirementSetId} · ${rows.length} requirements against ${ctx.docs.length} document(s).`);
        },
        rerunChanged: (caseId) => {
          const c = uc(caseId);
          if (!c.run) return [];
          const ctx = caseCtx(c, 'submission');
          const changed = new Set(c.changedRows);
          const reqs = allCaseRequirements(c);
          const done: string[] = [];
          const rows = c.run.rows.map((r) => {
            if (!changed.has(r.requirementId)) return r;
            const req = reqs.find((x) => x.id === r.requirementId);
            if (!req) return r;
            const nr = assess1lod(ctx, req);
            if (nr.verdict === r.verdict && nr.citations.length === r.citations.length && nr.confidence === r.confidence) return r;
            done.push(r.requirementId);
            return { ...nr, reassessedAt: nowISO() };
          });
          patch(caseId, (x) => ({ run: x.run && { ...x.run, rows, documentVersions: Object.fromEntries(ctx.docs.map((d) => [d.id, d.version])) }, changedRows: [] }));
          if (done.length) audit(caseId, 'Rows re-assessed', `Re-run of changed rows: ${done.join(', ')} (new evidence). Other rows kept their human decision.`);
          return done;
        },
        decide: (caseId, ids, d) => {
          const at = nowISO();
          patch(caseId, (c) => (c.run ? { run: { ...c.run, rows: c.run.rows.map((r) => (ids.includes(r.requirementId) ? { ...r, decision: { ...d, by: ME, at } } : r)) } } : {}));
          audit(caseId, d.decision === 'accepted' ? (ids.length > 1 ? 'Bulk accept' : 'Row accepted') : d.decision === 'edited' ? 'Row edited' : 'Row rejected', `${ids.length > 6 ? `${ids.length} rows` : ids.join(', ')}${d.finalVerdict ? ` → final outcome ${d.finalVerdict.replace('_', ' ')}` : ''}${d.reason ? ` — reason: ${d.reason}` : ''}`);
        },
        clearDecision: (caseId, reqId) => {
          patch(caseId, (c) => (c.run ? { run: { ...c.run, rows: c.run.rows.map((r) => (r.requirementId === reqId ? { ...r, decision: undefined } : r)) } } : {}));
          audit(caseId, 'Decision withdrawn', `${reqId}: human decision withdrawn.`);
        },
        uploadEvidence: (caseId, upload, textContent, target, reassessNow) => {
          const c = uc(caseId);
          const match = matchUpload(c.modelId, upload.name);
          if (match) {
            const doc = docsOf(c.modelId)!.documents.find((d) => d.id === match.docId)!;
            const entry = target === 'draft' ? { ...match, version: draftVersionOf(doc).version } : match;
            const sel = target === 'draft' ? c.draftSelection : (c.submissionSelection ?? []);
            const next = [...sel.filter((s) => s.docId !== match.docId), entry];
            const affected = affectedBy(c.modelId, entry);
            patch(caseId, (x) => ({
              uploads: [...x.uploads.filter((u) => u.name !== upload.name), upload],
              ...(target === 'draft' ? { draftSelection: next } : { submissionSelection: next }),
              changedRows: [...new Set([...x.changedRows, ...affected])],
            }));
            audit(caseId, 'Evidence uploaded', `${upload.name} recognised as library document ${entry.docId} v${entry.version} and added to the ${target === 'draft' ? 'draft check' : 'self-assessment'} selection.`);
          } else {
            const doc = uploadEvidenceDoc(upload.name, textContent);
            patch(caseId, (x) => ({ uploads: [...x.uploads.filter((u) => u.name !== upload.name), upload], evidenceDocs: [...x.evidenceDocs.filter((d) => d.id !== doc.id), { ...doc, uploadName: upload.name }] }));
            audit(caseId, 'Evidence uploaded', `${upload.name} uploaded (${Math.round(upload.size / 1024)} KB); no passage mapped to open requirements.`);
          }
          return reassessNow ? get().rerunChanged(caseId) : [];
        },
        fastForward: (caseId) => {
          const at = nowISO();
          let n = 0;
          patch(caseId, (c) => {
            if (!c.run) return {};
            const rows = c.run.rows.map((r) => {
              if (r.decision) return r;
              n++;
              return { ...r, decision: { ...scriptedDecision(c.modelId, r), by: ME, at } };
            });
            return { run: { ...c.run, rows } };
          });
          audit(caseId, 'Fast-forward (demo)', `Scripted decisions applied to ${n} remaining row(s).`);
          return n;
        },

        buildSubmission: async (caseId) => {
          const c = uc(caseId);
          return buildSubmissionPackage({
            modelId: c.modelId, component: c.component, tags: c.attributes.tags, sources: c.sources, reqSetId: c.reqSetId, requirements: setRequirements(c),
            excluded: Object.entries(c.excludedReasons).map(([id, reason]) => ({ id, reason })), uploads: c.uploads,
            lockedAt: c.lockedAt, lockedBy: c.lockedBy, run: c.run!, documents: resolvedToPackage(c.submissionSelection ?? [], c.evidenceDocs), packageId: newPackageId('submission', c.modelId),
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
    { name: 'mcw-store1lod', version: 4, storage: workspaceStorage },
  ),
);

export function useCase(caseId: string): UseCase | undefined {
  return use1lod((s) => s.cases[caseId]);
}
