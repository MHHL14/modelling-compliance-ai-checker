# Part 1 — Use-case flow for both lines: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inventory-first 1st line workspace and the inbox-first 2nd line workspace with a use-case flow — start a use case (1st line) or a review (2nd line), browse your own library, and take **any** of the 20 models through every step yourself, with nothing pre-filled.

**Architecture:** A new deterministic **scenario engine** (`src/lib/scenario/`) returns everything a model needs for every stage (requirements, document versions, 1st line and 2nd line AI results, draft gaps, evidence files, validation layer, finding templates). MDL-01 + RDS uses the existing hand-crafted pilot seed through an adapter; other models use a generic builder with guaranteed "moments" per model. The 1st line store is re-keyed from model to **use case** (`UC-…`), routes move to `/dev/cases/[caseId]/…`, and both stores seed a small history (two completed use cases, one in progress) from shared pure builders so each line holds its own copy.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Tailwind v4, shadcn/ui (Radix), Zustand + persist, SheetJS, Web Crypto; **Vitest** (new) for the engine and stores.

**Spec:** `docs/superpowers/specs/2026-09-29-use-case-flow-and-real-content-design.md` (sections 5, 8, 9, 10). Parts 2 and 3 of the spec (real requirement library, real model documentation) are separate plans; this plan keeps the current content (18 pilot requirements, ~15 generic requirements per model) and only changes the engine's *interface* so later parts can swap content in.

**Conventions for every task**
- Project root: `model-compliance-workbench/`. Run commands from there.
- UI copy: English, formal and plain; never "verdict" in visible text (use "AI assessment", "outcome"); "1st line / 2nd line", never "1LoD / 2LoD".
- After each task: `npx tsc --noEmit` clean (ignore `.next/types` noise), `npm test` green where tests exist, commit.
- Commit trailer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

---

## File map

**Create**
| File | Responsibility |
|---|---|
| `vitest.config.ts` | Test runner config with `@/` alias |
| `src/lib/scenario/types.ts` | Scenario, DraftGap, EvidenceFile, Plan2lod, FindingTemplate, DraftResult types |
| `src/lib/scenario/families.ts` | Per model-family wording, script checks, evidence file names, finding texts |
| `src/lib/scenario/generic.ts` | `buildGenericScenario(model, component, key)` with guaranteed moments |
| `src/lib/scenario/pilot.ts` | `buildPilotScenario(key)` — adapter over `data/pilot_seed.json` and `src/lib/ai/pilot.ts` |
| `src/lib/scenario/engine.ts` | `getScenario`, `assess1lod`, `affectedBy`, `evidenceDocFor`, `runDraftCheck`, `sectionText`, `assess2lod`, `findingTemplate`, `scriptedDecision` |
| `src/lib/scenario/history.ts` | `HISTORY` specs + pure builders: historic run, submission package, historic findings, historic 2nd line review parts |
| `src/lib/scenario/*.test.ts` | Engine guarantees, pilot fidelity, history determinism |
| `src/stores/store1lod.test.ts`, `src/stores/store2lod.test.ts` | Store behaviour |
| `src/components/dev/useCaseCtx.ts` | 1st line context hook for a use case (replaces `useModelCtx`) |
| `src/components/dev/caseProgress.ts` | Stage progress and cycle helpers |
| `src/components/dev/Seed1lod.tsx` | Seeds 1st line history on first visit |
| `src/components/common/ProgressSegments.tsx` | Five-segment progress bar used on both homes |
| `src/components/common/UseCaseCard.tsx` | Card for a use case / review in a library |
| `src/app/dev/inventory/page.tsx` | Full model inventory (moved from `/dev`) |
| `src/app/dev/new/page.tsx` | "New use case" wizard |
| `src/app/dev/cases/[caseId]/{layout,page}.tsx` and `/{scope,draft,assess,submit,findings}/page.tsx` | Use-case pages (moved from `/dev/models/[id]`) |

**Modify**
| File | Change |
|---|---|
| `package.json` | `test` script, `vitest` devDependency |
| `src/lib/ai/pilot.ts` | Export `GAP_LOCATION`, `GAP_TEXT`, `MIT_2LOD`, `retrievePilotPassages`; keep other exports |
| `src/stores/store1lod.ts` | Rewrite: use cases instead of models; nothing pre-filled; seeding |
| `src/stores/store2lod.ts` | Scenario-driven blind run for all models; reveal guard; seeded history of three reviews |
| `src/stores/storeAudit.ts` | Seed events consistent with the new history (no MDL-01 events before the demo) |
| `src/lib/types.ts` | `RequirementSet.tags?: string[]` and `componentKey?` |
| `src/components/assessment/AssessmentQueue.tsx` | Optional grouping by source document |
| `src/app/dev/page.tsx` | New 1st line home |
| `src/app/dev/layout.tsx` | Mount `Seed1lod` |
| `src/app/val/page.tsx` | New 2nd line home |
| `src/app/val/reviews/[snapshotId]/{layout,scope,assess,compare,findings}/page.tsx` | Scenario data, reveal gating, "last opened" tracking |
| `README.md` | New demo script and design decisions |

**Delete**
`src/app/dev/models/` (whole folder), `src/components/dev/useModelCtx.ts`, `src/components/dev/PilotOnly.tsx`, `src/components/dev/buildSubmission.ts`, `src/components/dev/modelStatus.ts` (replaced by `caseProgress.ts`).

---

### Task 1: Test runner

**Files:** Create `vitest.config.ts`, `src/lib/confidence.test.ts`; Modify `package.json`

- [ ] **Step 1: Install Vitest**

Run: `npm i -D vitest@^3`
Expected: added to devDependencies.

- [ ] **Step 2: Add config**

```ts
// vitest.config.ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
```

In `package.json` scripts add `"test": "vitest run"`.

- [ ] **Step 3: Smoke test on existing code**

```ts
// src/lib/confidence.test.ts
import { describe, expect, it } from 'vitest';
import { deriveConfidence, factors } from './confidence';

describe('deriveConfidence', () => {
  it('is high when only verifiability is weak', () => {
    expect(deriveConfidence(factors({}))).toBe('high');
  });
  it('is medium with exactly one other weak factor', () => {
    expect(deriveConfidence(factors({ location: 'weak' }))).toBe('medium');
  });
  it('is low with any bad factor or two weak factors', () => {
    expect(deriveConfidence(factors({ verifiability: 'bad' }))).toBe('low');
    expect(deriveConfidence(factors({ match: 'weak', coverage: 'weak' }))).toBe('low');
  });
});
```

- [ ] **Step 4: Run** — `npm test` → 3 passed.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "test: add vitest with confidence tests"`

---

### Task 2: Scenario types and family profiles

**Files:** Create `src/lib/scenario/types.ts`, `src/lib/scenario/families.ts`

- [ ] **Step 1: Types**

```ts
// src/lib/scenario/types.ts
import type {
  AssessmentRow, Citation, Confidence, ConfidenceFactors, DocSection, Mitigation,
  PackageDocument, Requirement, ScriptResult, SeedDecision, Verdict,
} from '../types';

export type Component = 'rds' | 'mdd' | 'full';

export interface NotApplicableReq extends Requirement {
  why_not: string;
}

export interface GeneratedSection {
  requirementId: string;
  section: string;
  /** numbers taken from a data source are wrapped in {{ }} */
  text: string;
  sources: string[];
}

export interface DraftGap {
  requirementId: string;
  section: string;
  /** exact sentence to mark red; undefined marks the whole section */
  quote?: string;
  rationale: string;
  mitigation: string;
  generated: GeneratedSection;
}

export interface ScenarioDocument extends PackageDocument {
  title: string;
}

export interface EvidenceFile {
  name: string;
  sizeKb: number;
  doc: ScenarioDocument;
  /** rows that become this outcome once the file is uploaded */
  resolves: Record<string, AssessmentRow>;
}

