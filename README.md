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

Open http://localhost:3000. Use **user menu → Reset demo data** to return to the initial state (pilot at Stage 3, requirement set proposed but not locked, 10 rows accepted).

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

### Demo aids

- **Demo files** for uploads are in `public/demo-files/` (for example `MDD PD-MORT-NL v4.pdf` and `ECB decision ECB-SSM-2025-NL-ABC-123 (excerpt).pdf`). Drag them from disk, or use the “Demo files” shortcuts next to each upload area.
- **Pre-generated packages** are in `public/demo-packages/` (`SUB-…`, `FND-…`, `RSP-…`). Every import area has an “Import demo package” link in case a live export is not at hand.
- **Demo → Fast-forward** on the Self-assessment page applies the scripted decisions to the remaining rows.

### Demo script (about 10 minutes)

1. `/` → explain the four workspaces → **Model Development – 1st line**.
2. Open **MDL-01 PD Residential Mortgages NL** (Pilot).
3. **Scoping**: proposed requirements with “Why applicable”; Documents → Proposed (34); Add from library “Supervisory handbook on the validation of IRB rating systems” with a reason; Upload the ECB decision as *Requirement source* → MS-01 *Add to this model*, MS-02 *Propose to library*; **Lock set**.
4. **Draft check** on v0.7: REQ-D12b / D12c gaps → *Generate section text* → *Insert into draft* → switch to v1.0 → *Re-run check* → gaps closed.
5. **Self-assessment**: REQ-D07 (compliant, low confidence — verifiability) → accept with reason; REQ-D21 (not found) → upload `MDD PD-MORT-NL v4.pdf` → re-assessed compliant/medium with MDD §7.2; REQ-D15 → Edit to compliant (“LTV comparison added in Annex B”); Demo → Fast-forward; Export matrix (.xlsx).
6. **Submit** → checklist → sign-off → **Freeze & export** (downloads `SUB-MDL-01-<date>.rcc.json`).
7. `/` → **Model Validation – 2nd line** → import the submission package → integrity verified.
8. **Scope**: shared set (read-only), validation layer VAL-01..04, 2nd line AI configuration.
9. **Blind assessment** → run → VAL-02 script check fails (code EUR 250 vs documented EUR 100); REQ-D21 non-compliant (MoC +6% vs ~+11%).
10. **Compare** → Reveal 1st line matrix (logged) → REQ-D07 “code ≠ documentation”, REQ-D21/D15 “disagree” → draft F-07 → **Issue** → **Export findings package**.
11. **Opinion** → “Fit with conditions” → committee summary with independence statement (Export .xlsx / Print view).
12. `/` → 1st line → **Findings** → import findings package → remediation plan → **Export response package**.
13. `/` → **Library** → Version change v3.2 → v3.3 → impact → **Publish** → in the 1st line matrix REQ-D01 shows “Needs review — library changed”.
14. `/audit` → full trail including the blind run and the reveal.

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
- State: Zustand with `persist` (localStorage), partitioned per workspace: `store1lod`, `store2lod`, `storeLibrary`, `storeAudit` (`src/stores`). The 1st line pages never import the 2nd line store and vice versa; `can(workspace, action)` in `src/lib/permissions.ts` guards reads and exports.
- Packages: `src/lib/packages.ts` (manifest, SHA-256 via Web Crypto, schema and hash verification on import).
- AI engine: `src/lib/ai` — `SimulatedProvider` returns the seed results from `data/pilot_seed.json` with realistic latency and progress, and deterministic generated results for non-pilot models; the optional live provider is in `src/app/api/ai/route.ts`.
- Confidence (`src/lib/confidence.ts`): High / Medium / Low derived deterministically from five visible factors.
- Excel export: SheetJS (`xlsx`). Seed data: `data/models.json`, `data/documents.json`, `data/pilot_seed.json` (verbatim from the build specification in `SPEC.md`).

## Design decisions

Choices made where the specification was ambiguous, or where the product owner asked for a change:

1. **Plain business language.** At the product owner's request the interface avoids the word “verdict”: it uses “AI assessment”, “final outcome” and “results by outcome”, and writes “1st line / 2nd line” instead of “1LoD / 2LoD”. The data model and package files keep the field name `verdict`.
2. **Demo clock.** The pilot story is set in June 2027 (RDS v1.0 approved 12 June 2027). All new timestamps and package IDs use the date 2027-06-14 with the real time of day, so `SUB-MDL-01-20270614` matches the story.
3. **Initial scoping state.** Of the 18 proposed requirements, the 14 with applicability confidence ≥ 85% start as accepted; 4 remain proposed. Locking asks the user to confirm that remaining proposed requirements are accepted as part of the set.
4. **Adding an already-proposed library document** (the EBA validation handbook in the demo) records the user's explicit relevance reason and marks it “User added”.
5. **Draft check** starts with the v0.7 result that is also recorded in the seeded audit trail. Text inserted with “Generate section text” stays marked as AI-drafted; requirements that rely on it show “confirm before relying on this outcome” (no self-grading).
6. **Accepting** an AI assessment that is low confidence, non-compliant or not found requires a reason; Edit and Reject always require a reason and a final outcome.
7. **Model-specific requirements** added in Scoping (MS-01) are added to the self-assessment when the set is locked. The AI finds no evidence in the RDS document and proposes a *Justification*; the scripted fast-forward records it as not applicable to the RDS component, with a reason.
8. **Submission package** also carries the full text of the locked requirements, so the 2nd line never needs 1st line state.
9. **2nd line citations** are retrieved from the frozen package documents only. A row without a supporting passage becomes “Not found” (for example REQ-D09 when the DoD memo was not submitted).
10. **Comparison categories** are applied in order: code/data check differs from documentation → disagree → 1st line overruled their AI → agree; validation-layer requirements are “2nd line only”.
11. **Findings package** contains issued findings (including responded and closed ones, so a closure reaches the 1st line) and never drafts or the 2nd line matrix.
12. **Library change impact** uses the seed impact list: 7 models, 27 assessment rows. (The demo script mentions 23 models, but the inventory holds 20 models.)
13. **Seeded 2nd line review** for MDL-04 is created on the first visit to the 2nd line workspace, because its SHA-256 hash is computed in the browser.
14. **Uploads**: `.txt` / `.md` are read in the browser; for `.pdf` / `.docx` only metadata is registered and text extraction is simulated from the seed (section 13.3 of the specification).
15. **Live AI** is limited to free-text generation (section text, requirement extraction from text uploads, “Ask about this row”). Assessments always use the deterministic simulated engine so the demo is repeatable. Finding wording is drafted from the seed.
16. **Not a real product.** There is no authentication or database; data lives in the browser's localStorage. In production the workspace would follow from SSO entitlements.
17. The `xlsx` package (SheetJS 0.18.5 from npm) is used only to write files; it never parses uploaded spreadsheets.
