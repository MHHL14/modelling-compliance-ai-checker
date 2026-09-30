# Design: use-case flow for both lines, and realistic content for all 20 models

Status: draft for review · Date: 2026-09-29 · Builds on: `SPEC.md` (original build specification) and the current prototype.

## 1. Why

First review of the prototype by the product owner:

- The 1st line workspace opens on a full inventory with KPIs. A model developer is overwhelmed. They want to **start a use case** and **browse their own library of use cases**. The same applies to the 2nd line.
- Scoping is pre-filled (14 requirements already accepted). The modeller must **do the work**, at every step.
- Only the pilot (MDL-01) works beyond Scoping. **Every one of the 20 models** must support every step, in both lines.
- Content must be **realistic enough that a model developer or validator at a bank does not stumble over it**. A requirement set of 14–18 rows is not credible; a real matrix for one component of an IRB model has 100+ rows, traceable to article and paragraph.

## 2. Principles that stay unchanged

Everything in `SPEC.md` section 2 remains in force, notably: citation-first; explained confidence; mitigation on every non-compliant, partial, not-found or low-confidence row; AI output labelled until a human decides; script checks separate from AI checks; strict separation of the lines with package files as the only crossing; blind 2nd line assessment with a logged reveal; locked versions; no auto-accept (bulk accept only after a sample of 3); no chat box as primary interface; no single compliance score.

Also unchanged: English UI in formal, plain business language (no "verdict"; "1st line / 2nd line" rather than "1LoD / 2LoD"), visual style, personas, separate Zustand stores per workspace, package format with SHA-256, the audit trail.

## 3. Existing content is the foundation

This work extends the current content; it does not replace it.

| Existing content | How it is used |
|---|---|
| `data/models.json` — 20 models with tags, tier, family, lifecycle, evidence documents | Unchanged. Tags keep driving applicability. Model evidence documents become the documents that are assessed (section 7). |
| `data/documents.json` — 72 library documents with applicability rule, binding level, key topics, extraction priority | Unchanged as the document register. Each document gets its requirements (section 6). `key_topics` define the chapters each document's requirements must cover. |
| `data/pilot_seed.json` — 18 shared + 4 validation-layer requirements, RDS v0.7/v1.0, 1st line and 2nd line assessments, decisions, draft findings, library change v3.2 → v3.3, upload examples | Kept verbatim. REQ-D01 … REQ-G01 and VAL-01 … VAL-04 become part of the full library with the same IDs, texts and seed assessments. The pilot demo moments (D07 low confidence → code ≠ documentation; D21 not found → MDD upload; D15 partial; D12b/c draft gaps; VAL-02 script fail; MS-01/MS-02 extraction; D01/D55/L14 library change) all remain. |
| Section 13.3 upload evidence (MDD §7.2, DoD memo §3) | Kept for the pilot; the same mechanism is generalised per model. |
| Current screens and components (queue, row detail, confidence "why", document viewer, run inspector, packages, compare, findings, opinion, library, audit) | Reused. The redesign changes entry points, scoping and data sources, not these building blocks. |

## 4. Delivery in three parts

| Part | Scope | Outcome |
|---|---|---|
| 1 | Screens and flow (sections 5 and 8), running on a scenario engine that uses current content | Any user can take any of the 20 models through every step in both lines |
| 2 | Real requirement library for all 72 documents, including fully written internal policies and standards (section 6) | Requirement sets of realistic size, traceable to article and paragraph |
| 3 | Realistic model documentation for all 20 models (section 7) | Citations, gaps and evidence that make sense to a practitioner |

Each part ends with `npm run build` and `npm run lint` passing, a browser walk-through, a commit and a deploy.

## 5. Part 1 — screens and flow

### 5.1 Use cases

- A **use case** is one model assessed in one cycle (for example *Initial validation 2027*, *Annual review 2027*). It covers all stages from Scoping to Findings.
- One model has at most one active use case; completed use cases remain in the library, read-only.
- Use cases get their own ID (`UC-<model>-<cycle>`). 1st line routes move to `/dev/cases/[caseId]/{scope,draft,assess,submit,findings}`; the model overview becomes the use case overview. The 2nd line keeps `/val/reviews/[snapshotId]/…`.