/** What the independent 2nd line AI concludes; citations are retrieved separately from the frozen package. */
export interface Plan2lod {
  verdict: Verdict;
  rationale: string;
  script: ScriptResult | null;
  mitigation: Mitigation | null;
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

export interface Scenario {
  key: string;
  modelId: string;
  component: Component;
  pilot: boolean;
  requirements: Requirement[];
  notApplicable: NotApplicableReq[];
  applicabilityConfidence: Record<string, number>;
  document: { id: string; title: string; draftVersion: string; finalVersion: string; versions: Record<string, DocSection[]> };
  rows1lod: Record<string, AssessmentRow>;
  scriptedDecisions: Record<string, SeedDecision>;
  draftGaps: DraftGap[];
  evidenceFiles: EvidenceFile[];
  validationLayer: Requirement[];
  plan2lod: Record<string, Plan2lod>;
  /** passages the 2nd line retrieval can find, per requirement (filtered by what is in the package) */
  passages: Record<string, Citation[]>;
  findingTemplates: Record<string, FindingTemplate>;
}

export type DraftStatus = 'addressed' | 'partial' | 'gap' | 'not_in_draft';

export interface DraftResult {
  requirementId: string;
  status: DraftStatus;
  verdict: Verdict;
  citations: Citation[];
  confidenceFactors: ConfidenceFactors;
  confidence: Confidence;
  rationale: string;
  mitigation: Mitigation | null;
  script: ScriptResult | null;
  gapLocation?: { section: string; quote?: string };
  aiDrafted?: boolean;
  checkType: string;
}
```

- [ ] **Step 2: Family profiles**

```ts
// src/lib/scenario/families.ts
import type { Model } from '../types';

export interface FamilyProfile {
  repo: (m: Model) => string;
  scriptId: string;
  scriptLabel: string;
  scriptFailDetail: string;
  evidenceFile: (m: Model) => string;
  evidenceHeading: string;
  replicationDetail: string;
  findingTitle: string;
  findingImpact: string;
  findingChallenge: string;
}

export const shortName = (m: Model) => m.name.replace(/\s*\(.*\)\s*$/, '').trim();

export const FAMILY: Record<Model['model_family'], FamilyProfile> = {
  statistical: {
    repo: (m) => `${m.id.toLowerCase()}-build`,
    scriptId: 'CC-03',
    scriptLabel: 'threshold and segmentation parameters in the build code',
    scriptFailDetail: 'build.py L187: MIN_OBS_SEGMENT = 50 (documented: 100)',
    evidenceFile: (m) => `${shortName(m)} – calibration memo.pdf`,
    evidenceHeading: 'Calibration and conservatism',
    replicationDetail: 'rows and target counts reproduced within 0.2%',
    findingTitle: 'Parameter in build code differs from the documented methodology',
    findingImpact: 'Model outcomes are produced with a parameter that differs from the approved documentation.',
    findingChallenge: 'Since when has the implemented value been used, and which model runs are affected?',
  },
  ml: {
    repo: (m) => `${m.id.toLowerCase()}-training`,
    scriptId: 'CC-07',
    scriptLabel: 'monotonic constraints in the training pipeline',
    scriptFailDetail: 'train.py L96: monotone_constraints missing for "months_in_arrears" (documented: increasing)',
    evidenceFile: (m) => `${shortName(m)} – explainability report.pdf`,
    evidenceHeading: 'Explainability and feature attribution',
    replicationDetail: 'training data reproduced; AUC within 0.3 percentage points',
    findingTitle: 'Monotonic constraint documented but not implemented',
    findingImpact: 'Predictions can move in a direction that contradicts the documented risk logic.',
    findingChallenge: 'Which features lack the documented constraint, and what is the effect on predictions?',
  },
  genai: {
    repo: (m) => `${m.id.toLowerCase()}-assistant`,
    scriptId: 'CC-11',
    scriptLabel: 'guardrail configuration of the deployed assistant',
    scriptFailDetail: 'guardrails.yaml L42: numeric_claims_check = disabled (documented: enabled)',
    evidenceFile: (m) => `${shortName(m)} – guardrail test report.pdf`,
    evidenceHeading: 'Guardrail and groundedness testing',
    replicationDetail: 'evaluation set re-run; groundedness 0.94 against documented 0.95',
    findingTitle: 'Numeric-claims guardrail documented but disabled in deployment',
    findingImpact: 'Drafted credit memos can contain figures that are not grounded in client files.',
    findingChallenge: 'When was the guardrail disabled, and which memos were produced without it?',
  },
  expert: {
    repo: (m) => `${m.id.toLowerCase()}-scoring`,
    scriptId: 'CC-05',
    scriptLabel: 'risk-factor weights in the scoring code',
    scriptFailDetail: 'scoring.sql L63: weight_geography = 0.30 (documented: 0.25)',
    evidenceFile: (m) => `${shortName(m)} – expert panel minutes.pdf`,
    evidenceHeading: 'Expert judgement and approval',
    replicationDetail: 'scores reproduced for all sampled clients',
    findingTitle: 'Risk-factor weight in code differs from the approved methodology',
    findingImpact: 'Risk classification deviates from the approved methodology.',
    findingChallenge: 'Which weights were changed, by whom and with what approval?',
  },
};
```

- [ ] **Step 3:** `npx tsc --noEmit` clean. **Commit** — `feat(scenario): types and model-family profiles`.

---

### Task 3: Generic scenario builder (TDD)

**Files:** Create `src/lib/scenario/generic.ts`, `src/lib/scenario/generic.test.ts`

- [ ] **Step 1: Failing tests — guarantees for every non-pilot model and component**

```ts
// src/lib/scenario/generic.test.ts
import { describe, expect, it } from 'vitest';
import { MODELS } from '../seed';
import { buildGenericScenario } from './generic';
import type { Component } from './types';

const COMPONENTS: Component[] = ['rds', 'mdd', 'full'];
const cases = MODELS.flatMap((m) => COMPONENTS.map((c) => [m.id, c] as const));

describe.each(cases)('generic scenario %s / %s', (modelId, component) => {
  const model = MODELS.find((m) => m.id === modelId)!;
  const sc = buildGenericScenario(model, component, `${modelId}|${component}`);
  const final = sc.document.versions[sc.document.finalVersion];
  const draft = sc.document.versions[sc.document.draftVersion];
  const textOf = (secs: typeof final, s: string) => secs.find((x) => x.section === s)?.text ?? '';
  const rows = Object.values(sc.rows1lod);

  it('has enough requirements and an AI result for each', () => {
    expect(sc.requirements.length).toBeGreaterThanOrEqual(6);
    for (const r of sc.requirements) expect(sc.rows1lod[r.id]).toBeDefined();
  });

  it('cites passages that exist verbatim in the final document', () => {
    for (const row of rows) {
      if (row.verdict === 'not_found') continue;
      expect(row.citations.length).toBeGreaterThan(0);
      for (const c of row.citations) expect(textOf(final, c.section)).toContain(c.quote);
    }
  });

  it('guarantees a low-confidence compliant row, a resolvable not-found row and a partial row', () => {
    expect(rows.some((r) => r.verdict === 'compliant' && r.confidence === 'low' && r.mitigation?.type === 'verification')).toBe(true);
    const nf = rows.find((r) => r.verdict === 'not_found')!;
    expect(nf).toBeDefined();
    const file = sc.evidenceFiles.find((f) => f.resolves[nf.requirementId]);
    expect(file).toBeDefined();
    const resolved = file!.resolves[nf.requirementId];
    expect(resolved.verdict).toBe('compliant');
    expect(textOf(file!.doc.sections, resolved.citations[0].section)).toContain(resolved.citations[0].quote);
    expect(rows.some((r) => r.verdict === 'partial')).toBe(true);
  });

  it('has two draft gaps that are absent in the draft and present in the final version', () => {
    expect(sc.draftGaps).toHaveLength(2);
    for (const g of sc.draftGaps) {
      const q = sc.rows1lod[g.requirementId].citations[0].quote;
      expect(textOf(final, g.section)).toContain(q);
      expect(textOf(draft, g.section)).not.toContain(q);
      expect(g.generated.text.replace(/\{\{|\}\}/g, '')).toContain(q);
    }
  });

  it('plans a failing script check against the low-confidence row and a validation layer with pass and fail', () => {
    const low = rows.find((r) => r.verdict === 'compliant' && r.confidence === 'low')!;
    expect(sc.plan2lod[low.requirementId].script?.result).toBe('fail');
    const results = sc.validationLayer.map((v) => sc.plan2lod[v.id]?.script?.result);
    expect(results).toContain('pass');
    expect(results).toContain('fail');
    const diffs = sc.requirements.filter((r) => sc.plan2lod[r.id].verdict !== sc.rows1lod[r.id].verdict);
    expect(diffs.length).toBeGreaterThanOrEqual(2);
  });

  it('is deterministic', () => {
    expect(buildGenericScenario(model, component, 'x')).toEqual({ ...sc, key: 'x' });
  });
});
```

- [ ] **Step 2: Run** — `npx vitest run src/lib/scenario/generic.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implementation**

```ts
// src/lib/scenario/generic.ts
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
```

Note: `genericRequirements` must yield at least 6 requirements for every model and component; if the test fails for a model, change `genericRequirements` in `src/lib/ai/generic.ts` to fall back to all key topics when the component filter leaves fewer than 6 (replace `const pick = topics.length ? topics : doc.key_topics;` with `const pick = topics.length >= 1 ? topics : doc.key_topics;` and, after the loop, if `out.length < 6`, run a second pass over `ordered` using `doc.key_topics` without the category filter, skipping topics already used).

- [ ] **Step 4: Run** — `npx vitest run src/lib/scenario/generic.test.ts` → all pass (60 describe blocks × 6 tests).
- [ ] **Step 5: Commit** — `feat(scenario): generic scenario builder with guaranteed moments`.

---

### Task 4: Pilot adapter (TDD)

**Files:** Modify `src/lib/ai/pilot.ts` (exports); Create `src/lib/scenario/pilot.ts`, `src/lib/scenario/pilot.test.ts`

- [ ] **Step 1: Export helpers from `src/lib/ai/pilot.ts`**

Change `const GAP_LOCATION`, `const GAP_TEXT`, `const MIT_2LOD` to `export const`. Add:

```ts
/** Candidate passages for the 2nd line retrieval (filtered later by what is in the package). */
export function retrievePilotPassages(reqId: string): Citation[] {
  const base = PILOT.assessment_1lod[reqId]?.citations ?? [];
  const mdd = { doc: 'EVD-01-MDD', version: '4.0', section: '7.2', quote: 'A MoC of +6% relative is applied to the long-run average default rate' };
  switch (reqId) {
    case 'REQ-D21': return [mdd, ...base];
    case 'REQ-D09': return [{ doc: 'EVD-01-DODMEMO', version: '1.0', section: '3', quote: 'remains in probation for 3 months (12 months for distressed restructurings)' }];
    case 'VAL-01': return [{ doc: RDS_ID, version: '1.0', section: '8', quote: 'A full rebuild reproduces the RDS row count and default count exactly' }];
    case 'VAL-02': return [{ doc: RDS_ID, version: '1.0', section: '3.3', quote: 'materiality threshold of EUR 100 absolute and 1% relative' }];
    case 'VAL-03': return [{ ...mdd, quote: 'A MoC of +6% relative is applied' }, { doc: RDS_ID, version: '1.0', section: '6.2', quote: 'The default flag for 2012–2015 was approximated' }];
    case 'VAL-04': return [{ doc: RDS_ID, version: '1.0', section: '5.1', quote: 'PSI on loan-to-value bucket, loan age and interest-only share' }];
    default: return base;
  }
}
```

- [ ] **Step 2: Failing test — pilot fidelity**

```ts
// src/lib/scenario/pilot.test.ts
import { describe, expect, it } from 'vitest';
import { PILOT } from '../seed';
import { buildPilotScenario } from './pilot';

describe('pilot scenario', () => {
  const sc = buildPilotScenario('MDL-01|rds');
  it('keeps the 18 shared requirements and 4 validation-layer requirements', () => {
    expect(sc.requirements.map((r) => r.id)).toEqual(PILOT.requirements.filter((r) => r.layer === 'shared').map((r) => r.id));
    expect(sc.validationLayer.map((r) => r.id)).toEqual(['VAL-01', 'VAL-02', 'VAL-03', 'VAL-04']);
  });
  it('keeps the demo moments', () => {
    expect(sc.rows1lod['REQ-D07'].confidence).toBe('low');
    expect(sc.rows1lod['REQ-D21'].verdict).toBe('not_found');
    expect(sc.draftGaps.map((g) => g.requirementId)).toEqual(['REQ-D12b', 'REQ-D12c']);
    expect(sc.plan2lod['VAL-02'].script?.result).toBe('fail');
    const mdd = sc.evidenceFiles.find((f) => f.name === 'MDD PD-MORT-NL v4.pdf')!;
    expect(mdd.resolves['REQ-D21'].verdict).toBe('compliant');
    expect(sc.document.draftVersion).toBe('0.7');
    expect(sc.findingTemplates['REQ-D07'].id).toBe('F-07');
  });
  it('combines initial and scripted decisions for the fast-forward', () => {
    expect(Object.keys(sc.scriptedDecisions)).toHaveLength(18);
  });
});
```

- [ ] **Step 3: Implementation**

```ts
// src/lib/scenario/pilot.ts
import {
  GAP_LOCATION, GAP_TEXT, generateSectionText, MIT_2LOD, PILOT_APPLICABILITY_CONFIDENCE, PILOT_NOT_APPLICABLE,
  pilotReassess1lod, pilotRow1lod, RDS_ID, RDS_TITLE, retrievePilotPassages,
} from '../ai/pilot';
import { PILOT, PILOT_MODEL_ID, PILOT_SHARED_REQS, PILOT_VAL_REQS, UPLOAD_EVIDENCE } from '../seed';
import type { AssessmentRow } from '../types';
import type { DraftGap, EvidenceFile, FindingTemplate, Plan2lod, Scenario } from './types';

export function buildPilotScenario(key: string): Scenario {
  const rows1lod: Record<string, AssessmentRow> = Object.fromEntries(PILOT_SHARED_REQS.map((r) => [r.id, pilotRow1lod(r.id)!]));
  const draftGaps: DraftGap[] = ['REQ-D12b', 'REQ-D12c'].map((id) => ({
    requirementId: id,
    section: GAP_LOCATION[id].section,
    quote: GAP_LOCATION[id].quote,
    rationale: GAP_TEXT[id].rationale,
    mitigation: GAP_TEXT[id].mitigation,
    generated: generateSectionText(id),
  }));
  const evidenceFiles: EvidenceFile[] = Object.entries(UPLOAD_EVIDENCE).map(([name, e]) => {
    const resolves: Record<string, AssessmentRow> = {};
    for (const id of ['REQ-D21', 'REQ-D09']) {
      const r = pilotReassess1lod(id, [name]);
      if (r) resolves[id] = r;
    }
    return { name, sizeKb: name.startsWith('MDD') ? 2355 : 348, doc: { id: e.docId, version: e.version, title: e.title, sections: e.sections }, resolves };
  });
  const plan2lod: Record<string, Plan2lod> = {};
  for (const [id, s] of Object.entries(PILOT.assessment_2lod_blind)) {
    plan2lod[id] = { verdict: s.verdict, rationale: s.rationale, script: s.script, mitigation: MIT_2LOD[id] ?? PILOT.assessment_1lod[id]?.mitigation ?? null };
  }
  const passages = Object.fromEntries([...PILOT_SHARED_REQS, ...PILOT_VAL_REQS].map((r) => [r.id, retrievePilotPassages(r.id)]));
  const findingTemplates: Record<string, FindingTemplate> = {};
  for (const f of PILOT.draft_findings_2lod) {
    const refs = f.requirement.split(' / ');
    for (const ref of refs) {
      findingTemplates[ref] = { id: f.id, requirementRefs: refs, severity: f.severity, title: f.title, observation: f.observation, impact: f.impact, challenge: f.challenge, deadline: f.deadline };
    }
  }
  return {
    key, modelId: PILOT_MODEL_ID, component: 'rds', pilot: true,
    requirements: PILOT_SHARED_REQS,
    notApplicable: PILOT_NOT_APPLICABLE,
    applicabilityConfidence: PILOT_APPLICABILITY_CONFIDENCE,
    document: { id: RDS_ID, title: RDS_TITLE, draftVersion: '0.7', finalVersion: '1.0', versions: PILOT.evidence_document.versions },
    rows1lod,
    scriptedDecisions: { ...PILOT.decisions_1lod_initial, ...PILOT.decisions_1lod_scripted },
    draftGaps, evidenceFiles,
    validationLayer: PILOT_VAL_REQS,
    plan2lod, passages, findingTemplates,
  };
}
```

`generateSectionText` in `src/lib/ai/pilot.ts` returns a type named `GeneratedSection` that is structurally identical to the scenario type; no change needed.

- [ ] **Step 4: Run** — `npx vitest run src/lib/scenario/pilot.test.ts` → pass.
- [ ] **Step 5: Commit** — `feat(scenario): pilot adapter over the existing seed`.

---

### Task 5: Engine functions (TDD)

**Files:** Create `src/lib/scenario/engine.ts`, `src/lib/scenario/engine.test.ts`

- [ ] **Step 1: Failing tests**

```ts
// src/lib/scenario/engine.test.ts
import { describe, expect, it } from 'vitest';
import { assess1lod, assess2lod, getScenario, runDraftCheck, scriptedDecision } from './engine';

describe('engine', () => {
  it('memoises scenarios per model, component and tags', () => {
    expect(getScenario('MDL-15', 'full')).toBe(getScenario('MDL-15', 'full'));
    expect(getScenario('MDL-01', 'rds').pilot).toBe(true);
    expect(getScenario('MDL-01', 'mdd').pilot).toBe(false);
  });

  it('runs the draft check with gaps in the draft and none in the final version', () => {
    for (const id of ['MDL-01', 'MDL-15', 'MDL-20', 'MDL-07']) {
      const sc = getScenario(id, id === 'MDL-01' ? 'rds' : 'full');
      const draft = runDraftCheck(sc, sc.document.draftVersion, sc.requirements, {});
      const final = runDraftCheck(sc, sc.document.finalVersion, sc.requirements, {});
      expect(draft.filter((r) => r.status === 'gap').length).toBe(2);
      expect(final.filter((r) => r.status === 'gap').length).toBe(0);
    }
  });

  it('treats AI-drafted inserted text as addressed but flagged', () => {
    const sc = getScenario('MDL-15', 'full');
    const g = sc.draftGaps[0];
    const res = runDraftCheck(sc, sc.document.draftVersion, sc.requirements, { [g.section]: [g.generated.text] });
    const r = res.find((x) => x.requirementId === g.requirementId)!;
    expect(r.status).toBe('addressed');
    expect(r.aiDrafted).toBe(true);
  });

  it('re-assesses a not-found row when the named evidence file is uploaded', () => {
    const sc = getScenario('MDL-20', 'full');
    const file = sc.evidenceFiles[0];
    const reqId = Object.keys(file.resolves)[0];
    const req = sc.requirements.find((r) => r.id === reqId)!;
    expect(assess1lod(sc, req, []).verdict).toBe('not_found');
    expect(assess1lod(sc, req, [file.name]).verdict).toBe('compliant');
  });

  it('builds 2nd line rows only from documents in the package', () => {
    const sc = getScenario('MDL-15', 'full');
    const docs = [{ id: sc.document.id, version: sc.document.finalVersion, sections: sc.document.versions[sc.document.finalVersion] }];
    const nfId = Object.keys(sc.evidenceFiles[0].resolves)[0];
    const nfReq = sc.requirements.find((r) => r.id === nfId)!;
    expect(assess2lod(sc, nfReq, docs).verdict).toBe('not_found');
    const withEvidence = [...docs, sc.evidenceFiles[0].doc];
    expect(assess2lod(sc, nfReq, withEvidence).verdict).toBe('compliant');
    const val02 = sc.validationLayer.find((v) => v.id === 'VAL-02')!;
    expect(assess2lod(sc, val02, docs).script?.result).toBe('fail');
  });

  it('turns a scripted edit into an accept when the AI already agrees', () => {
    const sc = getScenario('MDL-01', 'rds');
    const reassessed = sc.evidenceFiles.find((f) => f.name.startsWith('MDD'))!.resolves['REQ-D21'];
    expect(scriptedDecision(sc, reassessed).decision).toBe('accepted');
  });
});
```

- [ ] **Step 2: Run** → FAIL (module not found).

- [ ] **Step 3: Implementation**

```ts
// src/lib/scenario/engine.ts
import { evidenceDocFor as uploadEvidenceDoc, modelSpecificRow1lod } from '../ai/pilot';
import { deriveConfidence, factors } from '../confidence';
import { getModel, PILOT_MODEL_ID } from '../seed';
import type { AssessmentRow, ConfidenceFactors, Mitigation, PackageDocument, Requirement, Verdict } from '../types';
import { buildGenericScenario } from './generic';
import { buildPilotScenario } from './pilot';
import type { Component, DraftResult, DraftStatus, FindingTemplate, GeneratedSection, Scenario, ScenarioDocument } from './types';

const cache = new Map<string, Scenario>();

export function getScenario(modelId: string, component: Component, tags?: string[]): Scenario {
  const model = getModel(modelId);
  if (!model) throw new Error(`Unknown model ${modelId}`);
  const t = [...(tags ?? model.tags)].sort();
  const key = `${modelId}|${component}|${t.join(',')}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const sc = modelId === PILOT_MODEL_ID && component === 'rds' ? buildPilotScenario(key) : buildGenericScenario({ ...model, tags: t }, component, key);
  cache.set(key, sc);
  return sc;
}

