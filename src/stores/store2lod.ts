'use client';
// 2nd line store. Never imports the 1st line store; 1st line content only arrives via imported packages.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { applicableDocs } from '@/lib/applicability';
import { genericEvidenceDoc, genericRequirements, genericRow } from '@/lib/ai/generic';
import { pilotRow2lod } from '@/lib/ai/pilot';
import { nowISO } from '@/lib/clock';
import { manifest, seal } from '@/lib/packages';
import { uid } from '@/lib/rng';
import { getModel, LIBRARY_BASE_VERSION, PERSONAS, PILOT, PILOT_MODEL_ID, PILOT_VAL_REQS, requirementSetIdFor } from '@/lib/seed';
import type { AssessmentRow, AssessmentRun, Finding, Model, Requirement, ResponsePackage, RowDecision, SubmissionPackage, Verdict } from '@/lib/types';
import { logAudit } from './storeAudit';

const ME = PERSONAS['2lod'].name;

export type ReviewStatus = 'imported' | 'in_review' | 'findings_exported' | 'opinion_issued';
export type OpinionRating = 'fit' | 'fit_with_conditions' | 'not_fit';

export interface Review {
  snapshotId: string;
  modelId: string;
  importedAt: string;
  sha256: string;
  pkg: SubmissionPackage;
  status: ReviewStatus;
  validationLayer: Requirement[];
  scopingChallenges: { requirementId: string; note: string; at: string; findingId: string }[];
  run?: AssessmentRun;
  revealedAt?: string;
  findings: Finding[];
  findingExports: { packageId: string; sha256: string; at: string; findingIds: string[] }[];
  responseImports: { packageId: string; sha256: string; at: string }[];
  opinion?: { rating: OpinionRating; rationale: string; conditions: string[]; issuedAt?: string; drafted: boolean };
}

export function validationLayerFor(model: Model): Requirement[] {
  if (model.id === PILOT_MODEL_ID) return PILOT_VAL_REQS;
  const valDocs = applicableDocs(model).filter((d) => d.type === 'validation_standard');
  const base: Requirement[] = [
    {
      id: 'VAL-01', text: 'Validation independently replicates the model development data set from source data.', source_doc: 'INT-VAL-GEN', article: 'MV-STD-001 §5.1',
      category: 'validation', check_type: 'script', applicability_rationale: `Tier ${model.tier} model – replication required.`, layer: '2lod',
    },
  ];
  valDocs.slice(1, 4).forEach((d, i) => {
    const topic = d.key_topics[i % d.key_topics.length] ?? 'validation scope';
    base.push({
      id: `VAL-${String(i + 2).padStart(2, '0')}`, text: `${topic.charAt(0).toUpperCase()}${topic.slice(1)} is tested and documented according to ${d.reference}.`,
      source_doc: d.id, article: d.reference, category: 'validation', check_type: 'ai+script', applicability_rationale: `${d.title} applies to this model.`, layer: '2lod',
    });
  });
  return base;
}

export function reviewRequirements(r: Review): Requirement[] {
  const shared = r.pkg.requirements ?? [];
  return [...shared, ...r.validationLayer];
}

export function final2lod(row: AssessmentRow): Verdict {
  if ((row.decision?.decision === 'edited' || row.decision?.decision === 'rejected') && row.decision.finalVerdict) return row.decision.finalVerdict;
  return row.verdict;
}

function nextFindingId(r: Review) {
  const used = new Set(r.findings.map((f) => f.id));
  for (let n = 10; n < 99; n++) if (!used.has(`F-${n}`)) return `F-${n}`;
  return uid('F');
}