### 5.2 1st line home (`/dev`)

- **New use case** — subtitle "Describe your model and start scoping". Opens the wizard.
- **Continue where you left off** — the most recently edited active use case; hidden when there is none.
- **Your use cases** — cards: model name, component, cycle, current stage, five-segment progress bar (Scoping · Draft check · Self-assessment · Submit · Findings), last activity. Filter: In progress · Submitted · Completed.
- **Full model inventory (20)** — secondary link to the current inventory table and KPI tiles, moved to `/dev/inventory`.

### 5.3 New use case wizard (3 steps)

1. **Choose model** — searchable list of the 20 models (ID, name, family, regulatory use, tier). A model with an active use case shows *Continue* instead.
2. **Confirm characteristics** — pre-filled from the inventory: portfolio, purpose, methodology, model family, regulatory use, tier. Tags are toggles with a live count of applicable documents (applicability rule from `SPEC.md` section 6).
3. **Scope of this assessment** — component (RDS documentation · Methodology (MDD) · Full model), cycle label, and the document version to be assessed. Button: **Create use case** → opens Scoping.

### 5.4 Scoping as a guided step

A stepper at the top: **1 Requirements → 2 Documents → 3 Review and lock**.

1. **Requirements** — empty until the user clicks *Generate requirement set*. All requirements arrive as *Proposed*; none are pre-accepted. With 100+ rows the list is **grouped by source document and chapter**, collapsible, with counts per group. Per row: Accept, or Exclude with a reason. Bulk accept per group or for all high-confidence rows, each only after opening a random sample of 3 (rule 9). *Not applicable* list with the reason per requirement.
2. **Documents** — proposed documents (grouped external/internal, binding level), *Add from library* with a reason, *Upload* as evidence or requirement source with extraction of model-specific requirements (Add to this model / Propose to library). As today, on its own screen.
3. **Review and lock** — counts per status and per category, excluded requirements with reasons, documents in scope. *Lock set* is available only when every requirement has a decision. After locking: read-only with *Unlock (creates new version)*.

### 5.5 Later 1st line stages, for every model

- **Draft check** — draft and final version of the model's document. No result until the user runs the check. Gaps, *Generate section text*, insert as AI-drafted block, switch to the final version, re-run → gaps closed.
- **Self-assessment** — no run until the user clicks *Run assessment*. Nothing is pre-decided. The queue is grouped and filterable as today, plus grouping by source document. *Upload evidence* resolves the scenario's not-found rows. *Demo → Fast-forward* stays as a presenter aid.
- **Submit** and **Findings** — as today.

### 5.6 2nd line home (`/val`)

- **Start a review** — subtitle "Import a submission package from the 1st line". Drag-and-drop or file picker, plus *Import demo package*. After integrity verification the review opens on Scope.
- **Continue where you left off** and **Your reviews** — cards with a five-segment progress bar (Scope · Blind assessment · Compare · Findings · Opinion). Filter: In progress · Completed.

### 5.7 2nd line stages, for every model

- **Scope** — shared set read-only (grouped as in 5.4); validation layer proposed per model from the internal validation standards (replication plus checks that fit the model family); the validator can add requirements and raise scoping challenges.
- **Blind assessment** — no run until the validator starts it. The validator decides every row (bulk accept after sampling). *Reveal 1st line matrix* is available only when every row has a validator decision.
- **Compare, Findings, Opinion** — as today, for every model.

### 5.8 Initial state (also the result of *Reset demo data*)