export function assess1lod(sc: Scenario, req: Requirement, evidenceNames: string[]): AssessmentRow {
  if (req.layer === 'model_specific') return modelSpecificRow1lod(req);
  for (const f of sc.evidenceFiles) if (evidenceNames.includes(f.name) && f.resolves[req.id]) return f.resolves[req.id];
  return sc.rows1lod[req.id] ?? modelSpecificRow1lod(req);
}

export function affectedBy(sc: Scenario, fileName: string): string[] {
  return Object.keys(sc.evidenceFiles.find((f) => f.name === fileName)?.resolves ?? {});
}

export function evidenceDocFor(sc: Scenario, fileName: string, textContent?: string): ScenarioDocument {
  return sc.evidenceFiles.find((f) => f.name === fileName)?.doc ?? uploadEvidenceDoc(fileName, textContent);
}

const stripMarks = (s: string) => s.replace(/\{\{|\}\}/g, '');

export function runDraftCheck(sc: Scenario, version: string, requirements: Requirement[], aiBlocks: Record<string, string[]>): DraftResult[] {
  const sections = sc.document.versions[version] ?? [];
  const textOf = (sec: string) => sections.find((s) => s.section === sec)?.text ?? '';
  const allAi = Object.values(aiBlocks).flat().map(stripMarks).join(' ');
  return requirements.map((req) => {
    const seed = sc.rows1lod[req.id];
    const gap = sc.draftGaps.find((g) => g.requirementId === req.id);
    if (!seed) {
      const cf = factors({ match: 'bad', coverage: 'bad', location: 'bad' }, { match: 'No passage found in the draft.' });
      return { requirementId: req.id, status: 'not_in_draft', verdict: 'not_found', citations: [], confidenceFactors: cf, confidence: deriveConfidence(cf), rationale: 'No passage in the draft addresses this requirement.', mitigation: { type: 'verification', text: 'Confirm where this requirement is evidenced, or add a paragraph to the document.' }, script: null, checkType: req.check_type };
    }
    const citations = seed.citations.filter((c) => c.doc === sc.document.id).map((c) => ({ ...c, version }));
    const missing = citations.filter((c) => !textOf(c.section).includes(c.quote));
    const coveredByAi = missing.length > 0 && missing.every((c) => allAi.includes(c.quote));
    if (missing.length > 0 && !coveredByAi) {
      const cf = factors({ match: 'bad', coverage: 'bad', location: 'weak' }, { match: 'Expected passage not found in this draft.', coverage: gap?.rationale ?? 'Required elements not yet written.' });
      return {
        requirementId: req.id, status: 'gap', verdict: 'non_compliant', citations: citations.filter((c) => !missing.includes(c)), confidenceFactors: cf, confidence: deriveConfidence(cf),
        rationale: gap?.rationale ?? 'The passage that would address this requirement is not yet in the draft.',
        mitigation: { type: 'remediation', text: gap?.mitigation ?? 'Add the missing passage to the draft.' },
        script: seed.script ?? null, gapLocation: gap ? { section: gap.section, quote: gap.quote } : { section: missing[0].section }, checkType: req.check_type,
      };
    }
    if (coveredByAi) {
      const cf = factors({}, { verifiability: 'AI-drafted text — confirm the figures against the source before relying on this outcome.' });
      return { requirementId: req.id, status: 'addressed', verdict: 'compliant', citations, confidenceFactors: cf, confidence: deriveConfidence(cf), rationale: `${seed.rationale} (evidence is AI-drafted text inserted in this draft)`, mitigation: null, script: seed.script ?? null, aiDrafted: true, checkType: req.check_type };
    }
    const status: DraftStatus = seed.verdict === 'compliant' ? 'addressed' : seed.verdict === 'partial' ? 'partial' : seed.verdict === 'not_found' ? 'not_in_draft' : 'gap';
    return { requirementId: req.id, status, verdict: seed.verdict, citations, confidenceFactors: seed.confidenceFactors, confidence: seed.confidence, rationale: seed.rationale, mitigation: seed.mitigation, script: seed.script ?? null, checkType: req.check_type };
  });
}