// ---- Seed: one already-imported submission package for MDL-04 (spec 7) ----
async function buildSeedReview(): Promise<Review> {
  const model = getModel('MDL-04')!;
  const reqs = genericRequirements(model, 'full');
  const doc = genericEvidenceDoc(model, reqs);
  const matrix = reqs.map((r, i) => {
    const row = genericRow(model, r, i);
    const decision: RowDecision =
      row.verdict === 'not_found'
        ? { by: 'Lotte Jansen', at: '2027-04-21T15:10:00', decision: 'edited', finalVerdict: 'partial', reason: 'Evidence in SHAP explainability annex (not linked to run).' }
        : { by: 'Lotte Jansen', at: '2027-04-21T15:10:00', decision: 'accepted', reason: row.confidence === 'high' ? undefined : 'Reviewed.' };
    return { ...row, decision };
  });
  const pkg = await seal<SubmissionPackage>({
    manifest: manifest({
      packageType: 'submission', packageId: 'SUB-MDL-04-20270422', modelId: 'MDL-04', createdAt: '2027-04-22T11:05:00',
      createdBy: 'Lotte Jansen (Model Developer, SME Credit Risk Modelling)', line: '1lod', libraryVersion: LIBRARY_BASE_VERSION,
      requirementSetId: requirementSetIdFor('MDL-04'), documentVersions: { [doc.id]: '1.0' },
    }),
    requirementSet: {
      id: requirementSetIdFor('MDL-04'), modelId: 'MDL-04', component: 'Full model', libraryVersion: LIBRARY_BASE_VERSION,
      requirementIds: reqs.map((r) => r.id), excluded: [], addedDocuments: [], uploads: [], lockedAt: '2027-04-15T10:00:00', lockedBy: 'Lotte Jansen',
    },
    requirements: reqs,
    documents: [{ id: doc.id, version: doc.version, title: doc.title, sections: doc.sections }],
    matrix1lod: matrix,
    statement: 'I confirm this self-assessment reflects the model documentation as submitted.',
  });
  const validationLayer = validationLayerFor(model);
  const all = [...reqs, ...validationLayer];
  const rows = all.map((r, i) => genericRow(model, r, i, ':2lod'));
  const run: AssessmentRun = {
    id: 'RUN-2L-0388', line: '2lod', modelId: 'MDL-04', requirementSetId: pkg.manifest.requirementSetId, libraryVersion: LIBRARY_BASE_VERSION,
    documentVersions: pkg.manifest.documentVersions, startedAt: '2027-05-06T08:55:00', provider: 'simulated',
    inputsSummary: `Inputs: ${pkg.documents.length} document, ${all.length} requirements. 1st line conclusions: not provided (independence).`,
    rows: rows.map((r) => ({ ...r, decision: { by: ME, at: '2027-05-08T10:00:00', decision: 'accepted' } })),
  };
  return {
    snapshotId: pkg.manifest.packageId, modelId: 'MDL-04', importedAt: '2027-04-22T14:40:00', sha256: pkg.manifest.sha256, pkg,
    status: 'in_review', validationLayer, scopingChallenges: [], run, revealedAt: '2027-06-03T09:30:00',
    findings: [
      {
        id: 'F-01', modelId: 'MDL-04', snapshotId: pkg.manifest.packageId, requirementRefs: [reqs[3]?.id ?? 'G04-04'], severity: 'medium',
        title: 'Monotonic-constraint evidence not linked to SHAP explanations',
        observation: 'The SHAP explainability annex is referenced but not included in the submission package; monotonic constraints are asserted without test evidence.',
        impact: 'Explainability of the gradient boosting model cannot be independently confirmed.',
        challenge: 'Please provide the monotonicity test results per constrained feature.', owner: model.owner_1lod, deadline: '2027-09-30',
        status: 'draft', aiDrafted: true, kind: 'finding',
      },
    ],
    findingExports: [], responseImports: [],
  };
}

interface State2 {
  seeded: boolean;
  reviews: Record<string, Review>;
  ensureSeed: () => Promise<void>;
  patch: (id: string, fn: (r: Review) => Partial<Review>) => void;
  importSubmission: (pkg: SubmissionPackage, sha256: string) => { created: boolean; snapshotId: string };
  addValidationReq: (id: string, req: Requirement) => void;
  addScopingChallenge: (id: string, req: Requirement, note: string) => string;
  runBlind: (id: string) => void;
  decide: (id: string, reqIds: string[], d: Omit<RowDecision, 'by' | 'at'>) => void;
  reveal: (id: string) => void;
  draftFindingFromRow: (id: string, reqId: string, context: { category: string; lodReason?: string }) => string;
  updateFinding: (id: string, findingId: string, p: Partial<Finding>) => void;
  deleteFinding: (id: string, findingId: string) => void;
  issueFinding: (id: string, findingId: string) => void;
  recordFindingsExport: (id: string, packageId: string, sha256: string, findingIds: string[]) => void;
  importResponses: (id: string, pkg: ResponsePackage, sha256: string) => number;
  closeFinding: (id: string, findingId: string, note: string) => void;
  saveOpinion: (id: string, o: Review['opinion']) => void;
  issueOpinion: (id: string) => void;
}