| | 1st line — Your use cases | 2nd line — Your reviews |
|---|---|---|
| Completed, read-only | IFRS 9 ECL – Residential Mortgages (MDL-07), *Annual review 2026*, findings closed · LGD Residential Mortgages NL (MDL-02), *Annual validation 2026* | The two matching completed reviews, with opinion |
| In progress | PD Retail SME (MDL-04), submitted, awaiting validation | Review of MDL-04: blind assessment done, not revealed |
| Pilot MDL-01 | Does not exist yet; created live | Arrives when the 1st line submits it |

Each line holds its own copy of this history. No shared state is introduced.

## 6. Part 2 — requirement library

### 6.1 Coverage

- **All 72 documents** in `data/documents.json` get requirements.
- **External documents** (CRR, CRD, RTS, EBA guidelines, ECB guides, AI Act, GDPR, AMLR, IFRS 9/13, BCBS 239, SR 11-7, SS1/23, DORA, Wwft, MCD, PSD2 RTS, …): requirements are decomposed to **article / paragraph / point** level, with the exact reference (for example "CRR Art. 179(1)(d)", "EBA/GL/2017/16 para 20(b)").
- **Internal policies and standards** (MRM-POL-001, MRM-STD-020/021/022/023, CRM-STD-100/101, MV-STD-001/010, MV-HB-003, AI-STD-700, …): these do not exist, so each is **written in full** — purpose, scope, roles, and numbered provisions in a bank's house style — and requirements are derived from its provisions. The key topics in `documents.json` define the chapters.
- Depth follows binding level and extraction priority: binding law and high-priority documents fully decomposed; reference documents (SR 11-7, SS1/23, EBA ML report) at principle level.

### 6.2 Requirement record

Extends the existing `Requirement` type:

- `id` (existing pilot IDs kept; new IDs per document, for example `CRR-179-1-d`), `source_doc`, `article` (exact reference), `text` (the obligation in plain language, faithful to the source), optional `quote` (short verbatim source text where reuse is permitted: EU legal texts and EBA/ECB publications, with attribution).
- `category` (data · methodology · governance · documentation · validation), `check_type` (ai · script · ai+script), `layer` (shared · 2lod).
- **Requirement-level applicability**: `components` (rds · mdd · full · governance) and optional tag conditions in addition to the document-level rule, so that an RDS component of an IRB PD model gets PD data requirements and not LGD downturn or CCF requirements.
- `verification`: `verified` (checked against the official source) or `to_review` (uncertain; shown with a marker in the library). Nothing is guessed silently.

### 6.3 Expected size

Indicative: RDS documentation of an A-IRB PD model 100–150 requirements; full IRB model 300+; ML models add AI Act, ML standard and explainability requirements; IFRS 9, IRRBB, market risk, AML and fraud models get their own regulatory sets. Actual numbers follow from the content.

### 6.4 Verification process

Requirements are drafted from knowledge of the source texts and checked against official publications (EUR-Lex, EBA, ECB, IASB summaries, BIS). Article numbers and the core of each obligation are verified; uncertain items are flagged `to_review`. A spot check by a subject-matter expert is recommended before external use.

### 6.5 Library change v3.2 → v3.3

The existing change (REQ-D01 modified, REQ-D55 new, REQ-L14 modified) stays and is extended with the matching real references in the ECB guide to internal models and CRR3. Impact is recomputed from the real requirement sets.

## 7. Part 3 — model documentation

- For each of the 20 models, a realistic document per component in `model.evidence_documents` (RDS documentation, MDD, and for ML/GenAI models the relevant technical documentation), with 15–30 sections in a bank's documentation template (MRM-STD-021), consistent with the inventory (portfolio, methodology, purpose, tier, AI Act assessment).
- Figures are plausible and internally consistent (observation periods, population sizes, default rates, performance metrics appropriate to the model type).
- Two versions per document: a draft (v0.x) with a few realistic gaps and a final (v1.0) where they are resolved.
- Per model: 1–2 named supplementary evidence files (for example a DoD implementation memo or a calibration memo) that resolve the scenario's not-found rows when uploaded, available as demo files.
- The pilot's RDS v0.7/v1.0 and the MDD §7.2 / DoD memo §3 texts are kept exactly as in `pilot_seed.json`; the rest of the MDL-01 documentation is written around them.