export function sectionText(sc: Scenario, reqId: string, mitigationText?: string): GeneratedSection {
  const gap = sc.draftGaps.find((g) => g.requirementId === reqId);
  if (gap) return gap.generated;
  const sec = sc.rows1lod[reqId]?.citations[0]?.section ?? '1';
  return {
    requirementId: reqId, section: sec, sources: ['model_data_profile', 'dq_report_v2'],
    text: `${mitigationText ? mitigationText.replace(/^Add /, 'This section adds ').replace(/\.$/, '') : 'This section documents the required analysis'}. Results are reproduced from the profiling run ({{run 2027-06-10}}).`,
  };
}

export function assess2lod(sc: Scenario, req: Requirement, docs: PackageDocument[]): AssessmentRow {
  const plan = sc.plan2lod[req.id];
  let citations = (sc.passages[req.id] ?? [])
    .filter((c) => {
      const s = docs.find((d) => d.id === c.doc)?.sections.find((x) => x.section === c.section);
      return !!s && s.text.includes(c.quote);
    })
    .map((c) => ({ ...c, version: docs.find((d) => d.id === c.doc)!.version }));
  let verdict: Verdict = plan?.verdict ?? 'not_found';
  let rationale = plan?.rationale ?? 'No passage in the submitted documents addresses this requirement.';
  const script = plan?.script ?? null;
  if (!plan && req.layer === 'model_specific') {
    citations = [];
    rationale = 'The submitted documentation does not address this model-specific obligation; the evidence may sit in another document.';
  }
  if (citations.length === 0 && !script && verdict !== 'not_applicable') {
    if (verdict !== 'not_found') rationale = `No supporting passage in the submitted documents. ${rationale}`;
    verdict = 'not_found';
  }
  let cf: ConfidenceFactors;
  if (verdict === 'compliant') cf = factors(script?.result === 'pass' ? { verifiability: 'good' } : {}, script?.result === 'pass' ? { verifiability: `Confirmed by script ${script.id}.` } : { verifiability: 'Documentation only.' });
  else if (verdict === 'partial') cf = factors({ coverage: 'weak' }, { coverage: rationale });
  else if (verdict === 'non_compliant' && script?.result === 'fail') cf = factors({ consistency: 'bad', verifiability: 'good' }, { consistency: `Documentation contradicts the implementation: ${script.detail}.`, verifiability: `Script ${script.id} executed on the linked repository.` });
  else if (verdict === 'non_compliant') cf = factors({ consistency: 'bad' }, { consistency: rationale });
  else cf = factors({ match: 'bad', coverage: 'bad', location: 'bad' }, { match: 'No passage found in the frozen package documents.' });
  const confidence = deriveConfidence(cf);
  let mitigation: Mitigation | null = plan?.mitigation ?? null;
  if (!mitigation && (verdict === 'partial' || verdict === 'non_compliant')) mitigation = sc.rows1lod[req.id]?.mitigation ?? { type: 'remediation', text: 'Complete the missing elements identified in the rationale.' };
  if (!mitigation && verdict === 'not_found') mitigation = { type: 'verification', text: req.layer === 'model_specific' ? 'Request evidence that the obligation is implemented before issuing the opinion.' : 'Request the supporting evidence from the 1st line through a finding.' };
  if (!mitigation && confidence === 'low') mitigation = { type: 'verification', text: 'Obtain additional evidence to confirm the outcome.' };
  return { requirementId: req.id, verdict, citations, confidenceFactors: cf, confidence, rationale, mitigation, script };
}

export function findingTemplate(sc: Scenario, reqId: string): FindingTemplate | undefined {
  return sc.findingTemplates[reqId];
}

/** Presenter fast-forward and seeded history use the same scripted decisions. */
export function scriptedDecision(sc: Scenario, row: AssessmentRow): { decision: 'accepted' | 'edited' | 'rejected'; finalVerdict?: Verdict; reason?: string } {
  const s = sc.scriptedDecisions[row.requirementId];
  if (s) {
    if (s.decision === 'edited' && s.final_verdict === row.verdict) return { decision: 'accepted', reason: s.reason };
    return { decision: s.decision, finalVerdict: s.final_verdict, reason: s.reason };
  }
  if (row.verdict === 'not_found' && row.mitigation?.type === 'justification') {
    return { decision: 'edited', finalVerdict: 'not_applicable', reason: 'Evidenced outside the assessed component.' };
  }
  return { decision: 'accepted', reason: row.confidence === 'high' ? undefined : 'Reviewed — evidence sufficient.' };
}
```

Also move `DraftResult`/`DraftStatus`/`GeneratedSection` users: `src/lib/ai/pilot.ts` keeps its own copies until Task 7 deletes the old `draftCheck` usage; no change needed now.

- [ ] **Step 4: Run** — `npm test` → all pass.
- [ ] **Step 5: Commit** — `feat(scenario): engine functions for all stages`.

---

### Task 6: History builders (TDD)

**Files:** Create `src/lib/scenario/history.ts`, `src/lib/scenario/history.test.ts`; Modify `src/lib/types.ts`

- [ ] **Step 1: Extend `RequirementSet`** in `src/lib/types.ts`:

```ts
  lockedAt?: string;
  lockedBy?: string;
  /** model characteristics used for the set (prototype extension) */
  tags?: string[];
  componentKey?: 'rds' | 'mdd' | 'full';
}
```

- [ ] **Step 2: Failing tests**

```ts
// src/lib/scenario/history.test.ts
import { describe, expect, it } from 'vitest';
import { verifyPackage } from '../packages';
import { buildHistoricCase, historicPackage, HISTORY } from './history';

describe('history', () => {
  it('builds three use cases: two completed, one submitted', () => {
    expect(HISTORY.map((h) => [h.modelId, h.status])).toEqual([
      ['MDL-07', 'completed'],
      ['MDL-02', 'completed'],
      ['MDL-04', 'active'],
    ]);
  });
  it('produces identical, verifiable packages on every build', async () => {
    for (const spec of HISTORY) {
      const a = await historicPackage(spec);
      const b = await historicPackage(spec);
      expect(a.manifest.sha256).toBe(b.manifest.sha256);
      expect(a.manifest.packageId).toBe(spec.packageId);
      const v = await verifyPackage(JSON.stringify(a), 'submission');
      expect(v.ok).toBe(true);
    }
  });
  it('decides every row of a historic run', () => {
    const c = buildHistoricCase(HISTORY[0]);
    expect(c.run.rows.every((r) => r.decision)).toBe(true);
    expect(c.findings.every((f) => f.status === 'closed')).toBe(true);
  });
});
```

- [ ] **Step 3: Implementation**

```ts
// src/lib/scenario/history.ts
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
```

- [ ] **Step 4: Run** — `npm test` → pass.
- [ ] **Step 5: Commit** — `feat(scenario): deterministic history builders`.

---

### Task 7: 1st line store — use cases (TDD)

**Files:** Rewrite `src/stores/store1lod.ts`; Create `src/stores/store1lod.test.ts`; Create `src/components/dev/caseProgress.ts`

- [ ] **Step 1: Failing tests**

```ts
// src/stores/store1lod.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { verifyPackage } from '@/lib/packages';
import { getModel } from '@/lib/seed';
import { setRequirements, use1lod } from './store1lod';

