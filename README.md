# Model Compliance Workbench (prototype)

> **Prototype · illustrative data.** All models, persons, documents, figures and findings in this application are fictional and for demonstration only. The application is not affiliated with any bank and uses no real bank name, logo or trademarked font.

A clickable, realistic prototype of an AI-assisted regulatory compliance tool for bank model development (1st line) and model validation (2nd line). The AI **drafts** — requirement sets, documentation text, filled requirement matrices, findings and opinions — and always shows the **cited source passage**, an **explained confidence** and a **proposed mitigating measure**. People decide.

Pilot scenario: the reference data set (RDS) documentation of `PD-MORT-NL v4` (MDL-01), an A-IRB probability-of-default model for Dutch residential mortgages.

## Workspaces

| Workspace | Persona (fictional) | Purpose |
|---|---|---|
| Model Development – 1st line (`/dev`) | Sanne de Vries | Scoping, draft check, self-assessment, submission, responses to findings |
| Model Validation – 2nd line (`/val`) | Pieter Bakker | Blind assessment, comparison with the 1st line, findings, validation opinion |
| Requirement Library (`/library`) | Fatima El Amrani | 72 documents, requirements, candidate requirements, version change v3.2 → v3.3 |
| Audit – read-only (`/audit`) | Internal Audit | Audit trail across both lines |

The 1st and 2nd line are strictly separated: separate stores, separate AI runs and configuration, and **no shared state**. Information crosses only as package files (submission, findings, response), each with a manifest and a SHA-256 hash that is verified on import. A tampered package is rejected.

## Run locally

Requires Node.js 20 or later.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Use **user menu → Reset demo data** to return to the initial state: two completed use cases (MDL-07, MDL-02 — 2026 cycles) and one submitted use case (MDL-04) in the 1st line; the matching reviews in the 2nd line. The pilot MDL-01 does not exist yet — you create it.

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

### Demo aids

- **Demo files** for uploads are in `public/demo-files/` (for example `MDD PD-MORT-NL v4.pdf` and `ECB decision ECB-SSM-2025-NL-ABC-123 (excerpt).pdf`). Drag them from disk, or use the “Demo files” shortcuts next to each upload area; for other models the shortcuts offer that model's own evidence file.
- **Pre-generated packages** are in `public/demo-packages/` (`SUB-…`, `FND-…`, `RSP-…`). Every import area has an “Import demo package” link in case a live export is not at hand.
- **Demo → Fast-forward** on the Self-assessment page applies scripted decisions to the remaining rows.
- Run the automated checks with `npm test` (scenario engine, stores and history).

### Demo script (about 12 minutes)

Every step is done by the user; nothing is pre-filled. The pilot (MDL-01) has the richest content, but **any of the 20 models** can be taken through every step.

1. `/` → explain the four workspaces → **Model Development – 1st line**. The home shows *New use case*, *Continue where you left off* and *Your use cases* (two completed use cases from 2026 and one submitted use case).
2. **New use case** → choose **MDL-01 PD Residential Mortgages NL** → confirm the characteristics (34 applicable documents) → component *RDS documentation*, cycle *Initial validation 2027* → **Create use case**.
3. **Scoping — Requirements**: *Generate requirement set* → 18 proposed requirements grouped by source document, each with "Why applicable" → *Accept high-confidence* (open the sample of 3) → decide the remaining 4 yourself.
4. **Scoping — Documents**: *Add from library* “Supervisory handbook on the validation of IRB rating systems” with a reason; *Upload* the ECB decision as *Requirement source* → MS-01 *Add to this model*, MS-02 *Propose to library*.
5. **Scoping — Review and lock**: summary → **Lock set** (only possible once every requirement has a decision).
6. **Draft check**: *Run check* on v0.7 → REQ-D12b / D12c gaps → *Generate section text* → *Insert into draft* → switch to v1.0 → *Re-run check* → gaps closed.
7. **Self-assessment**: *Run assessment* → REQ-D07 (compliant, low confidence) accept with a reason; REQ-D21 (not found) → upload `MDD PD-MORT-NL v4.pdf` → compliant/medium with MDD §7.2; REQ-D15 → Edit to compliant; *Demo → Fast-forward* for the rest; *Export matrix (.xlsx)*.
8. **Submit** → checklist → sign-off → **Freeze and export**.
9. `/` → **Model Validation – 2nd line** → *Start a review* → import the package → Scope (shared set, validation layer VAL-01..04).
10. **Blind assessment** → *Run assessment* → decide every row (bulk accept after a sample, then the rest) → VAL-02 script check fails (EUR 250 in code vs EUR 100 documented).
11. **Compare** → *Reveal 1st line matrix* (available only when every row is decided; logged) → REQ-D07 “code ≠ documentation”, REQ-D21 / D15 “disagree” → draft F-07 → **Issue** → **Export findings package**.
12. **Opinion** → “Fit with conditions” → committee summary with independence statement.
13. `/` → 1st line → the use case → **Findings** → import → remediation plan → **Export response package**.
14. `/` → **Library** → Version change → **Publish v3.3** → REQ-D01 shows “Needs review — library changed”.
15. `/audit` → the full trail, including the blind run and the reveal.