## 8. Scenario engine

One module, `src/lib/scenario/`, returns a complete, deterministic scenario per model and component; screens and stores read only from it.

- **Input**: model, component, library version, uploaded evidence.
- **Output**: applicable requirements and the not-applicable list; the document versions; 1st line AI results (citations that exist verbatim in the document, confidence factors, mitigations); 2nd line AI results (independent, from the frozen package only); validation layer; draft finding texts.
- **Guarantees per model**, so every stage has substance:
  - at least one requirement that is compliant with low confidence because code is not linked (verification) → in the 2nd line a failing script check shows code ≠ documentation;
  - at least one not-found requirement resolved by uploading a named evidence file;
  - at least one partial requirement (remediation);
  - two draft gaps resolved in the final version;
  - a validation layer with one passing and one failing check;
  - at least one outcome difference between the lines.
- **Pilot**: for MDL-01 the seed results from `pilot_seed.json` take precedence for their requirements; the engine fills the rest of the larger set.
- **Model-family templates** (statistical · ML · GenAI · expert) shape wording, script checks (replication, threshold-in-code, performance thresholds, monotonicity, prompt/guardrail tests) and findings.
- Deterministic: the same model and component always produce the same scenario (seeded by model ID and requirement ID). Live AI remains limited to free-text generation.

In part 1 the engine runs on the current content (current generic generation, improved per family); parts 2 and 3 replace its content sources without changing its interface.

## 9. Scale in the UI

- Scoping, self-assessment and blind assessment lists are grouped by source document and chapter, collapsible, with counts and filters; row detail stays in the side panel.
- Bulk accept per group, always after a sample of 3.
- Excel exports contain all rows.
- No virtualisation is expected to be needed at a few hundred rows; revisit if rendering becomes slow.

## 10. Testing and acceptance

- Browser walk-through of the full flow for MDL-01 (pilot, all original demo moments still present) and for MDL-15 (AML, ML), MDL-20 (GenAI) and MDL-07 (IFRS 9), in both lines.
- Completed use cases open read-only; *Reset demo data* restores section 5.8.
- Separation checks still hold: no shared state, hash verified on import, tampered package rejected, 1st line conclusions hidden until reveal.
- `npm run build` and `npm run lint` pass; deploys on Vercel without configuration.
- Part 2: every requirement has a source document and exact reference; `to_review` items listed in the library.

## 11. Out of scope

- A model not in the inventory, and pre-filling the wizard from an uploaded document.
- Real authentication, a database, or multi-user collaboration.
- Live AI for assessments (stays simulated and deterministic).

---

## 12. Revision 2026-09-30 — the user selects and uploads; the AI derives and assesses

Product owner feedback on the Part 1 build. Guiding principle from now on:

> **The user selects and uploads. The AI derives requirements from the selected sources, assesses the requirements against the selected documentation, and provides the rationale, confidence and mitigating measures.**

This revision replaces the parts of sections 5.3–5.5 and 7 that conflict with it.

### 12.1 No characteristic tags in the UI