const attrs = (id: string) => {
  const m = getModel(id)!;
  return { portfolio: m.portfolio, purpose: m.purpose, methodology: m.methodology, model_family: m.model_family, regulatory_use: m.regulatory_use, tier: m.tier, tags: m.tags };
};

describe('store1lod', () => {
  beforeEach(() => use1lod.setState(use1lod.getInitialState(), true));

  it('seeds two completed use cases and one submitted use case, without the pilot', async () => {
    await use1lod.getState().ensureSeed();
    const cases = Object.values(use1lod.getState().cases);
    expect(cases.map((c) => [c.modelId, c.status, !!c.submission])).toEqual([
      ['MDL-07', 'completed', true],
      ['MDL-02', 'completed', true],
      ['MDL-04', 'active', true],
    ]);
    expect(cases.some((c) => c.modelId === 'MDL-01')).toBe(false);
  });

  it('creates a use case with nothing pre-filled', () => {
    const id = use1lod.getState().createCase({ modelId: 'MDL-01', cycle: 'Initial validation 2027', component: 'rds', attributes: attrs('MDL-01') });
    const c = use1lod.getState().cases[id];
    expect(c.generatedAt).toBeUndefined();
    expect(Object.keys(c.reqStatus)).toHaveLength(0);
    expect(c.run).toBeUndefined();
    expect(c.draftCheck).toBeUndefined();
  });

  it('refuses a second active use case for the same model', () => {
    const s = use1lod.getState();
    const a = s.createCase({ modelId: 'MDL-15', cycle: 'Annual review 2027', component: 'full', attributes: attrs('MDL-15') });
    const b = s.createCase({ modelId: 'MDL-15', cycle: 'Other 2027', component: 'full', attributes: attrs('MDL-15') });
    expect(b).toBe(a);
  });

  it('only locks when every requirement has a decision', () => {
    const s = use1lod.getState();
    const id = s.createCase({ modelId: 'MDL-15', cycle: 'Annual review 2027', component: 'full', attributes: attrs('MDL-15') });
    s.generate(id);
    expect(s.lock(id)).toBe(false);
    const ids = Object.keys(use1lod.getState().cases[id].reqStatus);
    s.setReqStatus(id, ids, 'accepted');
    expect(s.lock(id)).toBe(true);
    expect(setRequirements(use1lod.getState().cases[id])).toHaveLength(ids.length);
  });

  it('runs an assessment with no decisions and fast-forwards all rows', () => {
    const s = use1lod.getState();
    const id = s.createCase({ modelId: 'MDL-20', cycle: 'Initial validation 2027', component: 'full', attributes: attrs('MDL-20') });
    s.generate(id);
    s.setReqStatus(id, Object.keys(use1lod.getState().cases[id].reqStatus), 'accepted');
    s.lock(id);
    s.runAssessment(id);
    expect(use1lod.getState().cases[id].run!.rows.every((r) => !r.decision)).toBe(true);
    s.fastForward(id);
    expect(use1lod.getState().cases[id].run!.rows.every((r) => r.decision)).toBe(true);
  });

  it('builds a verifiable submission package for any model', async () => {
    const s = use1lod.getState();
    const id = s.createCase({ modelId: 'MDL-07', cycle: 'Annual review 2027', component: 'full', attributes: attrs('MDL-07') });
    s.generate(id);
    s.setReqStatus(id, Object.keys(use1lod.getState().cases[id].reqStatus), 'accepted');
    s.lock(id);
    s.runAssessment(id);
    s.fastForward(id);
    const pkg = await s.buildSubmission(id);
    expect((await verifyPackage(JSON.stringify(pkg), 'submission')).ok).toBe(true);
    expect(pkg.requirementSet.componentKey).toBe('full');
  });
});
```

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Rewrite `src/stores/store1lod.ts`**

```ts
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
```

Persist `version: 2` discards old v1 data (model-keyed) — acceptable in a prototype; the README notes that a *Reset demo data* may be needed after upgrading.

- [ ] **Step 4: Progress helper**

```ts
// src/components/dev/caseProgress.ts
import type { Model } from '@/lib/types';
import type { UseCase } from '@/stores/store1lod';

export type SegmentState = 'done' | 'current' | 'todo';
export const CASE_STAGES = ['Scoping', 'Draft check', 'Self-assessment', 'Submit', 'Findings'] as const;

export function caseSegments(c: UseCase): SegmentState[] {
  const scoping = c.lockedAt ? 'done' : 'current';
  const draft = c.draftCheck ? 'done' : c.lockedAt ? 'current' : 'todo';
  const decided = c.run ? c.run.rows.every((r) => r.decision) : false;
  const assess = c.submission || decided ? 'done' : c.lockedAt ? 'current' : 'todo';
  const submit = c.submission ? 'done' : decided ? 'current' : 'todo';
  const findings = c.status === 'completed' || c.responseExports.length ? 'done' : c.findings.length ? 'current' : 'todo';
  const s: SegmentState[] = [scoping, draft, assess, submit, findings];
  // only the first not-done stage is "current"
  let seen = false;
  return s.map((x) => {
    if (x === 'done') return x;
    if (!seen) {
      seen = true;
      return 'current';
    }
    return 'todo';
  });
}

export function caseStageLabel(c: UseCase): string {
  if (c.status === 'completed') return `Completed · ${c.completedAt?.slice(0, 10) ?? ''}`;
  if (c.findings.length) return 'Findings received';
  if (c.submission) return 'Submitted — awaiting validation';
  const i = caseSegments(c).indexOf('current');
  return CASE_STAGES[Math.max(0, i)];
}

export function defaultCycle(m: Model): string {
  if (m.lifecycle_stage.startsWith('Live')) return 'Annual review 2027';
  if (m.lifecycle_stage.startsWith('Change')) return 'Material change 2027';
  return 'Initial validation 2027';
}
```

- [ ] **Step 5: Run** — `npm test` → pass. (Type errors in pages that still import the old API are expected until Task 9; do not run `tsc` for the app yet.)
- [ ] **Step 6: Commit** — `feat(1st line): use-case store with no pre-filled work and seeded history`.

---

### Task 8: 2nd line store — scenario-driven, reveal guard, seeded history (TDD)

**Files:** Modify `src/stores/store2lod.ts`; Create `src/stores/store2lod.test.ts`

- [ ] **Step 1: Failing tests**

```ts
// src/stores/store2lod.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { historicPackage, HISTORY } from '@/lib/scenario/history';
import { use2lod } from './store2lod';

describe('store2lod', () => {
  beforeEach(() => use2lod.setState(use2lod.getInitialState(), true));

  it('seeds two completed reviews and MDL-04 in review, not revealed, all rows decided', async () => {
    await use2lod.getState().ensureSeed();
    const r = use2lod.getState().reviews;
    expect(Object.keys(r).sort()).toEqual(['SUB-MDL-02-20260612', 'SUB-MDL-04-20270422', 'SUB-MDL-07-20260930']);
    const mdl04 = r['SUB-MDL-04-20270422'];
    expect(mdl04.revealedAt).toBeUndefined();
    expect(mdl04.run!.rows.every((x) => x.decision)).toBe(true);
    expect(r['SUB-MDL-07-20260930'].status).toBe('opinion_issued');
  });

  it('runs a blind assessment for any model with a failing script check', async () => {
    const pkg = await historicPackage(HISTORY[0]);
    const s = use2lod.getState();
    const id = s.importSubmission({ ...pkg }, pkg.manifest.sha256).snapshotId;
    s.runBlind(id);
    const rows = use2lod.getState().reviews[id].run!.rows;
    expect(rows.every((x) => !x.decision)).toBe(true);
    expect(rows.some((x) => x.script?.result === 'fail')).toBe(true);
  });

  it('refuses the reveal until every row has a validator decision', async () => {
    const pkg = await historicPackage(HISTORY[1]);
    const s = use2lod.getState();
    const id = s.importSubmission(pkg, pkg.manifest.sha256).snapshotId;
    s.runBlind(id);
    expect(s.reveal(id)).toBe(false);
    s.decide(id, use2lod.getState().reviews[id].run!.rows.map((r) => r.requirementId), { decision: 'accepted' });
    expect(s.reveal(id)).toBe(true);
  });
});
```

(Seeding and import use the same review ID; the tests reset state before each case, so there is no collision.)

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Modify `src/stores/store2lod.ts`**

Replace the imports of `applicableDocs`, `genericEvidenceDoc`, `genericRequirements`, `genericRow`, `pilotRow2lod`, `PILOT`, `PILOT_VAL_REQS` with:

```ts
import { assess2lod, findingTemplate, getScenario } from '@/lib/scenario/engine';
import { historicBlindRows, historicFindings, historicPackage, HISTORY } from '@/lib/scenario/history';
import type { Component } from '@/lib/scenario/types';
```

Add to `Review`: `updatedAt: string; completedAt?: string;`.

Add a helper and replace `validationLayerFor`:

```ts
const LABEL_TO_COMPONENT: Record<string, Component> = { 'RDS documentation': 'rds', 'Methodology (MDD)': 'mdd', 'Full model': 'full' };