To show that it is not limited to the pilot, repeat steps 2–11 with, for example, MDL-20 (GenAI Credit Memo Assistant) or MDL-15 (AML Transaction Monitoring): each model has its own draft gaps, a “not found” row that is resolved by the model's own demo evidence file, a failing script check in the 2nd line and a model-specific finding.

## Deploy (GitHub + Vercel)

The repository is `MHHL14/modelling-compliance-ai-checker` on GitHub.

```bash
git remote add origin https://github.com/MHHL14/modelling-compliance-ai-checker.git
git push -u origin main
```

Then on vercel.com: **Add New → Project → Import** the GitHub repository → framework Next.js (auto-detected) → **Deploy**. No configuration is needed.

Optional environment variables:

| Variable | Effect |
|---|---|
| `ANTHROPIC_API_KEY` | Enables live AI for free-text generation (section text, requirement extraction from text uploads, “Ask about this row”) through the `/api/ai` route handler. The browser never calls the API directly; any error falls back to the simulated provider. The header badge shows “AI: live”. |
| `ANTHROPIC_MODEL` | Model name for live generation (default `claude-opus-5`). |

Recommended: enable **Vercel Deployment Protection** (password or Vercel authentication) so the prototype is not publicly accessible.

## How it is built

- Next.js 15 (App Router), TypeScript (strict), Tailwind CSS v4, shadcn/ui (Radix), lucide-react, sonner.
- State: Zustand with `persist` (IndexedDB via `src/lib/storage.ts`; the stores outgrew the 5 MB localStorage quota once every model carried hundreds of requirements), partitioned per workspace: `store1lod`, `store2lod`, `storeLibrary`, `storeAudit` (`src/stores`). The 1st line pages never import the 2nd line store and vice versa; `can(workspace, action)` in `src/lib/permissions.ts` guards reads and exports.
- Packages: `src/lib/packages.ts` (manifest, SHA-256 via Web Crypto, schema and hash verification on import).
- Content: the **requirement library** (`data/library/requirements/*.json`, one file per source document; full texts of the internal policies and standards in `data/library/texts/*.md`) and the **model documentation library** (`data/modeldocs/MDL-nn.json`: 4–6 documents per model with draft and final versions, an evidence map per section, known deficiencies, code facts and validation test results). `scripts/build-content.mjs` bundles them into `data/generated/` (runs automatically before `dev`, `build` and `test`); the app loads them on demand. Authoring rules: `data/library/AUTHORING.md` and `data/modeldocs/AUTHORING.md`; validators: `node scripts/validate-library.mjs` and `node scripts/validate-modeldocs.mjs`.
- AI engine: `src/lib/engine` — derives requirements from the sources the user selected (`sources.ts`) and assesses them against exactly the documentation the user selected or uploaded (`assess.ts`), with citations, rationale, confidence and mitigations; the pilot MDL-01 keeps the hand-written seed from `data/pilot_seed.json`. `SimulatedProvider` (`src/lib/ai`) adds realistic latency and progress; the optional live provider is in `src/app/api/ai/route.ts`.
- Confidence (`src/lib/confidence.ts`): High / Medium / Low derived deterministically from five visible factors.
- Excel export: SheetJS (`xlsx`). Seed data: `data/models.json`, `data/documents.json`, `data/pilot_seed.json` (verbatim from the build specification in `SPEC.md`).

## Design decisions

Choices made where the specification was ambiguous, or where the product owner asked for a change:

- **Use-case flow (product owner review).** The 1st line starts from *New use case* and *Your use cases*, the 2nd line from *Start a review* and *Your reviews*. A use case is one model in one cycle; the full inventory is a secondary page. Nothing is pre-filled: the requirement set, draft check, self-assessment and blind assessment are all started by the user. See `docs/superpowers/specs/2026-09-29-use-case-flow-and-real-content-design.md`.
- **The user selects, the AI assesses (product owner review).** The user chooses the requirement sources (regulation, guidelines, internal policies and standards; the mandatory internal base is pre-selected) at the start of a use case and may upload extra sources such as supervisory decisions. The AI derives the requirements from exactly those sources; the user decides on each one and locks the set. For the draft check and the self-assessment the user selects the documentation from the model documentation library (the documents of all 20 models) or uploads it; the AI assesses every requirement against exactly those documents. Model characteristics are no longer shown as tags and do not drive the choice of regulation.
- **Real content.** The requirement library holds about 2,150 requirements from 72 sources (EU and Dutch legislation, EBA, ECB, BCBS, IFRS and 33 internal policies and standards written for the prototype), each traced to its article. External references were checked against the official texts; where that was not possible the record is marked *To review* in the library. Requirements that are obligations of the institution rather than of a model (for example the IRB roll-out plan or the organisation of the validation function) are marked institution-level and shown as not applicable to model documentation, with the reason.
- **Every model supports every step.** Each of the 20 models has its own development documentation (data documentation, methodology document, reports; draft and final versions) with realistic figures, deliberate gaps and deficiencies, a code check that differs from the documentation (found by the 2nd line) and validation test results. MDL-01 keeps the hand-written pilot seed.
- **Seeded history** (two completed use cases, one submitted) is built from the same pure functions in both lines, so each line holds its own copy and no state is shared. It uses the final documents dated on or before the historic run; MDL-07's documentation only exists in its 2027 versions, so its 2026 history shows those.
- **Demo packages** in `public/demo-packages` are generated from the engine with `npx vitest run --config scripts/demo/vitest.config.ts`.
- **Locking** requires a decision on every requirement; the **reveal** requires a validator decision on every row.
- **Stored data format changed** (persist version 3). After upgrading from an earlier version, use *Reset demo data* once.
- **Regulatory notes.** US SR 11-7 (rescinded in April 2026, see the verification note in the library) and PRA SS1/23 are kept as international references only (binding level *reference*; not pre-selected). The definition-of-default requirements were checked against EBA/GL/2016/07 as amended by EBA/GL/2026/05 (applicable from 19 October 2026). The AMLR applies from 10 July 2027 and largely supersedes the Wwft; both are in the library.

1. **Plain business language.** At the product owner's request the interface avoids the word “verdict”: it uses “AI assessment”, “final outcome” and “results by outcome”, and writes “1st line / 2nd line” instead of “1LoD / 2LoD”. The data model and package files keep the field name `verdict`.
2. **Demo clock.** The pilot story is set in June 2027 (RDS v1.0 approved 12 June 2027). All new timestamps and package IDs use the date 2027-06-14 with the real time of day, so `SUB-MDL-01-20270614` matches the story.
3. **Adding an already-proposed library document** (the EBA validation handbook in the demo) records the user's explicit relevance reason and marks it “User added”.
4. **Draft check**: text inserted with “Generate section text” stays marked as AI-drafted; requirements that rely on it show “confirm before relying on this outcome” (no self-grading).
5. **Accepting** an AI assessment that is low confidence, non-compliant or not found requires a reason; Edit and Reject always require a reason and a final outcome.
6. **Model-specific requirements** added in Scoping (MS-01) are part of the locked set and are assessed in the self-assessment. The AI finds no evidence in the RDS document and proposes a *Justification*; the scripted fast-forward records it as not applicable to the RDS component, with a reason.
7. **Submission package** also carries the full text of the locked requirements, so the 2nd line never needs 1st line state.
8. **2nd line citations** are retrieved from the frozen package documents only. A row without a supporting passage becomes “Not found” (for example REQ-D09 when the DoD memo was not submitted).
9. **Comparison categories** are applied in order: code/data check differs from documentation → disagree → 1st line overruled their AI → agree; validation-layer requirements are “2nd line only”.
10. **Findings package** contains issued findings (including responded and closed ones, so a closure reaches the 1st line) and never drafts or the 2nd line matrix.
11. **Library change impact** uses the seed impact list: 7 models, 27 assessment rows. (The demo script mentions 23 models, but the inventory holds 20 models.)
12. **Seeded history** is created on the first visit to each workspace, because package hashes are computed in the browser.
13. **Uploads**: `.txt` / `.md` are read in the browser; for `.pdf` / `.docx` only metadata is registered and text extraction is simulated from the seed (section 13.3 of the specification).
14. **Live AI** is limited to free-text generation (section text, requirement extraction from text uploads, “Ask about this row”). Assessments always use the deterministic simulated engine so the demo is repeatable. Finding wording is drafted from the seed.
15. **Not a real product.** There is no authentication or database; data lives in the browser (IndexedDB). In production the workspace would follow from SSO entitlements.
17. The `xlsx` package (SheetJS 0.18.5 from npm) is used only to write files; it never parses uploaded spreadsheets.