The tag chips ("Characteristics — these determine which regulation applies") are removed from the wizard. The AI does not decide which regulation applies. Tags stay in `models.json` as inventory metadata only (used for requirement-level relevance filtering and in the library's "applies to N models" view), never as a user control.

### 12.2 Requirement sources are chosen by the user, at the start

Wizard steps become:

1. **Choose model** — as today.
2. **Confirm model details** — portfolio, purpose, methodology, family, regulatory use, tier (no tags).
3. **Requirement sources** — the user selects the regulation, guidelines, standards and policies the model must be assessed against, from the requirement library (72 documents), grouped (EU legislation · EBA · ECB and supervisors · international standards and references · internal policies · internal standards), searchable, with binding level shown. **Pre-selected: the mandatory internal base that applies to every model** — MRM-POL-001, DATA-POL-001, MRM-STD-010, MRM-STD-020, MRM-STD-021, MRM-STD-022, MRM-STD-023, MRM-STD-030. Everything else is selected by the user. The user can also **upload** additional requirement sources (supervisory decision, previous validation report, letter, internal memo); requirements are extracted from them.
4. **Scope of this assessment** — component and cycle, as today.

Validation standards (MV-*) are not offered here; they belong to the 2nd line validation layer.

### 12.3 Scoping

Stepper: **1 Sources → 2 Requirements → 3 Review and lock.**

1. **Sources** — the selection from the wizard, editable (add or remove library documents with a reason for additions beyond the mandatory base; upload further requirement sources; model-specific requirements from uploads: *Add to this model* / *Propose to library*).
2. **Requirements** — empty until *Derive requirements*. The AI derives the requirements from the selected sources only, filtered for relevance to the model and component (requirement-level applicability, section 6.2). Each shows its source article and "why applicable"; requirements from a selected source that do not apply are listed under *Not applicable* with the reason. The user accepts or excludes every requirement (bulk accept per source after a sample of 3).
3. **Review and lock** — as today.

### 12.4 Model documentation library (replaces section 7's framing)

- A **model documentation library** holds the development documentation of all 20 models: per model 4–6 documents appropriate to its type (for example RDS documentation, model development document, data quality report, implementation and testing report, monitoring or performance report, explainability report for ML, evaluation and guardrail report for GenAI, expert panel minutes for expert models). Existing `evidence_documents` in `models.json` are kept (same IDs and titles) and extended.
- The main documents exist in a **draft** and a **final** version.
- Each document is written section by section in a bank's documentation template, with figures consistent with the inventory, and carries an **evidence map**: for each section, the requirement IDs it addresses, the coverage (full or partial) and the exact supporting sentence. Deliberate, realistic deficiencies are planted per model (a missing analysis, an approximation not linked to a MoC, an undocumented override, a threshold in code that differs from the documentation) so every stage has substance.
- Per model a small set of **code facts** backs the 2nd line script checks (for example "rds_build.py L214: MAT_ABS = 250").

### 12.5 Draft check

The user **selects the documentation to check** — from the model documentation library (defaults to this model's documents, searchable across all models) and/or by uploading files — and picks the version (draft by default). *Run check* assesses the requirement set against exactly that selection: an interim assessment, no status, no sign-off. The document viewer shows the selected documents as tabs.

### 12.6 Self-assessment

Before the run, the user **selects the documentation to submit** — final versions from the library and/or uploads; the draft-check selection is pre-ticked in its final version. The user confirms the set; *Run assessment* assesses the requirements against it. Exactly this set goes into the submission package, and the 2nd line assesses against the same frozen set.

### 12.7 How the simulated AI assesses (replaces the generic scenario content)

For each requirement in the locked set, across the selected documents:
- sections whose evidence map lists the requirement → citations (exact sentences); coverage full → compliant, partial → partial;
- no section in the selection → not found (evidence may sit in a document that was not selected);
- planted deficiencies → non-compliant or partial with the matching rationale;
- confidence factors follow from the evidence: exact sentence vs indirect (match), full vs partial (coverage), expected template section vs elsewhere (location), conflicting passages or code facts (consistency), code or data linked or not (verifiability);
- mitigating measure by type (remediation, verification, compensating, justification).
The 2nd line uses the same frozen documents plus its code facts, independently of 1st line conclusions. The pilot's hand-written seed results keep precedence for their requirements.

### 12.8 Delivery order

1. **Part 2 — requirement library content** (all 72 documents; internal standards written in full), authored in parallel by subagents per document cluster, validated by a schema check and a verification pass, with `verified` / `to_review` markers.
2. **Part 3 — model documentation library** (20 models × 4–6 documents with evidence maps and code facts), authored in parallel per model against the Part 2 requirement IDs.
3. **Flow revision** (12.1–12.3, 12.5, 12.6) and **engine rewrite** (12.7), then a browser walk-through for the pilot and three other models, build, lint, tests, deploy.