export function reviewScenario(r: { modelId: string; pkg: SubmissionPackage }) {
  const comp = r.pkg.requirementSet.componentKey ?? LABEL_TO_COMPONENT[r.pkg.requirementSet.component] ?? 'full';
  return getScenario(r.modelId, comp, r.pkg.requirementSet.tags);
}
```

Replace `buildSeedReview` with a history seed:

```ts
async function buildSeedReviews(): Promise<Record<string, Review>> {
  const out: Record<string, Review> = {};
  for (const spec of HISTORY) {
    const pkg = await historicPackage(spec);
    const sc = getScenario(spec.modelId, spec.component);
    const rows = historicBlindRows(spec, pkg);
    const completed = spec.status === 'completed';
    const findings = completed ? historicFindings(spec) : [];
    const high = findings.filter((f) => f.severity === 'high');
    out[pkg.manifest.packageId] = {
      snapshotId: pkg.manifest.packageId, modelId: spec.modelId, importedAt: spec.submittedAt, updatedAt: spec.closedAt ?? spec.blindRunAt,
      completedAt: completed ? spec.closedAt : undefined, sha256: pkg.manifest.sha256, pkg, status: completed ? 'opinion_issued' : 'in_review',
      validationLayer: sc.validationLayer, scopingChallenges: [],
      run: {
        id: `RUN-2L-${spec.modelId.slice(4)}${spec.blindRunAt.slice(2, 4)}`, line: '2lod', modelId: spec.modelId, requirementSetId: pkg.manifest.requirementSetId,
        libraryVersion: pkg.manifest.libraryVersion, documentVersions: pkg.manifest.documentVersions, startedAt: spec.blindRunAt, provider: 'simulated',
        inputsSummary: `Inputs: ${pkg.documents.length} documents, ${rows.length} requirements. 1st line conclusions: not provided (independence).`, rows,
      },
      revealedAt: spec.revealedAt,
      findings,
      findingExports: completed ? [{ packageId: `FND-${spec.modelId}-${spec.revealedAt!.slice(0, 10).replace(/-/g, '')}`, sha256: '', at: spec.revealedAt!, findingIds: findings.map((f) => f.id) }] : [],
      responseImports: [],
      opinion: completed
        ? { rating: high.length ? 'fit_with_conditions' : 'fit', drafted: true, issuedAt: spec.opinionAt, conditions: high.map((f) => `${f.id} — ${f.title}: remediation to be completed and evidenced by ${f.deadline}.`), rationale: `Independent validation of ${getModel(spec.modelId)?.name} (${spec.cycle}) against the frozen submission ${pkg.manifest.packageId}.` }
        : undefined,
    };
  }
  return out;
}
```

In the store body:
- `ensureSeed`: call `buildSeedReviews()` and merge `{ ...seed, ...s.reviews }`.
- `importSubmission`: set `validationLayer: reviewScenario({ modelId: pkg.manifest.modelId, pkg }).validationLayer`, `updatedAt: nowISO()`.
- `runBlind`: `const sc = reviewScenario(r); const rows = reqs.map((req) => assess2lod(sc, req, r.pkg.documents));` (replaces the pilot/generic branch).
- `reveal` returns `boolean`: `if (!r.run || r.revealedAt || r.run.rows.some((x) => !x.decision)) return false;` … `return true;` Update the `State2` signature to `reveal: (id: string) => boolean`.
- `draftFindingFromRow`: replace the pilot `seed` lookup with `const t = findingTemplate(reviewScenario(r), reqId);` and, when `t` exists, build the finding from `t` (id `t.id ?? nextFindingId(r)`, `requirementRefs: t.requirementRefs`, and the evidence quotes as today). Keep the generic fallback unchanged.
- `patch` sets `updatedAt: nowISO()` on every change.
- Persist `version: 2`.
- Delete `validationLayerFor` and its users; the Scope page reads `review.validationLayer` (unchanged).

- [ ] **Step 4: Run** — `npm test` → pass.
- [ ] **Step 5: Commit** — `feat(2nd line): scenario-driven blind run, reveal guard, seeded history`.

---

### Task 9: 1st line routes and context

**Files:** Create `src/components/dev/useCaseCtx.ts`, `src/components/dev/Seed1lod.tsx`; Move `src/app/dev/models/[id]/*` → `src/app/dev/cases/[caseId]/*`; Modify `src/app/dev/layout.tsx`; Delete `useModelCtx.ts`, `PilotOnly.tsx`, `buildSubmission.ts`, `modelStatus.ts`

- [ ] **Step 1: Move the folder** — `git mv "src/app/dev/models/[id]" "src/app/dev/cases/[caseId]" && rmdir src/app/dev/models`

- [ ] **Step 2: Context hook**

```ts
// src/components/dev/useCaseCtx.ts
'use client';
import { useMemo } from 'react';
import { getModel } from '@/lib/seed';
import type { ViewerDoc } from '@/lib/types';
import { caseScenario, setRequirements, use1lod } from '@/stores/store1lod';

/** 1st line context for a use case. Reads store1lod and the library only (never store2lod). */
export function useCaseCtx(caseId: string) {
  const id = decodeURIComponent(caseId);
  const uc = use1lod((s) => s.cases[id]);
  const seeded = use1lod((s) => s.seeded);
  const model = uc ? getModel(uc.modelId) : undefined;
  const sc = useMemo(() => (uc ? caseScenario(uc) : undefined), [uc]);
  const docs: ViewerDoc[] = useMemo(() => {
    if (!uc || !sc) return [];
    const out: ViewerDoc[] = [sc.document.draftVersion, sc.document.finalVersion].map((v) => ({
      id: sc.document.id, version: v, title: `${sc.document.title}${v === sc.document.draftVersion ? ' (draft)' : ''}`, sections: sc.document.versions[v], aiBlocks: uc.aiBlocks[v],
    }));
    for (const e of uc.evidenceDocs) out.push({ id: e.id, title: e.title, version: e.version, sections: e.sections });
    return out;
  }, [uc, sc]);
  const inSet = useMemo(() => (uc ? setRequirements(uc) : []), [uc]);
  const readOnly = uc?.status === 'completed';
  return { id, uc, model, sc, docs, inSet, readOnly, seeded };
}
```

- [ ] **Step 3: Seeder** — `src/components/dev/Seed1lod.tsx` identical to `Seed2lod.tsx` but using `use1lod`. Mount it in `src/app/dev/layout.tsx` inside `WorkspaceShell` before `{children}`.

- [ ] **Step 4: Update every page under `src/app/dev/cases/[caseId]/`**
  - `useParams<{ caseId: string }>()`; `const { id, uc, model, sc, docs, inSet, readOnly } = useCaseCtx(caseId);` and guard `if (!uc || !model || !sc) return null;`.
  - Replace every `use1lod().xxx(id, …)` model-ID call with the case-ID version (same action names; `setComponent`, `ensure`, `removeDocument` are gone).
  - Replace `work` with `uc`, `pilot` checks with nothing (all models are supported), and remove every `PilotOnly` return.
  - Links: `/dev/models/${id}` → `/dev/cases/${encodeURIComponent(id)}`.
  - Every action button is hidden or disabled when `readOnly` (completed use case), with a banner: "Completed use case — read-only".
  - `layout.tsx`: the stage rail title is the model name; subtitle `{uc.cycle} · {COMPONENT_LABEL[uc.component]}`; stage notes use `caseSegments(uc)`; no "Pilot only" notes.
  - `submit/page.tsx`: `const pkg = await s.buildSubmission(id);` replaces `buildSubmission(work)`; checklist document versions come from `sc.document` and `uc.evidenceDocs`.
  - `findings/page.tsx`: `demoFile` only when `uc.modelId === 'MDL-01'` (the only pre-generated findings package).
  - `page.tsx` (overview): counts per outcome and inventory card as today; replace the "Continue" target logic with the first `current` segment from `caseSegments(uc)`.

- [ ] **Step 5: Delete** `src/components/dev/{useModelCtx.ts,PilotOnly.tsx,buildSubmission.ts,modelStatus.ts}`.

- [ ] **Step 6: Verify** — `npx tsc --noEmit` shows errors only in `draft`, `assess`, `scope` pages (fixed in Tasks 10–12). Commit — `refactor(1st line): routes by use case`.

---

### Task 10: Draft check and Self-assessment on the scenario

**Files:** Modify `src/app/dev/cases/[caseId]/draft/page.tsx`, `src/app/dev/cases/[caseId]/assess/page.tsx`

- [ ] **Step 1: Draft check**
  - Imports: `runDraftCheck`/`generateSectionText`/`rdsSections`/`RDS_ID`/`RDS_TITLE`/`PILOT_SHARED_REQS` from `@/lib/ai/pilot` → `sectionText` from `@/lib/scenario/engine` and types `DraftResult`, `DraftStatus`, `GeneratedSection` from `@/lib/scenario/types`.
  - `const version = uc.draftVersion ?? sc.document.draftVersion;` and `const doc = { id: sc.document.id, title: …, version, sections: sc.document.versions[version], aiBlocks: uc.aiBlocks[version] };`
  - `const reqById = new Map(allCaseRequirements(uc).map((r) => [r.id, r]));`
  - Version select items: `sc.document.draftVersion` ("Draft v{draftVersion}") and `sc.document.finalVersion` ("Final v{finalVersion}").
  - No result until run: when `!uc.draftCheck`, render an `EmptyState` "Run the draft check" with a *Run check* button (same handler as *Re-run check*).
  - `generate(r)` uses `sectionText(sc, r.requirementId, r.mitigation?.text)`.
  - Progress overlay total: `allCaseRequirements(uc).length`.

- [ ] **Step 2: Self-assessment**
  - `DEMO_EVIDENCE` → `sc.evidenceFiles.map((f) => f.name)`; demo upload creates `new File([new Uint8Array(f.sizeKb * 1024)], f.name, { type: 'application/pdf' })`.
  - `EVIDENCE_AFFECTS[file.name]` → `affectedBy(sc, file.name)`.
  - `s.uploadEvidence(id, upload, text, true)`; toast reads the re-assessed row from `use1lod.getState().cases[id]`.
  - `reqs = allCaseRequirements(uc)`.
  - Empty state before the first run: "No assessment run yet" with *Run assessment*; the banner "Requirement set is not locked" links to Scoping and *Run assessment* is disabled until `uc.lockedAt`.
  - Justification dialog text becomes generic: `${req.text}: this obligation is evidenced outside the ${COMPONENT_LABEL[uc.component]} component; see the referenced model documentation.`
  - Library-change badges keep using `PILOT.library_change.changes` ids (they only match pilot requirement IDs).
  - Pass `groupBy` to `AssessmentQueue` (Task 12).

- [ ] **Step 3:** `npx tsc --noEmit` — only the scope page may still fail. Commit — `feat(1st line): draft check and self-assessment for every model`.

---

### Task 11: Guided Scoping

**Files:** Rewrite `src/app/dev/cases/[caseId]/scope/page.tsx`; Create `src/components/dev/ScopeStepper.tsx`

- [ ] **Step 1: Stepper component**

```tsx
// src/components/dev/ScopeStepper.tsx
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SCOPE_STEPS = ['Requirements', 'Documents', 'Review and lock'] as const;