let seeding = false;

export const use2lod = create<State2>()(
  persist(
    (set, get) => {
      const patch = (id: string, fn: (r: Review) => Partial<Review>) =>
        set((s) => (s.reviews[id] ? { reviews: { ...s.reviews, [id]: { ...s.reviews[id], ...fn(s.reviews[id]) } } } : s));
      const rev = (id: string) => get().reviews[id];

      return {
        seeded: false,
        reviews: {},
        ensureSeed: async () => {
          if (get().seeded || seeding) return;
          seeding = true;
          try {
            const r = await buildSeedReview();
            set((s) => ({ seeded: true, reviews: { [r.snapshotId]: r, ...s.reviews } }));
          } finally {
            seeding = false;
          }
        },
        patch,
        importSubmission: (pkg, sha256) => {
          const id = pkg.manifest.packageId;
          if (get().reviews[id]) {
            logAudit({ line: '2lod', modelId: pkg.manifest.modelId, type: 'Submission package re-imported', detail: `${id} already imported — no changes (idempotent).` });
            return { created: false, snapshotId: id };
          }
          const model = getModel(pkg.manifest.modelId);
          const review: Review = {
            snapshotId: id, modelId: pkg.manifest.modelId, importedAt: nowISO(), sha256, pkg, status: 'imported',
            validationLayer: model ? validationLayerFor(model) : [], scopingChallenges: [], findings: [], findingExports: [], responseImports: [],
          };
          set((s) => ({ reviews: { ...s.reviews, [id]: review } }));
          logAudit({
            line: '2lod', modelId: pkg.manifest.modelId, type: 'Submission package imported',
            detail: `${id} imported · integrity verified (SHA-256 ${sha256.slice(0, 12)}…) · created by ${pkg.manifest.createdBy} · ${pkg.manifest.requirementSetId} · library v${pkg.manifest.libraryVersion}. 1st line matrix hidden until reveal.`,
          });
          return { created: true, snapshotId: id };
        },
        addValidationReq: (id, req) => {
          patch(id, (r) => ({ validationLayer: [...r.validationLayer.filter((x) => x.id !== req.id), { ...req, layer: '2lod' }] }));
          logAudit({ line: '2lod', modelId: rev(id)?.modelId, type: 'Validation requirement added', detail: `${req.id} added to the validation layer.` });
        },
        addScopingChallenge: (id, req, note) => {
          const r = rev(id);
          const fid = nextFindingId(r);
          const f: Finding = {
            id: fid, modelId: r.modelId, snapshotId: id, requirementRefs: [req.id], severity: 'medium', kind: 'scoping_gap',
            title: `Scoping gap: ${req.id} not in the requirement set`,
            observation: `${req.id} (“${req.text}”, ${req.article}) is not part of the locked requirement set ${r.pkg.manifest.requirementSetId}. ${note}`,
            impact: 'Compliance with this requirement has not been self-assessed by the 1st line.',
            challenge: `Please assess ${req.id} or justify its exclusion.`,
            owner: getModel(r.modelId)?.owner_1lod ?? '1st line', deadline: '2027-09-30', status: 'draft', aiDrafted: true,
          };
          patch(id, (x) => ({ scopingChallenges: [...x.scopingChallenges, { requirementId: req.id, note, at: nowISO(), findingId: fid }], findings: [...x.findings, f] }));
          logAudit({ line: '2lod', modelId: r.modelId, type: 'Scoping challenge raised', detail: `${req.id} flagged as scoping gap → draft finding ${fid}.` });
          return fid;
        },
        runBlind: (id) => {
          const r = rev(id);
          const model = getModel(r.modelId)!;
          const reqs = reviewRequirements(r);
          const rows = reqs.map((req, i) => (r.modelId === PILOT_MODEL_ID ? pilotRow2lod(req, r.pkg.documents) : genericRow(model, req, i, ':2lod')));
          const run: AssessmentRun = {
            id: uid('RUN-2L'), line: '2lod', modelId: r.modelId, requirementSetId: r.pkg.manifest.requirementSetId, libraryVersion: r.pkg.manifest.libraryVersion,
            documentVersions: r.pkg.manifest.documentVersions, startedAt: nowISO(), provider: 'simulated',
            inputsSummary: `Inputs: ${r.pkg.documents.length} document${r.pkg.documents.length === 1 ? '' : 's'}, ${reqs.length} requirements. 1st line conclusions: not provided (independence).`,
            rows,
          };
          patch(id, (x) => ({ run, status: x.status === 'imported' ? 'in_review' : x.status }));
          logAudit({
            line: '2lod', modelId: r.modelId, type: 'Blind assessment run',
            detail: `Blind 2nd line run ${run.id} on ${id}: ${r.pkg.documents.length} documents, ${reqs.length} requirements (incl. ${r.validationLayer.length} validation-layer). 1st line conclusions: not provided.`,
          });
        },
        decide: (id, reqIds, d) => {
          const at = nowISO();
          patch(id, (r) => (r.run && !r.revealedAt ? { run: { ...r.run, rows: r.run.rows.map((x) => (reqIds.includes(x.requirementId) ? { ...x, decision: { ...d, by: ME, at } } : x)) } } : {}));
          logAudit({
            line: '2lod', modelId: rev(id)?.modelId,
            type: d.decision === 'accepted' ? (reqIds.length > 1 ? 'Bulk accept (validator)' : 'Validator conclusion accepted') : d.decision === 'edited' ? 'Validator conclusion edited' : 'Validator conclusion rejected',
            detail: `${reqIds.join(', ')}${d.finalVerdict ? ` → ${d.finalVerdict.replace('_', ' ')}` : ''}${d.reason ? ` — ${d.reason}` : ''}`,
          });
        },
        reveal: (id) => {
          const at = nowISO();
          patch(id, () => ({ revealedAt: at }));
          const r = rev(id);
          logAudit({ line: '2lod', modelId: r.modelId, type: 'Reveal 1st line matrix', detail: `1st line matrix of ${id} revealed at ${at.slice(11, 16)}. Blind assessments (run ${r.run?.id ?? '—'}, ${r.run?.startedAt.slice(0, 16).replace('T', ' ') ?? '—'}) locked.` });
        },
        draftFindingFromRow: (id, reqId, ctx) => {
          const r = rev(id);
          const existing = r.findings.find((f) => f.requirementRefs.includes(reqId) && f.kind !== 'scoping_gap');
          if (existing) return existing.id;
          const seed = r.modelId === PILOT_MODEL_ID ? PILOT.draft_findings_2lod.find((f) => f.requirement.split(' / ').includes(reqId)) : undefined;
          const req = reviewRequirements(r).find((x) => x.id === reqId);
          const row = r.run?.rows.find((x) => x.requirementId === reqId);
          const owner = getModel(r.modelId)?.owner_1lod ?? '1st line';
          const f: Finding = seed
            ? {
                id: seed.id, modelId: r.modelId, snapshotId: id, requirementRefs: seed.requirement.split(' / '), severity: seed.severity, title: seed.title,
                observation: seed.observation, impact: seed.impact, challenge: seed.challenge, owner: seed.owner, deadline: seed.deadline, status: 'draft', aiDrafted: true, kind: 'finding',
                evidenceQuotes: [
                  ...(row?.citations.map((c) => `${c.doc} v${c.version} §${c.section}: “${c.quote}”`) ?? []),
                  ...(row?.script ? [`Script ${row.script.id}: ${row.script.detail}`] : []),
                ],
              }
            : {
                id: nextFindingId(r), modelId: r.modelId, snapshotId: id, requirementRefs: [reqId],
                severity: row?.verdict === 'non_compliant' ? 'high' : row?.verdict === 'partial' ? 'medium' : 'low',
                title: `${req?.text.replace(/\.$/, '') ?? reqId} — ${row?.verdict === 'non_compliant' ? 'not met' : 'not fully demonstrated'}`,
                observation: `${row?.rationale ?? ''}${ctx.lodReason ? ` The 1st line concluded otherwise: “${ctx.lodReason}”.` : ''}`.trim(),
                impact: row?.verdict === 'non_compliant' ? 'Requirement not met; potential impact on model outcomes and capital.' : 'Evidence incomplete; compliance cannot be confirmed.',
                challenge: row?.mitigation ? `${row.mitigation.text}` : 'Please provide supporting evidence.',
                owner, deadline: '2027-12-31', status: 'draft', aiDrafted: true, kind: 'finding',
                evidenceQuotes: row?.citations.map((c) => `${c.doc} v${c.version} §${c.section}: “${c.quote}”`) ?? [],
              };
          patch(id, (x) => ({ findings: [...x.findings, f] }));
          logAudit({ line: '2lod', modelId: r.modelId, type: 'Finding drafted', detail: `${f.id} drafted from ${reqId} (${ctx.category}) — AI draft, not visible to 1st line.` });
          return f.id;
        },
        updateFinding: (id, findingId, p) => patch(id, (r) => ({ findings: r.findings.map((f) => (f.id === findingId ? { ...f, ...p } : f)) })),
        deleteFinding: (id, findingId) => {
          patch(id, (r) => ({ findings: r.findings.filter((f) => f.id !== findingId) }));
          logAudit({ line: '2lod', modelId: rev(id)?.modelId, type: 'Draft finding discarded', detail: `${findingId} discarded.` });
        },
        issueFinding: (id, findingId) => {
          patch(id, (r) => ({ findings: r.findings.map((f) => (f.id === findingId ? { ...f, status: 'issued', issuedAt: nowISO() } : f)) }));
          const f = rev(id).findings.find((x) => x.id === findingId);
          logAudit({ line: '2lod', modelId: rev(id)?.modelId, type: 'Finding issued', detail: `${findingId} (${f?.severity}) issued: ${f?.title}` });
        },
        recordFindingsExport: (id, packageId, sha256, findingIds) => {
          patch(id, (r) => ({ findingExports: [...r.findingExports, { packageId, sha256, at: nowISO(), findingIds }], status: r.status === 'opinion_issued' ? r.status : 'findings_exported' }));
          logAudit({ line: '2lod', modelId: rev(id)?.modelId, type: 'Findings package exported', detail: `${packageId} exported · ${findingIds.length} issued finding(s): ${findingIds.join(', ')}. Drafts and 2nd line matrix excluded.` });
        },
        importResponses: (id, pkg, sha256) => {
          const r = rev(id);
          if (r.responseImports.some((x) => x.packageId === pkg.manifest.packageId)) return 0;
          let n = 0;
          patch(id, (x) => ({
            responseImports: [...x.responseImports, { packageId: pkg.manifest.packageId, sha256, at: nowISO() }],
            findings: x.findings.map((f) => {
              const resp = pkg.responses.find((rr) => rr.findingId === f.id);
              if (!resp) return f;
              n++;
              return { ...f, status: f.status === 'closed' ? 'closed' : 'response_submitted', response: { plan: resp.plan, evidence: resp.evidence, at: pkg.manifest.createdAt } };
            }),
          }));
          logAudit({ line: '2lod', modelId: r.modelId, type: 'Response package imported', detail: `${pkg.manifest.packageId} imported · integrity verified · ${pkg.responses.length} response(s).` });
          return n || pkg.responses.length;
        },
        closeFinding: (id, findingId, note) => {
          patch(id, (r) => ({ findings: r.findings.map((f) => (f.id === findingId ? { ...f, status: 'closed', closure: { note, at: nowISO(), by: ME } } : f)) }));
          logAudit({ line: '2lod', modelId: rev(id)?.modelId, type: 'Finding closed', detail: `${findingId} closed — ${note}` });
        },
        saveOpinion: (id, o) => patch(id, () => ({ opinion: o })),
        issueOpinion: (id) => {
          patch(id, (r) => ({ opinion: r.opinion ? { ...r.opinion, issuedAt: nowISO() } : r.opinion, status: 'opinion_issued' }));
          const o = rev(id).opinion;
          logAudit({ line: '2lod', modelId: rev(id)?.modelId, type: 'Validation opinion issued', detail: `Opinion “${o?.rating.replace(/_/g, ' ')}” issued for ${id}${o?.conditions.length ? ` with ${o.conditions.length} condition(s)` : ''}.` });
        },
      };
    },
    { name: 'mcw-store2lod', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);

export function useReview(id: string): Review | undefined {
  return use2lod((s) => s.reviews[id]);
}