export function ScopeStepper({ step, onStep, done }: { step: number; onStep: (n: number) => void; done: boolean[] }) {
  return (
    <ol className="mb-5 flex items-center gap-3" aria-label="Scoping steps">
      {SCOPE_STEPS.map((label, i) => (
        <li key={label} className="flex flex-1 items-center gap-3">
          <button
            type="button"
            onClick={() => onStep(i)}
            aria-current={step === i ? 'step' : undefined}
            className={cn('flex items-center gap-2 rounded-lg px-2 py-1 text-sm', step === i ? 'font-semibold text-green-900' : 'text-ink-2 hover:text-ink')}
          >
            <span className={cn('flex size-6 items-center justify-center rounded-full border text-xs', done[i] ? 'border-green-600 bg-green-600 text-white' : step === i ? 'border-green-600 text-green-700' : 'border-[#b9c3c3]')}>
              {done[i] ? <Check className="size-3.5" aria-hidden /> : i + 1}
            </span>
            {label}
          </button>
          {i < SCOPE_STEPS.length - 1 && <span className="h-px flex-1 bg-line" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 2: Rewrite the Scoping page** — reuse the current page's pieces (confidence bar, requirement row, not-applicable list, documents tabs, upload classification, model-specific panel, reason dialogs, bulk-accept sample dialog) and rearrange them:

  - **Header strip** (replaces the left "Model attributes" column): model name, `uc.cycle`, component label, tier, family badge, and the tag chips (read-only, tooltip "set in the use case wizard").
  - **State:** `const [step, setStep] = useState(0)`; `done = [allDecided, true /* documents are optional */, !!uc.lockedAt]` where `allDecided = uc.generatedAt && Object.values(uc.reqStatus).every((s) => s !== 'proposed')`.
  - **Step 0 — Requirements:**
    - If `!uc.generatedAt`: `EmptyState` with icon `Sparkles`, title "No requirement set yet", body "The AI proposes requirements from the {n} applicable documents. You decide on each one.", action *Generate requirement set* → `simulateRun(...)` then `s.generate(id)`.
    - Otherwise: chips (All · Proposed · Accepted · Excluded · Not applicable) as today, plus a progress line "{decided} of {total} decided".
    - Rows are **grouped by `source_doc`** (group header: document title from `getDocument`, binding badge, count, and a collapse toggle; default expanded). Each group header has *Accept high-confidence ({n})* which opens the existing sample dialog restricted to that group's proposed rows with confidence ≥ 0.85.
    - The global *Bulk accept high-confidence* button stays.
    - Footer: *Next: documents* button.
  - **Step 1 — Documents:** the current Documents card (Proposed / Add from library / Upload tabs) at full width, followed by the "Model-specific requirements (from uploads)" card. Demo files under Upload: the pilot's `upload_examples` requirement sources when `uc.modelId === 'MDL-01'`; for other models, one generic requirement source `"Supervisory letter – ${model.id} (2027).pdf"` which yields generic extracted requirements (existing `extractFromUpload` fallback). Footer: *Back* / *Next: review and lock*.
  - **Step 2 — Review and lock:** summary cards (Accepted, Excluded, Model-specific, Documents in scope); a table of excluded requirements with reasons; a list of user-added documents with reasons. If requirements remain proposed: `Banner tone="warn"` "{n} requirements still need a decision" with a button that goes to step 0 and sets the chip to Proposed. *Lock set* is enabled only when `allDecided`; the confirmation dialog is today's dialog without the "accepted on lock" line. After lock: success banner and *Continue to draft check* link; *Unlock (creates new version)* as today.
  - Remove the fixed bottom lock bar (the lock now lives in step 2).
  - Completed use cases: all three steps render read-only.

- [ ] **Step 3:** `npx tsc --noEmit` clean; `npm run lint` clean. Commit — `feat(1st line): guided scoping with nothing pre-filled`.

---

### Task 12: Grouping in the assessment queue

**Files:** Modify `src/components/assessment/AssessmentQueue.tsx`

- [ ] **Step 1:** Add prop `groupBy?: (req: Requirement | undefined) => string` and state `const [grouped, setGrouped] = useState(!!props.groupBy)`. In the toolbar add a checkbox-style chip *Group by source document* (visible when `groupBy` is given).
- [ ] **Step 2:** When `grouped`, render `visible` sorted by group key (stable, keeping the attention sort inside each group) and insert a header row before each new key:

```tsx
<tr key={`g-${key}`} className="bg-bg/80">
  <td colSpan={5} className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-2">
    {key} <span className="ml-1 font-normal normal-case">({count})</span>
  </td>
</tr>
```

- [ ] **Step 3:** Pass `groupBy={(r) => (r ? getDocument(r.source_doc)?.title ?? (r.layer === 'model_specific' ? 'Model-specific requirements' : r.source_doc) : 'Other')}` from the 1st line Self-assessment page and the 2nd line Blind assessment page (validation-layer rows group under their validation standard).
- [ ] **Step 4:** lint + tsc clean. Commit — `feat: group assessment queues by source document`.

---

### Task 13: 1st line home, inventory and wizard

**Files:** Create `src/components/common/ProgressSegments.tsx`, `src/components/common/UseCaseCard.tsx`, `src/app/dev/inventory/page.tsx`, `src/app/dev/new/page.tsx`; Rewrite `src/app/dev/page.tsx`

- [ ] **Step 1: Progress segments**

```tsx
// src/components/common/ProgressSegments.tsx
import { cn } from '@/lib/utils';

export function ProgressSegments({ states, labels }: { states: ('done' | 'current' | 'todo')[]; labels: readonly string[] }) {
  return (
    <div className="flex gap-1" role="img" aria-label={labels.map((l, i) => `${l}: ${states[i]}`).join(', ')}>
      {states.map((s, i) => (
        <span key={labels[i]} title={labels[i]} className={cn('h-1.5 flex-1 rounded-full', s === 'done' ? 'bg-green-600' : s === 'current' ? 'bg-yellow' : 'bg-line')} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Card**

```tsx
// src/components/common/UseCaseCard.tsx
import Link from 'next/link';
import { FamilyBadge } from '@/components/common/badges';
import { ProgressSegments } from '@/components/common/ProgressSegments';
import { fmtDateTime } from '@/lib/clock';
import { cn } from '@/lib/utils';

export function UseCaseCard(p: {
  href: string; title: string; subtitle: string; family: string; stage: string; completed?: boolean;
  states: ('done' | 'current' | 'todo')[]; labels: readonly string[]; updatedAt?: string;
}) {
  return (
    <Link href={p.href} className={cn('flex flex-col gap-2 rounded-[12px] border border-line bg-white p-4 transition-shadow hover:shadow-md focus-visible:outline-green-600', p.completed && 'bg-bg/40')}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold leading-snug text-ink">{p.title}</p>
        <FamilyBadge family={p.family} />
      </div>
      <p className="text-xs text-ink-2">{p.subtitle}</p>
      <p className="text-sm font-medium text-ink">{p.stage}</p>
      <ProgressSegments states={p.states} labels={p.labels} />
      {p.updatedAt && <p className="text-xs text-ink-3">Last activity {fmtDateTime(p.updatedAt)}</p>}
    </Link>
  );
}
```

- [ ] **Step 3: Inventory page** — move the current `src/app/dev/page.tsx` content to `src/app/dev/inventory/page.tsx` unchanged except: title "Model inventory"; replace `currentStageLabel`/`openGaps`/`inventoryOpenFindings` imports with local equivalents (stage column shows `model.lifecycle_stage`, or "Use case in progress" when an active case exists); the model name links to the active case (`/dev/cases/…`) or to `/dev/new?model=${m.id}`; add a final column with *Open use case* / *Start use case* buttons.

- [ ] **Step 4: Home page**

```tsx
// src/app/dev/page.tsx
'use client';
import { ArrowRight, List, Play, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Chip } from '@/components/common/badges';
import { EmptyState } from '@/components/common/ui-bits';
import { UseCaseCard } from '@/components/common/UseCaseCard';
import { CASE_STAGES, caseSegments, caseStageLabel } from '@/components/dev/caseProgress';
import { COMPONENT_LABEL } from '@/lib/ai/generic';
import { can } from '@/lib/permissions';
import { getModel, MODELS, PERSONAS } from '@/lib/seed';
import { use1lod } from '@/stores/store1lod';

type F = 'in_progress' | 'submitted' | 'completed';

export default function DevHome() {
  const cases = use1lod((s) => (can('1lod', 'read:store1lod') ? s.cases : {}));
  const [filter, setFilter] = useState<F>('in_progress');
  const list = Object.values(cases).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const bucket = (c: (typeof list)[number]): F => (c.status === 'completed' ? 'completed' : c.submission ? 'submitted' : 'in_progress');
  const last = list.find((c) => c.status === 'active' && !c.submission) ?? list.find((c) => c.status === 'active');
  const me = PERSONAS['1lod'];
  const shown = list.filter((c) => bucket(c) === filter);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="mx-auto max-w-[1200px]">
      <h1 className="text-2xl font-semibold tracking-tight">{greeting}, {me.name.split(' ')[0]}</h1>
      <p className="mt-1 text-sm text-ink-2">{me.role}, {me.unit}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Link href="/dev/new" className="rounded-[12px] border-2 border-green-600 bg-white p-5 transition-shadow hover:shadow-md focus-visible:outline-green-600">
          <Plus className="size-6 text-green-600" aria-hidden />
          <p className="mt-2 text-lg font-semibold">New use case</p>
          <p className="text-sm text-ink-2">Describe your model and start scoping</p>
        </Link>
        {last ? (
          <Link href={`/dev/cases/${encodeURIComponent(last.caseId)}`} className="rounded-[12px] border border-line bg-white p-5 transition-shadow hover:shadow-md focus-visible:outline-green-600">
            <Play className="size-6 text-ink-2" aria-hidden />
            <p className="mt-2 text-lg font-semibold">Continue where you left off</p>
            <p className="text-sm text-ink-2">{getModel(last.modelId)?.name} · {caseStageLabel(last)}</p>
          </Link>
        ) : (
          <div className="rounded-[12px] border border-dashed border-line bg-white/60 p-5 text-sm text-ink-2">Your active use case will appear here.</div>
        )}
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <h2 className="mr-2 text-lg font-semibold">Your use cases</h2>
        {(['in_progress', 'submitted', 'completed'] as F[]).map((f) => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)} count={list.filter((c) => bucket(c) === f).length}>
            {f === 'in_progress' ? 'In progress' : f === 'submitted' ? 'Submitted' : 'Completed'}
          </Chip>
        ))}
        <Link href="/dev/inventory" className="ml-auto flex items-center gap-1 text-sm text-green-800 hover:underline">
          <List className="size-4" aria-hidden /> Full model inventory ({MODELS.length}) <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((c) => {
          const m = getModel(c.modelId)!;
          return (
            <UseCaseCard key={c.caseId} href={`/dev/cases/${encodeURIComponent(c.caseId)}`} title={m.name} subtitle={`${c.cycle} · ${COMPONENT_LABEL[c.component]}`}
              family={m.model_family} stage={caseStageLabel(c)} completed={c.status === 'completed'} states={caseSegments(c)} labels={CASE_STAGES} updatedAt={c.updatedAt} />
          );
        })}
      </div>
      {shown.length === 0 && (
        <div className="mt-4">
          <EmptyState title={filter === 'in_progress' ? 'Start your first use case' : 'Nothing here yet'}>
            {filter === 'in_progress' ? 'Choose one of the 20 models in the inventory and take it through scoping, draft check, self-assessment and submission.' : 'Use cases move here as they progress.'}
          </EmptyState>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Wizard** — `src/app/dev/new/page.tsx`, a client page with `step` state 0–2 and a step header like `ScopeStepper` (labels: Choose model · Confirm characteristics · Scope of assessment):
  - **Step 0:** search input + list of `MODELS` (ID, name, family badge, regulatory use, tier). A model with an active case shows *Continue* linking to it; otherwise selecting sets `modelId`, pre-fills `attributes = attributesFromModel(model)`, `cycle = defaultCycle(model)`, and advances. `?model=MDL-xx` pre-selects and opens step 1.
  - **Step 1:** read-only inventory fields (portfolio, purpose, methodology, family, regulatory use, tier) shown as text inputs the user may edit (`Input`/`Select`), and tag toggles: every distinct tag used across `MODELS` (`[...new Set(MODELS.flatMap((m) => m.tags))].sort()`) as `Chip`s; active = in `attributes.tags`. Live count: `applicableDocs({ tags: attributes.tags }).length` "applicable documents". Buttons Back / Next.
  - **Step 2:** component `Select` (`COMPONENT_LABEL`), cycle `Input`, and the document to be assessed shown from `getScenario(modelId, component, attributes.tags).document` (title, final version). Button **Create use case** → `const id = s.createCase({ modelId, cycle, component, attributes }); router.push(`/dev/cases/${encodeURIComponent(id)}/scope`)`.
  - Guard: *Next*/*Create* disabled until required fields are filled (model chosen; cycle non-empty).

- [ ] **Step 6:** tsc + lint clean. Commit — `feat(1st line): home, inventory and new use case wizard`.

---

### Task 14: 2nd line home and gating

**Files:** Rewrite `src/app/val/page.tsx`; Modify `src/app/val/reviews/[snapshotId]/layout.tsx`, `.../compare/page.tsx`, `.../assess/page.tsx`

- [ ] **Step 1: Home** — same structure as the 1st line home:
  - Card **Start a review** (border-2 in `lod2`), subtitle "Import a submission package from the 1st line", containing the existing `PackageImport type="submission"` with `demoFile="SUB-MDL-01-20270614.rcc.json"`; on success `router.push` to the review's Scope page.
  - Card **Continue where you left off**: the active review with the latest `updatedAt`.
  - **Your reviews** with chips In progress · Completed (`status === 'opinion_issued'` = completed), rendered with `UseCaseCard` using stages `['Scope', 'Blind assessment', 'Compare', 'Findings', 'Opinion']` and states: Scope done when `run` exists; Blind done when every row decided; Compare done when `revealedAt`; Findings done when `findingExports.length`; Opinion done when `opinion?.issuedAt` (first not-done = current).
  - The current reviews table is removed; the cards replace it.
- [ ] **Step 2: Review layout** — stage notes read "Decide every row first" on Compare while rows are undecided.
- [ ] **Step 3: Compare** — the *Reveal 1st line matrix* button is enabled only when every row is decided; otherwise show "{n} rows still need your decision" and a link to Blind assessment. Use the boolean returned by `s.reveal(id)`.
- [ ] **Step 4: Blind assessment** — pass `groupBy` (Task 12); banner under the header: "Decide every row before the reveal ({decided}/{total})".
- [ ] **Step 5:** tsc + lint clean. Commit — `feat(2nd line): home with reviews library and reveal gating`.

---

### Task 15: Audit seed, README, demo packages

**Files:** Modify `src/stores/storeAudit.ts`, `README.md`; regenerate `public/demo-packages/*`

- [ ] **Step 1: Audit seed** — replace the MDL-01 historical events (AE-0003, 0004, 0006, 0008, 0010, 0011, 0012) with events for the history: MDL-02 and MDL-07 (use case created, set locked, assessment run, submission exported, blind run, reveal, findings issued, opinion issued, findings closed — dates from `HISTORY`) and MDL-04 (use case created, set locked, run, submission exported 2027-04-22, imported, blind run 2027-05-06). Keep library and audit events. Bump persist `version` to 2.
- [ ] **Step 2: README** — update "Demo script" to start with *New use case → MDL-01 → confirm characteristics → RDS documentation*, then *Generate requirement set*, decide (bulk accept high-confidence after sample + individual decisions), documents, lock; the rest as before. Add a short "Any model" paragraph (every model supports every step; demo evidence files are offered next to each upload). Add design decisions: use case = model + cycle; nothing pre-filled; history seeded identically but separately in both lines; persist version bump requires *Reset demo data* after upgrade.
- [ ] **Step 3: Demo packages** — walk the pilot flow in the browser (Task 16) and re-save `SUB-`, `FND-`, `RSP-MDL-01-20270614.rcc.json` through a temporary dev-only route, exactly as in the first build, then delete the route.
- [ ] **Step 4:** Commit — `docs: demo script for the use-case flow; refresh demo packages`.

---

### Task 16: Browser verification

- [ ] **Step 1:** `npm run build && npm run lint && npm test` — all green.
- [ ] **Step 2:** Start the dev server; *Reset demo data*; verify the initial state (1st line: MDL-07 and MDL-02 completed, MDL-04 submitted; 2nd line: two completed reviews, MDL-04 in review, reveal disabled until decided — all decided in the seed, so enabled).
- [ ] **Step 3: Pilot end to end** — New use case → MDL-01 → RDS → generate → decide all (bulk + individual) → add EBA handbook with reason → upload ECB decision (MS-01 add, MS-02 propose) → lock → draft check v0.7 (D12b/D12c gaps) → generate section text → v1.0 → re-run → 0 gaps → run assessment → D07 accept with reason → D21 upload MDD → compliant/medium → D15 edit → fast-forward → export matrix → submit → 2nd line import → scope → blind run → decide all → reveal → triage (D07 code ≠ documentation) → draft F-07 → issue → export findings → opinion → 1st line import findings → respond → export response → library publish v3.3 → REQ-D01 needs review → audit trail.
- [ ] **Step 4: Three other models** — MDL-15, MDL-20, MDL-07 (new cycle "Annual review 2027"): the same flow, checking that every stage has content (gaps, not-found resolved by the named evidence file, a failing script check in the 2nd line, at least one "Disagree" row, a drafted finding).
- [ ] **Step 5:** Open a completed use case and a completed review: every page read-only.
- [ ] **Step 6:** Commit any fixes; push to `origin main` (Vercel redeploys).

---

## Self-review

- **Spec coverage (Part 1):** 5.1 use cases → Tasks 7, 9; 5.2 home → 13; 5.3 wizard → 13; 5.4 guided scoping → 11 (+12 grouping); 5.5 later stages for every model → 5, 10; 5.6/5.7 2nd line → 8, 14; 5.8 initial state → 6, 7, 8, 15; 8 scenario engine → 2–5; 9 scale (grouping, bulk per group, full exports) → 11, 12; 10 testing → 1, 3–8, 16. Sections 6–7 (real content) are explicitly out of this plan.
- **Names used across tasks:** `getScenario`, `assess1lod`, `affectedBy`, `evidenceDocFor`, `runDraftCheck`, `sectionText`, `assess2lod`, `findingTemplate`, `scriptedDecision` (engine); `HISTORY`, `caseIdFor`, `buildHistoricCase`, `historicPackage`, `buildSubmissionPackage`, `historicFindings`, `historicBlindRows` (history); `use1lod`, `useCase`, `caseScenario`, `proposalRequirements`, `setRequirements`, `allCaseRequirements`, `finalVerdict`, `attributesFromModel` (store1lod); `caseSegments`, `caseStageLabel`, `defaultCycle`, `CASE_STAGES` (caseProgress); `reviewScenario` (store2lod) — consistent throughout.
- **Known judgement calls:** Tasks 9–14 describe edits to existing large pages as precise instructions plus new code, rather than repeating whole files, because most of each page is unchanged.
