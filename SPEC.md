# BUILD SPEC — Model Compliance Workbench (prototype)

> **How to use this file.** Create an empty folder, open Claude Code in it, and paste this entire file as your first message (or save it as `SPEC.md` in the folder and tell Claude Code: *"Build the app described in SPEC.md"*). Everything needed — requirements, screens, data model, seed data, demo script and deploy steps — is in this file.

---

## 0. Instructions to Claude Code

You are building a **clickable, realistic prototype** of an AI-enabled regulatory compliance tool for bank model development (1st line) and model validation (2nd line). It will be demoed to a business owner, so it must **feel like a real product**: real workflows, realistic data, working interactions, no dead buttons, no lorem ipsum.

Work in this order and do not skip steps:

1. Scaffold the project (section 3), commit.
2. Write the seed data files **verbatim** from section 13 to `/data/*.json`, and the TypeScript types from section 6.
3. Build the state store and the simulated AI engine (sections 7 and 9).
4. Build the screens workspace by workspace (section 8), starting with **1st line**, then **2nd line**, then **Library**, then **Audit**.
5. Apply the visual style (section 10) throughout.
6. Walk through the demo script (section 11) yourself in the browser (`npm run dev`) and fix anything that breaks. Every step in the demo script must work.
7. Run `npm run build` and `npm run lint` with zero errors.
8. Write a short `README.md` (what it is, how to run, how to deploy, "illustrative data" disclaimer).
9. Initialise git, commit, and print the exact commands for pushing to GitHub and importing into Vercel (section 12).

If something in this spec is ambiguous, choose the option that makes the demo more realistic and note the choice in `README.md` under "Design decisions". Do not ask questions unless you are blocked.

---

## 1. Product in one paragraph

Banks must prove that every model (and the data, methodology and documentation behind it) complies with regulation (CRR, EBA guidelines, ECB guide to internal models, AI Act, GDPR…) and with internal policies and standards. Today this is done by hand in Excel "requirement matrices" of hundreds of rows, first by the model developer (1st line of defence, **1LoD**) and then again by the independent validation function (2nd line, **2LoD**). The **Model Compliance Workbench** uses AI to **generate** (requirement sets, draft documentation text, filled matrices, draft findings, summaries) and to **assess** (applicability, gaps, verdicts per requirement) — always with a citation to the source passage, a transparent confidence rationale and a proposed mitigating measure. Humans decide; the AI drafts.

**Pilot scenario:** the reference data set (RDS) documentation of `PD-MORT-NL v4`, an A-IRB probability-of-default model for Dutch residential mortgages.

---

## 2. Non-negotiable principles (implement them visibly in the UI)

1. **Citation-first.** Every AI verdict shows the quoted passage + document + version + section. Clicking it opens the document viewer scrolled to and highlighting that passage. No citation ⇒ verdict is **"Not found"**, which is visually distinct from "Non-compliant" (grey, not red), with the tooltip "Not found ≠ non-compliant: evidence may sit in another document".
2. **Confidence is explained, never a bare number.** Confidence (High/Medium/Low) is derived from five visible factors (section 9.2) and always shown with its rationale.
3. **Every non-compliant, partial, not-found or low-confidence row carries a proposed mitigating measure** of one of four types: Remediation, Verification, Compensating measure, Justification (section 9.3).
4. **AI output is always labelled** with an "AI draft" badge until a human decides; human decisions get a "Human decision" badge with name, timestamp and reason.
5. **Script checks are separate from AI checks.** Deterministic checks (data period, thresholds in code, replication) are shown with a grey "Script" badge and a pass/fail result, never as AI judgement.
6. **1LoD and 2LoD are strictly separated** (section 4). Separate workspaces, separate AI runs, separate configuration, separate data stores — **no shared state at all**. The only crossings are **file exports/imports**: the **submission package** (1LoD exports → 2LoD imports) and the **findings package** (2LoD exports → 1LoD imports). Each package carries a manifest and a SHA-256 integrity hash that is verified on import.
7. **2LoD assesses blind first.** The 1LoD matrix is hidden in the 2LoD workspace until the validator explicitly clicks "Reveal 1LoD matrix", which is logged in the audit trail with a timestamp.
8. **Versions are locked.** Every assessment run records library version, requirement-set ID and document version. Both lines assess against the same locked requirement set; 2LoD adds its own validation-standard layer on top.
9. **No auto-accept.** Bulk accept is allowed only for high-confidence compliant rows and requires a random sample of 3 rows to be opened first.
10. **No chat box as the main interface.** The primary UI is queues, matrices and document views. (A small "Ask about this row" helper is allowed inside the row detail panel.)
11. **No single "compliance score" per model.** Show counts per verdict instead.

---

## 3. Tech stack

- **Next.js 15** (App Router) + **TypeScript** (strict) + **Tailwind CSS**.
- UI primitives: **shadcn/ui** (Button, Dialog, Sheet, Tabs, Table, Badge, Tooltip, DropdownMenu, Command for search, Toast via `sonner`). Icons: **lucide-react**.
- State: **Zustand** with `persist` middleware (localStorage), **partitioned per workspace** (`store1lod`, `store2lod`, `storeLibrary`, `storeAudit`). There is **no shared store** between 1LoD and 2LoD; data crosses only via exported/imported package files (section 4.3). Package hashing: Web Crypto `crypto.subtle.digest('SHA-256', …)`. Include a **"Reset demo data"** action in the user menu that clears all stores and reloads seed data.
- Excel export: **SheetJS** (`xlsx` package). Package zip (optional): **jszip**.
- File upload: native drag-and-drop; read `.txt`/`.md` content client-side; for `.pdf`/`.docx` register metadata only (name, size, type) and simulate text extraction.
- **AI engine:** a provider interface with two implementations:
  - `SimulatedProvider` (default): returns seed results from `/data/pilot_seed.json` with realistic latency (1.2–3 s) and streaming-like progress ("Retrieving passages… 14/18 requirements assessed…"). For non-pilot models it generates plausible results deterministically from requirement + document metadata (seeded by model ID so results are stable).
  - `AnthropicProvider` (optional): used only when env var `ANTHROPIC_API_KEY` is set, through a Next.js route handler `/api/ai` (never call the API from the browser). Model name from env `ANTHROPIC_MODEL`. Use it for free-text generation actions only (Generate section text, Extract requirements from uploaded text, Draft finding wording). Always fall back to the simulated provider on error. The UI shows a small badge "AI: simulated" or "AI: live".
- No database, no auth backend. Deployable to **Vercel** with zero configuration.
- Accessibility: keyboard navigable, visible focus states, WCAG AA contrast.

---

## 4. Workspaces and separation of lines

### 4.1 Landing: "Choose workspace"

Route `/`. Four large cards:

| Workspace | Persona (fictional) | Header accent | Purpose |
|---|---|---|---|
| **Model Development – 1st line** | Sanne de Vries, Model Developer, Retail Credit Risk Modelling | Dark green header | Scope, draft-check, self-assess, submit |
| **Model Validation – 2nd line** | Pieter Bakker, Validator, Model Validation – Credit Risk | Dark blue-grey header (`#2d3e50`) | Independent assessment, compare, findings, opinion |
| **Requirement Library** | Fatima El Amrani, Library Owner, Model Risk Management | Dark green header with yellow accent line | Documents, requirements, candidates, change impact |
| **Audit (read-only)** | Internal Audit – 3rd line | Grey header | Read-only audit trail across both lines |

A visible notice under the cards: *"Demo only — in production the workspace follows from your SSO entitlements; users cannot switch between lines."*

The header of every workspace permanently shows the workspace name and a coloured line badge (**1st line** / **2nd line**), so the separation is always visible. Switching workspace always goes back through `/`.

### 4.2 Separation rules (enforce in code, not just UI)

- 1LoD pages may read: `store1lod`, `storeLibrary` (approved content only). Never `store2lod`. Findings from 2LoD exist in `store1lod` only after the 1LoD user imports a findings package.
- 2LoD pages may read: `store2lod`, `storeLibrary`. Never `store1lod`. 1LoD content exists in `store2lod` only after the validator imports a submission package; the package's 1LoD matrix stays hidden until "Reveal".
- The 2LoD AI run **never receives 1LoD verdicts as input** — only the frozen evidence documents and the requirement set. Show this in the run inspector ("Inputs: 3 documents, 22 requirements. 1LoD verdicts: not provided (independence)").
- Draft (unissued) findings are invisible to 1LoD.
- There are no comment threads across lines. Communication across lines only via package files: submission package, findings package, and the 1LoD response package (remediation plans + evidence).
- Implement a small `can(workspace, action)` helper and use it in every page and store selector.


### 4.3 Package exchange (export / import)

Three package types, all downloaded as a single `.json` file (optionally zipped with attached evidence files using `jszip`):

| Package | Exported by | Imported by | Contents |
|---|---|---|---|
| **Submission package** `SUB-<model>-<date>.rcc.json` | 1LoD (Submit screen) | 2LoD (Inbox → Import) | manifest, locked requirement set, document versions + full document text, uploads metadata, 1LoD matrix (final decisions), sign-off statement |
| **Findings package** `FND-<model>-<date>.rcc.json` | 2LoD (Findings → Export issued findings) | 1LoD (Findings → Import) | manifest, issued findings (no drafts, no 2LoD matrix), validation opinion summary |
| **Response package** `RSP-<model>-<date>.rcc.json` | 1LoD (Findings → Export responses) | 2LoD (Findings → Import responses) | manifest, remediation plans per finding, evidence metadata |

**Manifest** (every package): `packageType`, `packageId`, `modelId`, `createdAt`, `createdBy`, `line`, `libraryVersion`, `requirementSetId`, `documentVersions`, `schemaVersion: "1.0"`, `sha256` of the payload.

**On import:** verify schema and hash; show a verification card ("Integrity verified ✓ · created by Sanne de Vries, 1st line, 2027-06-14 10:32 · requirement set RS-2027-014 · library v3.2"). A tampered or mismatching package is rejected with a clear error. Importing the same package twice is idempotent. Every export and import writes an audit event in the local line's audit log.

**Why files and not a shared system:** it makes the independence of the 2nd line tangible — the validator works on a frozen copy that the 1st line can no longer change, and nothing flows back except what 2LoD explicitly exports. Show this sentence as a tooltip on every Export/Import button.

**Demo convenience:** also ship the three packages for the pilot pre-generated in `/public/demo-packages/` so the presenter can import them if a live export fails. Label that option "Import demo package".

---

## 5. Information architecture (routes)

```
/                                   Choose workspace
/dev                                1LoD home: my models (inventory filtered to owner)
/dev/models/[id]                    Model overview (stage tracker, counts, findings received)
/dev/models/[id]/scope              Stage 1 – Scoping: requirement set + documents (+ add/upload)
/dev/models/[id]/draft              Stage 2 – Draft check (sandbox)
/dev/models/[id]/assess             Stage 3 – Self-assessment review queue
/dev/models/[id]/submit             Submit: freeze and export submission package
/dev/models/[id]/findings           Import findings package, respond, export response package
/val                                2LoD home: validation inbox (import submission packages)
/val/reviews/[snapshotId]           Review overview
/val/reviews/[snapshotId]/scope     2LoD scoping: shared set + validation layer + scoping challenges
/val/reviews/[snapshotId]/assess    Blind assessment queue
/val/reviews/[snapshotId]/compare   Reveal + triage comparison
/val/reviews/[snapshotId]/findings  Draft & issue findings
/val/reviews/[snapshotId]/opinion   Validation opinion + committee summary
/library                            Library home: documents & requirements
/library/candidates                 Candidate requirements from uploads (approve/reject)
/library/change                     Version change v3.2 → v3.3 + impact across models
/audit                              Audit trail (filter by model, line, event type)
```

Every model page has a left **stage rail** (Scoping → Draft check → Self-assessment → Submit → Findings) with status per stage. Every 2LoD review has its own stage rail (Scope → Blind assessment → Compare → Findings → Opinion).

---

## 6. Data model (TypeScript)

```ts
type Line = '1lod' | '2lod' | 'library' | 'audit';
type Verdict = 'compliant' | 'partial' | 'non_compliant' | 'not_found' | 'not_applicable';
type FactorLevel = 'good' | 'weak' | 'bad';
type ConfidenceFactorKey = 'match' | 'coverage' | 'location' | 'consistency' | 'verifiability';
type MitigationType = 'remediation' | 'verification' | 'compensating' | 'justification';
type CheckType = 'ai' | 'script' | 'ai+script';

interface Model { id: string; name: string; risk_type: string; portfolio: string; purpose: string;
  methodology: string; model_family: 'statistical'|'ml'|'genai'|'expert'; regulatory_use: string;
  tier: 1|2|3; lifecycle_stage: string; ai_act_assessment: string; owner_1lod: string;
  validator_2lod: string; pilot: boolean; tags: string[];
  evidence_documents: { id: string; title: string; type: string }[]; }

interface LibraryDocument { id: string; category: 'external'|'internal'; type: string; title: string;
  issuer: string; reference: string; version_date: string;
  binding_level: 'binding_law'|'comply_or_explain'|'supervisory_expectation'|'internal_mandatory'|'reference';
  applicability: { any: string[]; all: string[] }; key_topics: string[];
  extraction_priority: 'high'|'medium'|'low'; source_url?: string|null; notes?: string|null; }

interface Requirement { id: string; text: string; source_doc: string; article: string;
  category: 'data'|'methodology'|'governance'|'documentation'|'validation';
  check_type: CheckType; applicability_rationale: string;
  layer: 'shared' | '2lod' | 'model_specific'; origin?: 'library'|'upload'; status?: 'approved'|'candidate'; }

interface RequirementSet { id: string; modelId: string; component: string; libraryVersion: string;
  requirementIds: string[]; excluded: { id: string; reason: string }[];
  addedDocuments: { docId: string; reason: string }[]; uploads: Upload[];
  lockedAt?: string; lockedBy?: string; }

interface Upload { id: string; name: string; size: number; kind: 'evidence'|'requirement_source';
  extractedRequirements?: Requirement[]; uploadedAt: string; }

interface Citation { doc: string; version: string; section: string; quote: string; }
interface ConfidenceFactors { levels: Record<ConfidenceFactorKey, FactorLevel>; notes: Partial<Record<ConfidenceFactorKey,string>>; }
interface Mitigation { type: MitigationType; text: string; }
interface ScriptResult { id: string; result: 'pass'|'fail'|'not_run'; detail: string; }

interface AssessmentRow { requirementId: string; verdict: Verdict; citations: Citation[];
  confidenceFactors: ConfidenceFactors; confidence: 'high'|'medium'|'low';  // derived, see 9.2
  rationale: string; mitigation: Mitigation | null; script?: ScriptResult | null;
  decision?: { by: string; at: string; decision: 'accepted'|'edited'|'rejected';
    finalVerdict?: Verdict; reason?: string; }; }

interface AssessmentRun { id: string; line: '1lod'|'2lod'; modelId: string; requirementSetId: string;
  libraryVersion: string; documentVersions: Record<string,string>; startedAt: string;
  provider: 'simulated'|'live'; inputsSummary: string; rows: AssessmentRow[]; }

interface PackageManifest { packageType: 'submission'|'findings'|'response'; packageId: string;
  modelId: string; createdAt: string; createdBy: string; line: '1lod'|'2lod';
  libraryVersion: string; requirementSetId: string; documentVersions: Record<string,string>;
  schemaVersion: '1.0'; sha256: string; }
interface SubmissionPackage { manifest: PackageManifest; requirementSet: RequirementSet;
  documents: { id: string; version: string; sections: { section: string; heading: string; text: string }[] }[];
  matrix1lod: AssessmentRow[]; statement: string; }   // frozen, read-only once imported
interface FindingsPackage { manifest: PackageManifest; findings: Finding[]; opinionSummary?: string; }
interface ResponsePackage { manifest: PackageManifest; responses: { findingId: string; plan: string; evidence: Upload[] }[]; }

interface Finding { id: string; modelId: string; snapshotId: string; requirementRefs: string[];
  severity: 'high'|'medium'|'low'; title: string; observation: string; impact: string;
  challenge: string; owner: string; deadline: string;
  status: 'draft'|'issued'|'response_submitted'|'closed';
  response?: { plan: string; evidence: Upload[]; at: string }; aiDrafted: boolean; }

interface AuditEvent { id: string; at: string; line: Line; actor: string; modelId?: string;
  type: string; detail: string; }
```

Applicability rule for library documents: a document applies to a model if the model has **any** tag in `applicability.any` (or `any` is empty) **and all** tags in `applicability.all`.

---

## 7. State & audit trail

- Every user action that changes state writes an `AuditEvent` (lock set, add document, upload, run assessment, accept/edit/reject row, submit, reveal 1LoD matrix, issue finding, respond to finding, approve candidate requirement, publish library version).
- Initial state (after seed load / reset): the pilot model `MDL-01` is at **Stage 3 – Self-assessment**, with the requirement set proposed but **not yet locked**, and 10 rows already accepted (`decisions_1lod_initial`). The presenter locks the set and continues live. All other models show plausible status per their `lifecycle_stage` but are only partially interactive (Scoping works for every model; other stages show "Pilot only in this prototype" empty states with a clear explanation).
- Seed the 2LoD store with one **already-imported** submission package for `MDL-04` (PD Retail SME) so the 2LoD inbox is never empty, with generic generated rows.

---

## 8. Screens — detailed requirements

### 8.1 1st line — Home `/dev`
- Table of models (from `models.json`), filter chips by model family, search, columns: ID, model (+portfolio), regulatory use, family badge, tier, lifecycle stage badge, # applicable documents (computed), open findings count. Pilot model has a yellow "Pilot" badge.
- KPI tiles: models in scope, open gaps, awaiting validation, findings received.

### 8.2 1st line — Stage 1 Scoping `/dev/models/[id]/scope`
Left column **Model attributes**: tag chips (read-only in prototype, with tooltip "from model inventory"), component selector (RDS documentation / Methodology (MDD) / Full model).

Middle **Proposed requirement set** (AI-generated):
- Table: requirement ID, text, source (article + document), **"Why applicable"** (applicability rationale), confidence bar, decision (Accept / Exclude). Exclude requires a reason (dialog).
- Chips: Proposed · Accepted · Excluded · Not applicable (the not-applicable list is browsable, each with "why not applicable").
- "Bulk accept high-confidence" button (rule 9).
- **"Generate requirement set"** button re-runs the simulated generation with a progress state.

Right column **Documents** with three tabs:
1. **Proposed** — applicable library documents (computed via the applicability rule), grouped External / Internal, with binding-level badge.
2. **Add from library** — `Command`-style search over all 72 library documents; selecting one requires a one-line "why relevant" reason; added documents show a "User added" badge.
3. **Upload** — drag-and-drop zone. On upload the user classifies the file: **Evidence** (MDD, test report, memo) or **Requirement source** (ECB decision, previous validation report, supervisory letter, internal memo with obligations). For requirement sources, run simulated extraction (use `upload_examples` in the seed: if the filename matches one of them, return its extracted requirements; otherwise generate 1–2 plausible ones). Extracted requirements appear in a panel "Model-specific requirements (from uploads)" with per-item choice: **Add to this model** (layer `model_specific`) or **Propose to library** (creates a `candidate` in `/library/candidates`).

Bottom **Lock bar**: "Lock requirement set RS-2027-014 · Library v3.2 · N requirements · M documents". Button **Lock set** (confirmation dialog explaining that 2LoD will assess against this exact set). After locking, scoping becomes read-only with an "Unlock (creates new version)" option.

### 8.3 1st line — Stage 2 Draft check `/dev/models/[id]/draft`
- Banner: "Sandbox — no status, no sign-off. Run as often as you like."
- Version selector: draft **v0.7** (default) or final v1.0.
- Split view: **document viewer** (left, serif font, section headings, highlighted passages: yellow = cited evidence, red = gap location) and **gap panel** (right).
- Gap panel: stacked bar (addressed / partial / gap / not yet in draft), then cards per requirement sorted Gap → Partial → Script checks. Each card: verdict badge, requirement, quoted evidence or "no passage found", **confidence with factor rationale (collapsible)**, **proposed mitigating measure**, and actions:
  - **Generate section text** (AI) → opens a Sheet with an AI-drafted paragraph grounded in named sources (e.g. "sources: exclusion_log_v7, dq_report_v3"), numbers marked as "from script". Actions: Insert into draft (inserted text keeps a blue "AI-drafted" block style), Copy, Discard.
  - Clicking a card scrolls the document to the passage.
- **Re-run check** button with progress; switching to v1.0 and re-running shows the gaps closed (D12b, D12c now compliant).
- Rule: "No self-grading" — text inserted by "Generate section text" is marked, and its check result shows a note "AI-drafted text — confirm before relying on this verdict".

### 8.4 1st line — Stage 3 Self-assessment `/dev/models/[id]/assess`
- Header: document v1.0 · requirement set ID · library version · AI provider badge · **Run assessment** (if no run yet) / **Re-run changed rows** (only rows whose evidence changed; others keep their human decision).
- Progress card: "X of N reviewed · Y open gaps · est. Z min left".
- Queue filter chips: **Needs attention** (not found, partial, non-compliant, or low/medium confidence) · Not found · High-confidence compliant · Decided · All. Default sort: Needs attention first, then by confidence ascending.
- Table columns: requirement (ID + short text), AI verdict badge, evidence (section refs), confidence (High/Med/Low pill), mitigation type icon, your decision.
- **Row detail panel** (right, sticky):
  1. Requirement text + source article (link to library document).
  2. AI verdict + "AI draft" badge.
  3. **Evidence cited** — quote blocks; click opens document viewer at passage.
  4. **Confidence: High/Medium/Low — why** — list of the five factors, each with a good/weak/bad icon and the note from the seed (e.g. *Verifiability — weak: "Code repository not linked to this run; implementation of the threshold cannot be confirmed."*).
  5. **Rationale** (AI).
  6. **Proposed mitigating measure** — type badge (Remediation / Verification / Compensating measure / Justification) + text + action button depending on type: Remediation → "Create task"; Verification → "Run script" (if a script ID is known) or "Upload evidence"; Compensating → "Link to MoC register"; Justification → "Draft justification".
  7. **Script check** block if present (grey badge, pass/fail, detail).
  8. Decision: **Accept** / **Edit** (choose final verdict + reason) / **Reject** (reason required). Reason input with inline validation.
  9. "Ask about this row" (optional, small).
- "Upload evidence" from a Not-found row: upload a file (e.g. `MDD PD-MORT-NL v4.pdf` or `DoD implementation memo.pdf`), then the row re-assesses and shows the new citation (simulate: REQ-D21 → citation "MDD §7.2 — MoC category A +6%" verdict compliant medium; REQ-D09 → citation "DoD memo §3 — probation 3 months" verdict compliant medium).
- **Fast-forward** button (small, in a "Demo" menu): applies `decisions_1lod_scripted`.
- **Export matrix (.xlsx)** — columns: Req ID, requirement, source, AI verdict, confidence, confidence rationale, citations, mitigation type, mitigation, human decision, final verdict, reason, decided by/at, library version, doc version.

### 8.5 1st line — Submit `/dev/models/[id]/submit`
- Checklist: requirement set locked ✓, all rows decided ✓/✗, all non-compliant/partial rows have a mitigation or justification ✓/✗, document versions frozen.
- Summary counts per final verdict.
- Sign-off statement (checkbox): "I confirm this self-assessment reflects the model documentation as submitted."
- **Freeze & export submission package** freezes the 1LoD matrix (read-only), downloads `SUB-MDL-01-<date>.rcc.json` (section 4.3), and logs an audit event. Success screen: "Package SUB-MDL-01-20270614 exported (SHA-256 shown, truncated). Send it to Model Validation through the regular channel. The 2nd line will assess independently; findings come back as a findings package."

### 8.6 1st line — Findings received `/dev/models/[id]/findings`
- Empty state with **Import findings package** (drag-and-drop or file picker) + verification card on import.
- Imported findings: severity, title, observation, impact, challenge question, owner, deadline, status.
- Response: remediation plan text + evidence upload per finding → **Export response package**.

### 8.7 2nd line — Inbox `/val`
- **Import submission package** (drag-and-drop or file picker) → integrity verification card → review created.
- Reviews table: model, package ID, created by/at (from manifest), requirement-set ID, doc versions, hash (truncated), status (Imported / In review / Findings exported / Opinion issued).

### 8.8 2nd line — Scope `/val/reviews/[id]/scope`
- **Shared requirement set** (from snapshot, read-only) — the *what*.
- **Validation layer** (2LoD-owned, from internal validation standards) — the *how strict*: seed requirements `VAL-01..04` with layer `2lod`; validator can add more from validation standards in the library.
- **Scoping challenge**: validator can flag library requirements that 1LoD excluded or missed ("Add as scoping challenge" → creates a draft finding of type scoping gap). Seed suggestion: REQ-D55 is not in scope because it is v3.3 — show as info only.
- **2LoD AI configuration** card (read-only in prototype): own prompt set version "VAL-PROMPTS 1.4", own confidence thresholds, owner "Model Validation". Text: "Independent of 1st line configuration."

### 8.9 2nd line — Blind assessment `/val/reviews/[id]/assess`
- Prominent banner: **"Blind mode — 1st line verdicts are hidden until you reveal them."**
- Run assessment (simulated from `assessment_2lod_blind`), run inspector shows inputs (documents + requirements; "1LoD verdicts: not provided").
- Same queue/detail pattern as 8.4 (reuse components), including confidence factors and mitigations (for 2LoD rows without seeded factors, derive factors: compliant → all good except verifiability; partial → coverage weak; non_compliant with script fail → consistency bad, verifiability good).
- Script checks VAL-01, VAL-02 (CC-03 fail) shown as Script badges.
- Validator decides per row (accept/edit/reject with reason) — this is the validator's own verdict.

### 8.10 2nd line — Compare `/val/reviews/[id]/compare`
- Button **Reveal 1LoD matrix** (confirmation: "This will be logged. Your blind verdicts are locked once revealed.").
- After reveal: KPI tiles and triage table with categories:
  - **Agree** (1LoD final = 2LoD) → action "Sample-check citation"
  - **1LoD overruled their AI** → "Verify 1LoD reason" (show 1LoD reason)
  - **Disagree** (1LoD final ≠ 2LoD) → "Full review"
  - **Code/data check differs from documentation** → "Raise finding"
  - **2LoD-only requirement** (validation layer) → show result
- Each row: requirement, 1LoD AI verdict, 1LoD final + reason, 2LoD verdict + rationale, action button "Draft finding" (pre-fills from `draft_findings_2lod` where the requirement matches; otherwise AI-drafts).

### 8.11 2nd line — Findings `/val/reviews/[id]/findings`
- List of draft findings (AI-drafted badge) with editable fields: severity (select), title, observation, evidence quotes (doc passage + code line), impact, challenge question, owner, deadline.
- **Issue finding** → status `issued`. **Export findings package** contains only issued findings (never drafts, never the 2LoD matrix).
- **Import response package** shows 1LoD remediation plans per finding; validator can **Close** with a closure note.

### 8.12 2nd line — Opinion `/val/reviews/[id]/opinion`
- AI-drafted **validation opinion**: Fit for purpose / Fit with conditions / Not fit (select; default suggestion "Fit with conditions" because of 2 high findings), rationale paragraph, conditions list derived from high findings.
- **Committee summary**: counts per verdict, findings table, requirement-set and version info, independence statement (blind run timestamp, reveal timestamp). Buttons: Export (.xlsx) and Print view (clean print CSS).

### 8.13 Library `/library`, `/library/candidates`, `/library/change`
- Documents table (72) with filters: external/internal, binding level, type, topic search; detail sheet with key topics, applicability tags, "applies to N models" (list).
- Requirements table (pilot requirements + model-specific ones), with source traceability.
- **Candidates**: requirements proposed from uploads → Approve (becomes library requirement) / Reject (reason) / Edit.
- **Change**: v3.2 → v3.3 diff (from `library_change`): modified requirement with inline diff (red strike / green insert), new requirement, source and impact note; impact table across models (model, affected rows, status "Needs review"); button **Publish v3.3** (confirmation) → affected rows in the 1LoD pilot matrix get a "Needs review — library changed" badge.

### 8.14 Audit `/audit`
- Read-only chronological table of `AuditEvent`s with filters (model, line, type). Seed ~15 historical events so it is never empty (e.g. "2027-05-02 · 1LoD · Sanne de Vries · Requirement set proposed").

---

## 9. AI engine (simulated) — behaviour

### 9.1 Run mechanics
- Every run: create `AssessmentRun`, show a progress overlay with steps: *Loading requirement set → Retrieving passages → Assessing requirement k/N → Running script checks → Done*. Total 2–4 s.
- **Run inspector** (drawer, "View run details"): run ID, provider, library version, requirement-set ID, document versions, inputs summary, and for the selected row: the prompt template (show a realistic template, see below), retrieved passages, and the structured JSON output.

Prompt template to display (and to use in `AnthropicProvider` for live generation):
```
SYSTEM: You assess one regulatory requirement against model documentation.
Use ONLY the passages provided. Quote evidence verbatim. If no passage addresses
the requirement, return verdict "not_found". Do not invent numbers.
Return JSON: {verdict, citations[{section, quote}], factors{match,coverage,location,
consistency,verifiability}, factor_notes, rationale, mitigation{type,text}}.
REQUIREMENT: {requirement.id} — {requirement.text} (source: {requirement.article})
PASSAGES: {top-k passages with section ids}
```

### 9.2 Confidence derivation (deterministic, implement exactly)
Five factors, each `good | weak | bad`:
| Factor | good | weak | bad |
|---|---|---|---|
| Evidence match | exact quote found | paraphrase / indirect | no passage |
| Coverage | all sub-elements addressed | some missing | most missing |
| Location | expected template section | elsewhere in document | not located |
| Consistency | no conflicting passages | minor tension | contradiction (doc vs doc, or doc vs code) |
| Verifiability | confirmed by script/data | documentation only | cannot be verified with linked sources |

Confidence = **High** if all factors good, or only verifiability weak · **Medium** if exactly one other factor weak · **Low** if any factor bad or two or more weak.
Display: pill + "Why?" expander listing each factor with icon and note.

### 9.3 Mitigating measures
| Type | When | Example |
|---|---|---|
| Remediation | Gap or partial — fix the evidence | "Add comparison of default rates per segment…" |
| Verification | Low confidence — reduce uncertainty | "Link repository and run script CC-03" |
| Compensating measure | Deficiency that cannot be fixed | "Link deficiency to MoC category A" |
| Justification | Deviation or non-applicability | "Explain why buy-to-let is out of scope" |

UI distinction to make explicit: *a gap needs remediation; low confidence needs verification.*

### 9.4 Non-pilot models
Deterministic pseudo-random (seeded by model ID + requirement ID): ~70% compliant/high, 15% partial/medium, 8% not found/low, 7% non-compliant/medium. Generate short rationales from templates. Use the model's applicable documents to build ~15 generic requirements (one or two per high-priority document, text derived from `key_topics`).

---

## 10. Visual style

Corporate, calm, Dutch-bank feel. **Do not use any real bank name, logo or trademarked font.** App name: **Model Compliance Workbench**. Permanent small banner in the header: **"Prototype · illustrative data"**.

Design tokens (Tailwind theme extension):
```
green-900 #003b3b   green-800 #004c4c (primary header)   green-600 #00716b (primary buttons)
green-500 #00857a   green-100 #d9efec   green-50 #eef8f6
yellow #ffd200 (accent, primary CTA like "Submit")   yellow-100 #fff6cc
ink #1c2b2b  ink-2 #4b5c5c  ink-3 #7a8a8a  line #dfe6e5  bg #f5f7f7  card #ffffff
red #c0392b red-100 #fbe7e4 · amber #b86e00 amber-100 #fff0d6 · blue #1d5fa8 blue-100 #e3eefb
2LoD header #2d3e50 · Audit header #4b5563
radius 8px (cards 12px) · font: system-ui stack ("Segoe UI", Roboto, Arial) · document viewer: Georgia serif
```
Verdict badges: Compliant = green-100/green-800 · Partial = amber-100/amber · Non-compliant = red-100/red · Not found = grey · Not applicable = outline grey. AI draft = blue-100/blue. Script = grey `#e9e9e9`. Human decision = yellow-100/`#6b5800`.
Logo mark: a 28px rounded square in yellow with the letters "MC" in green-900.
Responsive down to 1024px; tables scroll horizontally inside their card; no horizontal page scroll.

---

## 11. Demo script (must work end to end, ~10 minutes)

1. `/` → explain the four workspaces and the separation notice → **Model Development – 1st line**.
2. `/dev` → open **MDL-01 PD Residential Mortgages NL** (Pilot).
3. **Scoping**: show proposed requirements with "why applicable"; open *Documents → Proposed* (34 documents); **Add from library** "EBA Supervisory handbook on validation" with reason; **Upload** `ECB decision ECB-SSM-2025-NL-ABC-123 (excerpt).pdf` as *Requirement source* → 2 model-specific requirements extracted (PD add-on obligation, buy-to-let limitation) → add MS-01 to this model, propose MS-02 to library. **Lock set**.
4. **Draft check** on v0.7: show REQ-D12b/D12c gaps → **Generate section text** for §4.2 → insert (AI-drafted block) → switch to v1.0 → Re-run → gaps closed.
5. **Self-assessment**: queue shows Needs attention first. Open **REQ-D07**: verdict compliant but **Low confidence — why?** Verifiability bad: code not linked → mitigation *Verification: run CC-03*. Accept with reason (the developer doesn't run it — this sets up the 2LoD finding). Open **REQ-D21**: Not found → **Upload evidence** `MDD PD-MORT-NL v4.pdf` → re-assessed compliant/medium with citation MDD §7.2. Open **REQ-D15**: partial → mitigation *Remediation* → Edit to compliant with reason "LTV comparison added in Annex B". Use **Demo → Fast-forward** for the rest. **Export matrix**.
6. **Submit** → checklist all green → sign-off → **Freeze & export** → the package file downloads.
7. `/` → **Model Validation – 2nd line** → **Import submission package** (the downloaded file) → integrity verified card → review opens.
8. **Scope**: shared set (read-only) + validation layer VAL-01..04 + 2LoD AI configuration card.
9. **Blind assessment** → run → VAL-02 script check **FAIL** (code EUR 250 vs documented EUR 100); REQ-D21 non-compliant (MoC +6% vs needed +11%).
10. **Compare** → Reveal 1LoD matrix (logged) → triage: D07 "code ≠ doc", D21 and D15 "disagree", others "agree" → Draft finding F-07 from D07 → **Issue** → **Export findings package**.
11. **Opinion** → "Fit with conditions" → committee summary with independence statement.
12. `/` → **1st line** → Findings → **Import findings package** → F-07 visible → write remediation plan → **Export response package**.
13. `/` → **Library** → Change v3.2 → v3.3 → impact 23 models (show top list) → Publish → back in 1LoD pilot matrix REQ-D01 shows "Needs review — library changed".
14. `/audit` → full trail including the blind-run timestamp and the reveal event.

---

## 12. Deploy (GitHub + Vercel)

After `npm run build` succeeds:
```
git init && git add -A && git commit -m "Model Compliance Workbench prototype"
gh repo create model-compliance-workbench --private --source=. --push   # or create the repo on github.com and push
```
Then on vercel.com: **Add New → Project → Import** the GitHub repo → framework Next.js (auto-detected) → Deploy. Optional env vars: `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`. Recommended: enable **Vercel Deployment Protection** (password or Vercel authentication) so the prototype is not publicly accessible.

---

## 13. Seed data — write these files verbatim

### 13.1 `/data/models.json` and `/data/documents.json`
The block below is one JSON object with keys `models` (20) and `documents` (72). Split it into the two files.

```json
{
"models": [
{"id": "MDL-01", "name": "PD Residential Mortgages NL (PD-MORT-NL v4)", "risk_type": "Credit risk", "portfolio": "Dutch residential mortgages", "purpose": "12-month PD for IRB capital; secondary use in arrears management", "methodology": "Logistic regression scorecard, calibrated to long-run average on 12-grade master scale", "model_family": "statistical", "regulatory_use": "A-IRB PD", "tier": 1, "lifecycle_stage": "Development – RDS construction", "ai_act_assessment": "Assess: statistical model with fixed logic – likely outside AI system definition; document the reasoning.", "owner_1lod": "Retail Credit Risk Modelling", "validator_2lod": "Model Validation – Credit Risk", "pilot": true, "tags": ["all_models", "capital", "credit", "irb", "irb_pd", "mortgage", "personal_data", "retail", "risk_reporting", "statistical"], "evidence_documents": [{"id": "EVD-01-RDS", "title": "Dataset Construction and DQ Assessment – Residential Real Estate Mortgages", "type": "RDS documentation"}, {"id": "EVD-01-MDD", "title": "Model Development Document PD-MORT-NL v4", "type": "MDD"}, {"id": "EVD-01-CODE", "title": "RDS build and estimation code repository", "type": "code"}]},
{"id": "MDL-02", "name": "LGD Residential Mortgages NL", "risk_type": "Credit risk", "portfolio": "Dutch residential mortgages", "purpose": "LGD incl. downturn for IRB capital", "methodology": "Cure-rate and loss-given-liquidation components with NHG and collateral haircuts", "model_family": "statistical", "regulatory_use": "A-IRB LGD", "tier": 1, "lifecycle_stage": "Live – annual validation", "ai_act_assessment": "Assess: statistical model with fixed logic – likely outside AI system definition; document the reasoning.", "owner_1lod": "Retail Credit Risk Modelling", "validator_2lod": "Model Validation – Credit Risk", "pilot": false, "tags": ["all_models", "capital", "credit", "irb", "irb_lgd", "mortgage", "personal_data", "retail", "risk_reporting", "statistical"], "evidence_documents": [{"id": "EVD-02-RDS", "title": "LGD workout RDS documentation", "type": "RDS documentation"}, {"id": "EVD-02-MDD", "title": "MDD LGD Mortgages", "type": "MDD"}, {"id": "EVD-02-VAL", "title": "Annual validation report 2026", "type": "validation report"}]},
{"id": "MDL-03", "name": "EAD/CCF Retail Revolving (credit cards and overdrafts)", "risk_type": "Credit risk", "portfolio": "Retail revolving exposures", "purpose": "CCF for undrawn limits in IRB capital", "methodology": "Segmented CCF estimation with 12-month fixed horizon", "model_family": "statistical", "regulatory_use": "A-IRB EAD", "tier": 2, "lifecycle_stage": "Pre-submission – 1LoD self-assessment", "ai_act_assessment": "Assess: statistical model with fixed logic – likely outside AI system definition; document the reasoning.", "owner_1lod": "Retail Credit Risk Modelling", "validator_2lod": "Model Validation – Credit Risk", "pilot": false, "tags": ["all_models", "capital", "credit", "irb", "irb_ead", "personal_data", "retail", "risk_reporting", "statistical"], "evidence_documents": [{"id": "EVD-03-MDD", "title": "MDD CCF Retail Revolving", "type": "MDD"}, {"id": "EVD-03-RDS", "title": "CCF RDS documentation", "type": "RDS documentation"}]},
{"id": "MDL-04", "name": "PD Retail SME (gradient boosting)", "risk_type": "Credit risk", "portfolio": "SME and self-employed clients", "purpose": "12-month PD for IRB capital", "methodology": "Gradient boosting with monotonic constraints, SHAP explainability, calibration layer", "model_family": "ml", "regulatory_use": "A-IRB PD", "tier": 1, "lifecycle_stage": "Validation – 2LoD review", "ai_act_assessment": "Assess: ML-based system; natural persons (self-employed) in scope may bring Annex III 5(b) into play if used for creditworthiness decisions – high-risk obligations from 2027-12-02.", "owner_1lod": "SME Credit Risk Modelling", "validator_2lod": "Model Validation – Credit Risk", "pilot": false, "tags": ["all_models", "capital", "credit", "irb", "irb_pd", "ml", "personal_data", "retail", "risk_reporting", "sme"], "evidence_documents": [{"id": "EVD-04-MDD", "title": "MDD PD Retail SME v2", "type": "MDD"}, {"id": "EVD-04-XAI", "title": "Explainability and fairness report", "type": "test report"}, {"id": "EVD-04-RDS", "title": "SME RDS documentation", "type": "RDS documentation"}]},
{"id": "MDL-05", "name": "LGD Retail SME", "risk_type": "Credit risk", "portfolio": "SME and self-employed clients", "purpose": "LGD incl. downturn for IRB capital", "methodology": "Workout LGD with collateral and guarantee components", "model_family": "statistical", "regulatory_use": "A-IRB LGD", "tier": 2, "lifecycle_stage": "Change – material change application", "ai_act_assessment": "Assess: statistical model with fixed logic – likely outside AI system definition; document the reasoning.", "owner_1lod": "SME Credit Risk Modelling", "validator_2lod": "Model Validation – Credit Risk", "pilot": false, "tags": ["all_models", "capital", "credit", "irb", "irb_lgd", "personal_data", "retail", "risk_reporting", "sme", "statistical"], "evidence_documents": [{"id": "EVD-05-MDD", "title": "MDD LGD Retail SME", "type": "MDD"}, {"id": "EVD-05-CHG", "title": "Change classification memo", "type": "change memo"}]},
{"id": "MDL-06", "name": "PD Corporates (mid-market)", "risk_type": "Credit risk", "portfolio": "Corporate clients up to EUR 500m revenue", "purpose": "12-month PD for IRB capital and credit approval", "methodology": "Shadow-rating scorecard: financials + qualitative assessment, expert overrides", "model_family": "statistical", "regulatory_use": "IRB PD (corporates)", "tier": 1, "lifecycle_stage": "Live – monitoring", "ai_act_assessment": "Assess: statistical model with fixed logic – likely outside AI system definition; document the reasoning.", "owner_1lod": "Wholesale Credit Risk Modelling", "validator_2lod": "Model Validation – Credit Risk", "pilot": false, "tags": ["all_models", "capital", "corporate", "credit", "credit_origination", "irb", "irb_pd", "risk_reporting", "statistical"], "evidence_documents": [{"id": "EVD-06-MDD", "title": "MDD Corporate Rating Model", "type": "MDD"}, {"id": "EVD-06-MON", "title": "Quarterly monitoring report Q2 2026", "type": "monitoring report"}]},
{"id": "MDL-07", "name": "IFRS 9 ECL – Residential Mortgages", "risk_type": "Credit risk", "portfolio": "Dutch residential mortgages", "purpose": "Lifetime and 12-month ECL for provisioning", "methodology": "PIT PD term structures, LGD with forward-looking HPI, three macro scenarios", "model_family": "statistical", "regulatory_use": "IFRS 9", "tier": 1, "lifecycle_stage": "Live – annual review", "ai_act_assessment": "Assess: statistical model with fixed logic – likely outside AI system definition; document the reasoning.", "owner_1lod": "IFRS 9 Modelling", "validator_2lod": "Model Validation – Credit Risk", "pilot": false, "tags": ["all_models", "credit", "ifrs9", "mortgage", "personal_data", "retail", "risk_reporting", "statistical"], "evidence_documents": [{"id": "EVD-07-MDD", "title": "IFRS 9 Mortgages methodology document", "type": "MDD"}, {"id": "EVD-07-OVL", "title": "Management overlay memo", "type": "memo"}]},
{"id": "MDL-08", "name": "IFRS 9 ECL – Corporates", "risk_type": "Credit risk", "portfolio": "Corporate and institutional clients", "purpose": "Lifetime and 12-month ECL for provisioning", "methodology": "TTC-to-PIT conversion of rating PDs, sector-specific macro linkages", "model_family": "statistical", "regulatory_use": "IFRS 9", "tier": 1, "lifecycle_stage": "Development – methodology", "ai_act_assessment": "Assess: statistical model with fixed logic – likely outside AI system definition; document the reasoning.", "owner_1lod": "IFRS 9 Modelling", "validator_2lod": "Model Validation – Credit Risk", "pilot": false, "tags": ["all_models", "corporate", "credit", "ifrs9", "risk_reporting", "statistical"], "evidence_documents": [{"id": "EVD-08-MDD", "title": "IFRS 9 Corporates methodology (draft)", "type": "MDD"}]},
{"id": "MDL-09", "name": "IFRS 9 SICR and Staging", "risk_type": "Credit risk", "portfolio": "All IFRS 9 portfolios", "purpose": "Stage allocation (1/2/3)", "methodology": "Relative PD thresholds, backstops (30 dpd, forbearance, watchlist)", "model_family": "expert", "regulatory_use": "IFRS 9", "tier": 2, "lifecycle_stage": "Live – annual review", "ai_act_assessment": "Assess: statistical model with fixed logic – likely outside AI system definition; document the reasoning.", "owner_1lod": "IFRS 9 Modelling", "validator_2lod": "Model Validation – Credit Risk", "pilot": false, "tags": ["all_models", "credit", "ifrs9", "personal_data", "risk_reporting"], "evidence_documents": [{"id": "EVD-09-MDD", "title": "SICR methodology document", "type": "MDD"}]},
{"id": "MDL-10", "name": "Macroeconomic Scenario and Satellite Models", "risk_type": "Enterprise risk", "portfolio": "Bank-wide", "purpose": "Macro scenarios and PD/LGD satellite models for IFRS 9 FLI, stress testing and ICAAP", "methodology": "Vector autoregression for scenarios; panel regressions for satellite models", "model_family": "statistical", "regulatory_use": "Stress testing / IFRS 9 / ICAAP", "tier": 1, "lifecycle_stage": "Live – annual review", "ai_act_assessment": "Assess: statistical model with fixed logic – likely outside AI system definition; document the reasoning.", "owner_1lod": "Enterprise Stress Testing", "validator_2lod": "Model Validation – Enterprise Risk", "pilot": false, "tags": ["all_models", "credit", "icaap", "ifrs9", "risk_reporting", "statistical", "stress_test"], "evidence_documents": [{"id": "EVD-10-MDD", "title": "Scenario and satellite model documentation", "type": "MDD"}]},
{"id": "MDL-11", "name": "IRRBB – Mortgage Prepayment", "risk_type": "Interest rate risk", "portfolio": "Dutch residential mortgages", "purpose": "Prepayment assumptions for EVE/NII and hedging", "methodology": "Multinomial logit on refinancing incentive, seasoning, penalty-free allowance", "model_family": "statistical", "regulatory_use": "IRRBB", "tier": 1, "lifecycle_stage": "Pre-submission – 1LoD self-assessment", "ai_act_assessment": "Assess: statistical model with fixed logic – likely outside AI system definition; document the reasoning.", "owner_1lod": "ALM Modelling", "validator_2lod": "Model Validation – Market & ALM", "pilot": false, "tags": ["all_models", "irrbb", "mortgage", "personal_data", "retail", "risk_reporting", "statistical"], "evidence_documents": [{"id": "EVD-11-MDD", "title": "Prepayment model documentation", "type": "MDD"}]},
{"id": "MDL-12", "name": "IRRBB – Non-Maturity Deposits", "risk_type": "Interest rate risk", "portfolio": "Retail and SME savings and current accounts", "purpose": "Behavioural repricing and replicating portfolio", "methodology": "Volume and rate pass-through models, stable/core split", "model_family": "statistical", "regulatory_use": "IRRBB", "tier": 1, "lifecycle_stage": "Live – monitoring", "ai_act_assessment": "Assess: statistical model with fixed logic – likely outside AI system definition; document the reasoning.", "owner_1lod": "ALM Modelling", "validator_2lod": "Model Validation – Market & ALM", "pilot": false, "tags": ["all_models", "irrbb", "retail", "risk_reporting", "statistical"], "evidence_documents": [{"id": "EVD-12-MDD", "title": "NMD model documentation", "type": "MDD"}]},
{"id": "MDL-13", "name": "Market Risk – Expected Shortfall (IMA)", "risk_type": "Market risk", "portfolio": "Trading book", "purpose": "Own funds requirements for market risk", "methodology": "Historical-simulation expected shortfall with liquidity horizons; NMRF stress scenarios", "model_family": "statistical", "regulatory_use": "Market risk IMA", "tier": 1, "lifecycle_stage": "Change – CRR3 migration", "ai_act_assessment": "Assess: statistical model with fixed logic – likely outside AI system definition; document the reasoning.", "owner_1lod": "Market Risk Modelling", "validator_2lod": "Model Validation – Market & ALM", "pilot": false, "tags": ["all_models", "capital", "market", "market_ima", "risk_reporting", "statistical"], "evidence_documents": [{"id": "EVD-13-MDD", "title": "ES model documentation", "type": "MDD"}, {"id": "EVD-13-BT", "title": "Backtesting and PLA report", "type": "test report"}]},
{"id": "MDL-14", "name": "Derivatives Valuation and XVA", "risk_type": "Market risk", "portfolio": "OTC derivatives", "purpose": "Fair value, CVA/FVA and prudent valuation adjustments", "methodology": "Monte Carlo exposure simulation, Hull-White rates model", "model_family": "statistical", "regulatory_use": "Valuation", "tier": 2, "lifecycle_stage": "Live – annual review", "ai_act_assessment": "Assess: statistical model with fixed logic – likely outside AI system definition; document the reasoning.", "owner_1lod": "Front Office Quants", "validator_2lod": "Model Validation – Market & ALM", "pilot": false, "tags": ["all_models", "market", "risk_reporting", "statistical", "valuation"], "evidence_documents": [{"id": "EVD-14-MDD", "title": "XVA methodology document", "type": "MDD"}]},
{"id": "MDL-15", "name": "AML Transaction Monitoring", "risk_type": "Financial crime", "portfolio": "Retail and business payments", "purpose": "Generate alerts on potentially unusual transactions", "methodology": "Rules-based scenarios with ML alert-prioritisation layer", "model_family": "ml", "regulatory_use": "AML", "tier": 1, "lifecycle_stage": "Validation – 2LoD review", "ai_act_assessment": "Assess: ML prioritisation layer is an AI system; not an Annex III high-risk use for private AML – general AI governance and Art. 4 AI literacy apply.", "owner_1lod": "FEC Analytics", "validator_2lod": "Model Validation – Financial Crime", "pilot": false, "tags": ["all_models", "aml", "ml", "personal_data"], "evidence_documents": [{"id": "EVD-15-MDD", "title": "TM scenario and tuning documentation", "type": "MDD"}, {"id": "EVD-15-ATL", "title": "Above/below-the-line testing report", "type": "test report"}]},
{"id": "MDL-16", "name": "AML Customer Risk Rating", "risk_type": "Financial crime", "portfolio": "All clients", "purpose": "Customer risk classification for CDD intensity", "methodology": "Weighted risk-factor scoring (geography, product, channel, behaviour)", "model_family": "expert", "regulatory_use": "AML", "tier": 2, "lifecycle_stage": "Live – monitoring", "ai_act_assessment": "Assess: statistical model with fixed logic – likely outside AI system definition; document the reasoning.", "owner_1lod": "FEC Analytics", "validator_2lod": "Model Validation – Financial Crime", "pilot": false, "tags": ["all_models", "aml", "personal_data"], "evidence_documents": [{"id": "EVD-16-MDD", "title": "CRR methodology document", "type": "MDD"}]},
{"id": "MDL-17", "name": "Payments Fraud Detection", "risk_type": "Fraud", "portfolio": "Card and instant payments", "purpose": "Real-time fraud scoring and blocking", "methodology": "Gradient boosting on transaction and device features, real-time scoring", "model_family": "ml", "regulatory_use": "Fraud / PSD2 TRA", "tier": 2, "lifecycle_stage": "Live – monitoring", "ai_act_assessment": "Assess: AI system; fraud detection is explicitly excluded from Annex III 5(b) – not high-risk; transparency and AI governance apply.", "owner_1lod": "Fraud Analytics", "validator_2lod": "Model Validation – Financial Crime", "pilot": false, "tags": ["all_models", "fraud", "ml", "personal_data"], "evidence_documents": [{"id": "EVD-17-MDD", "title": "Fraud model documentation", "type": "MDD"}, {"id": "EVD-17-MON", "title": "Fraud model monitoring dashboard export", "type": "monitoring report"}]},
{"id": "MDL-18", "name": "Mortgage Acceptance Scorecard", "risk_type": "Credit risk", "portfolio": "New Dutch mortgage applications", "purpose": "Accept/refer/decline in mortgage origination", "methodology": "Application scorecard (logistic regression) with affordability rules", "model_family": "statistical", "regulatory_use": "Credit origination", "tier": 1, "lifecycle_stage": "Development – RDS construction", "ai_act_assessment": "Assess: creditworthiness of natural persons (Annex III 5(b)); if classified as AI system → high-risk obligations from 2027-12-02. Document classification explicitly.", "owner_1lod": "Retail Credit Risk Modelling", "validator_2lod": "Model Validation – Credit Risk", "pilot": false, "tags": ["all_models", "credit", "credit_origination", "mortgage", "mortgage_origination", "natural_person_credit", "personal_data", "retail", "statistical"], "evidence_documents": [{"id": "EVD-18-MDD", "title": "Acceptance scorecard development document (draft)", "type": "MDD"}]},
{"id": "MDL-19", "name": "Climate Transition Risk – Mortgages and Corporates", "risk_type": "Climate risk", "portfolio": "Mortgages (energy labels) and corporates (sector emissions)", "purpose": "Climate stress test and ICAAP add-on", "methodology": "Scenario-based PD/LGD shocks via energy label and sector transition pathways", "model_family": "statistical", "regulatory_use": "Stress testing / ICAAP", "tier": 2, "lifecycle_stage": "Development – methodology", "ai_act_assessment": "Assess: statistical model with fixed logic – likely outside AI system definition; document the reasoning.", "owner_1lod": "Sustainability Risk Modelling", "validator_2lod": "Model Validation – Enterprise Risk", "pilot": false, "tags": ["all_models", "climate", "corporate", "credit", "icaap", "mortgage", "risk_reporting", "statistical", "stress_test"], "evidence_documents": [{"id": "EVD-19-MDD", "title": "Climate transition risk methodology (draft)", "type": "MDD"}]},
{"id": "MDL-20", "name": "GenAI Credit Memo Assistant", "risk_type": "Model / AI risk", "portfolio": "Corporate lending", "purpose": "Drafts credit memo sections from client financials for credit analysts", "methodology": "Third-party LLM with retrieval over internal credit files; human review mandatory", "model_family": "genai", "regulatory_use": "None (internal productivity)", "tier": 3, "lifecycle_stage": "Pre-submission – 1LoD self-assessment", "ai_act_assessment": "Assess: AI system (GPAI-based, bank as deployer); supports but does not decide creditworthiness of legal persons – not Annex III; Art. 4 and Art. 50 considerations apply.", "owner_1lod": "Wholesale Credit Analytics", "validator_2lod": "Model Validation – AI", "pilot": false, "tags": ["all_models", "credit", "genai", "third_party_ai"], "evidence_documents": [{"id": "EVD-20-UC", "title": "GenAI use-case approval form", "type": "use-case form"}, {"id": "EVD-20-EVAL", "title": "LLM evaluation and hallucination test report", "type": "test report"}]}
],
"documents": [
{"id": "EXT-CRR-IRB", "category": "external", "type": "eu_regulation", "title": "Capital Requirements Regulation – IRB approach (Part Three, Title II, Chapter 3, Art. 142–191)", "issuer": "EU", "reference": "Regulation (EU) No 575/2013 as amended by Regulation (EU) 2024/1623 (CRR3)", "version_date": "CRR3 applicable from 2025-01-01", "binding_level": "binding_law", "applicability": {"any": ["irb"], "all": []}, "key_topics": ["rating systems", "data requirements (Art. 179–181)", "definition of default (Art. 178)", "use test (Art. 144)", "validation (Art. 185)", "PD/LGD input floors", "roll-out and permanent partial use"], "extraction_priority": "high", "source_url": "https://eur-lex.europa.eu/eli/reg/2013/575/oj", "notes": null},
{"id": "EXT-CRR-MKT", "category": "external", "type": "eu_regulation", "title": "Capital Requirements Regulation – Market risk alternative internal model approach (Part Three, Title IV, Chapter 1b)", "issuer": "EU", "reference": "Regulation (EU) No 575/2013 as amended by Regulation (EU) 2024/1623 (CRR3)", "version_date": "EU application of FRTB own-funds requirements postponed – verify current date", "binding_level": "binding_law", "applicability": {"any": ["market_ima"], "all": []}, "key_topics": ["expected shortfall", "non-modellable risk factors", "backtesting", "P&L attribution", "desk-level approval"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "EXT-CRR-PV", "category": "external", "type": "eu_regulation", "title": "Capital Requirements Regulation – Prudent valuation (Art. 34 and 105)", "issuer": "EU", "reference": "Regulation (EU) No 575/2013", "version_date": "Consolidated", "binding_level": "binding_law", "applicability": {"any": ["valuation"], "all": []}, "key_topics": ["prudent valuation", "valuation adjustments"], "extraction_priority": "medium", "source_url": null, "notes": null},
{"id": "EXT-CRD-101", "category": "external", "type": "eu_directive", "title": "Capital Requirements Directive – ongoing review of internal approaches (Art. 101) and supervisory benchmarking (Art. 78)", "issuer": "EU", "reference": "Directive 2013/36/EU as amended by Directive (EU) 2024/1619 (CRD6)", "version_date": "Consolidated", "binding_level": "binding_law", "applicability": {"any": ["irb", "market_ima"], "all": []}, "key_topics": ["ongoing review of permission", "benchmarking"], "extraction_priority": "low", "source_url": null, "notes": null},
{"id": "EXT-RTS-MAT", "category": "external", "type": "eu_delegated_reg", "title": "RTS on the materiality threshold for credit obligations past due", "issuer": "European Commission", "reference": "Commission Delegated Regulation (EU) 2018/171", "version_date": "2018", "binding_level": "binding_law", "applicability": {"any": ["irb", "ifrs9"], "all": []}, "key_topics": ["absolute and relative materiality threshold", "days past due counting"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "EXT-RTS-ASSESS", "category": "external", "type": "eu_delegated_reg", "title": "RTS on the assessment methodology for compliance with the IRB approach", "issuer": "European Commission", "reference": "Commission Delegated Regulation (EU) 2022/439", "version_date": "2022", "binding_level": "binding_law", "applicability": {"any": ["irb"], "all": []}, "key_topics": ["assessment of rating systems", "data quality", "validation function", "use test"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "EXT-RTS-DLGD", "category": "external", "type": "eu_delegated_reg", "title": "RTS specifying the nature, severity and duration of an economic downturn", "issuer": "European Commission", "reference": "Commission Delegated Regulation (EU) 2021/930", "version_date": "2021", "binding_level": "binding_law", "applicability": {"any": ["irb_lgd", "irb_ead"], "all": []}, "key_topics": ["downturn identification", "macroeconomic indicators"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "EXT-RTS-MMC", "category": "external", "type": "eu_delegated_reg", "title": "RTS on assessing the materiality of extensions and changes of the IRB and AMA", "issuer": "European Commission", "reference": "Commission Delegated Regulation (EU) No 529/2014", "version_date": "2014 (check for CRR3 successor RTS)", "binding_level": "binding_law", "applicability": {"any": ["irb"], "all": []}, "key_topics": ["material vs non-material change", "ex-ante / ex-post notification"], "extraction_priority": "high", "source_url": null, "notes": "CRR3 mandates updated RTS on model changes; verify whether a successor has been adopted."},
{"id": "EXT-RTS-IRRBB-SOT", "category": "external", "type": "eu_delegated_reg", "title": "RTS on supervisory outlier tests for IRRBB", "issuer": "European Commission", "reference": "Commission Delegated Regulation (EU) 2024/856", "version_date": "2024", "binding_level": "binding_law", "applicability": {"any": ["irrbb"], "all": []}, "key_topics": ["EVE and NII outlier tests", "behavioural assumptions"], "extraction_priority": "medium", "source_url": null, "notes": null},
{"id": "EXT-AIACT", "category": "external", "type": "eu_regulation", "title": "Artificial Intelligence Act", "issuer": "EU", "reference": "Regulation (EU) 2024/1689 as amended by Regulation (EU) 2026/1744 (Digital Omnibus on AI)", "version_date": "Annex III high-risk obligations apply from 2027-12-02; Art. 50 transparency from 2026-08-02", "binding_level": "binding_law", "applicability": {"any": ["ml", "genai", "natural_person_credit"], "all": []}, "key_topics": ["AI system definition", "Annex III 5(b) creditworthiness of natural persons", "risk management", "data governance (Art. 10)", "human oversight", "transparency (Art. 50)", "AI literacy (Art. 4)"], "extraction_priority": "high", "source_url": "https://eur-lex.europa.eu/eli/reg/2024/1689/oj", "notes": null},
{"id": "EXT-GDPR", "category": "external", "type": "eu_regulation", "title": "General Data Protection Regulation", "issuer": "EU", "reference": "Regulation (EU) 2016/679", "version_date": "2016", "binding_level": "binding_law", "applicability": {"any": ["personal_data"], "all": []}, "key_topics": ["lawful basis", "data minimisation", "DPIA (Art. 35)", "automated decision-making (Art. 22)"], "extraction_priority": "medium", "source_url": "https://eur-lex.europa.eu/eli/reg/2016/679/oj", "notes": null},
{"id": "EXT-AMLR", "category": "external", "type": "eu_regulation", "title": "Anti-Money Laundering Regulation (single rulebook)", "issuer": "EU", "reference": "Regulation (EU) 2024/1624", "version_date": "Applies from 2027-07-10", "binding_level": "binding_law", "applicability": {"any": ["aml"], "all": []}, "key_topics": ["customer due diligence", "risk-based approach", "transaction monitoring", "customer risk assessment"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "EXT-PSD2-RTS", "category": "external", "type": "eu_delegated_reg", "title": "RTS on strong customer authentication – transaction monitoring mechanisms", "issuer": "European Commission", "reference": "Commission Delegated Regulation (EU) 2018/389 (under PSD2, Directive (EU) 2015/2366)", "version_date": "2018", "binding_level": "binding_law", "applicability": {"any": ["fraud"], "all": []}, "key_topics": ["transaction monitoring (Art. 2)", "risk-based exemptions (TRA)", "fraud rate calculation"], "extraction_priority": "medium", "source_url": null, "notes": null},
{"id": "EXT-MCD", "category": "external", "type": "eu_directive", "title": "Mortgage Credit Directive – creditworthiness assessment", "issuer": "EU", "reference": "Directive 2014/17/EU (Art. 18–20)", "version_date": "2014", "binding_level": "binding_law", "applicability": {"any": ["mortgage_origination"], "all": []}, "key_topics": ["creditworthiness assessment", "verification of information", "non-discrimination"], "extraction_priority": "medium", "source_url": null, "notes": null},
{"id": "EXT-DORA", "category": "external", "type": "eu_regulation", "title": "Digital Operational Resilience Act", "issuer": "EU", "reference": "Regulation (EU) 2022/2554", "version_date": "Applies from 2025-01-17", "binding_level": "binding_law", "applicability": {"any": ["third_party_ai"], "all": []}, "key_topics": ["ICT third-party risk", "register of information", "ICT risk management"], "extraction_priority": "low", "source_url": null, "notes": null},
{"id": "EXT-WWFT", "category": "external", "type": "national_law", "title": "Wet ter voorkoming van witwassen en financieren van terrorisme (Wwft)", "issuer": "NL", "reference": "Wwft", "version_date": "Consolidated", "binding_level": "binding_law", "applicability": {"any": ["aml"], "all": []}, "key_topics": ["customer due diligence", "unusual transaction reporting"], "extraction_priority": "medium", "source_url": null, "notes": null},
{"id": "EXT-DNB-WWFT", "category": "external", "type": "supervisory_guidance", "title": "DNB Guidance on the Wwft and the Sanctions Act", "issuer": "De Nederlandsche Bank", "reference": "DNB Leidraad Wwft en Sw", "version_date": "Latest DNB version", "binding_level": "supervisory_expectation", "applicability": {"any": ["aml"], "all": []}, "key_topics": ["transaction monitoring expectations", "risk-based customer assessment"], "extraction_priority": "medium", "source_url": null, "notes": null},
{"id": "EXT-EBA-DOD", "category": "external", "type": "eba_guideline", "title": "Guidelines on the application of the definition of default", "issuer": "EBA", "reference": "EBA/GL/2016/07", "version_date": "2016 (applies from 2021-01-01)", "binding_level": "comply_or_explain", "applicability": {"any": ["irb", "ifrs9"], "all": []}, "key_topics": ["days past due", "unlikeliness to pay", "probation periods", "consistency across entities"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "EXT-EBA-PDLGD", "category": "external", "type": "eba_guideline", "title": "Guidelines on PD estimation, LGD estimation and the treatment of defaulted exposures", "issuer": "EBA", "reference": "EBA/GL/2017/16", "version_date": "2017 (applies from 2021-01-01)", "binding_level": "comply_or_explain", "applicability": {"any": ["irb_pd", "irb_lgd"], "all": []}, "key_topics": ["RDS and data requirements", "representativeness", "risk differentiation", "calibration to long-run average", "margin of conservatism", "ELBE and LGD in-default"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "EXT-EBA-DLGD", "category": "external", "type": "eba_guideline", "title": "Guidelines for the estimation of LGD appropriate for an economic downturn", "issuer": "EBA", "reference": "EBA/GL/2019/03", "version_date": "2019", "binding_level": "comply_or_explain", "applicability": {"any": ["irb_lgd"], "all": []}, "key_topics": ["downturn LGD approaches", "reference value"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "EXT-EBA-CRM", "category": "external", "type": "eba_guideline", "title": "Guidelines on credit risk mitigation for institutions applying the IRB approach with own LGD estimates", "issuer": "EBA", "reference": "EBA/GL/2020/05", "version_date": "2020", "binding_level": "comply_or_explain", "applicability": {"any": ["irb_lgd"], "all": []}, "key_topics": ["recognition of collateral", "guarantees in LGD"], "extraction_priority": "medium", "source_url": null, "notes": null},
{"id": "EXT-EBA-ECL", "category": "external", "type": "eba_guideline", "title": "Guidelines on credit institutions' credit risk management practices and accounting for expected credit losses", "issuer": "EBA", "reference": "EBA/GL/2017/06", "version_date": "2017", "binding_level": "comply_or_explain", "applicability": {"any": ["ifrs9"], "all": []}, "key_topics": ["ECL methodology governance", "forward-looking information", "SICR"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "EXT-EBA-LOM", "category": "external", "type": "eba_guideline", "title": "Guidelines on loan origination and monitoring", "issuer": "EBA", "reference": "EBA/GL/2020/06", "version_date": "2020", "binding_level": "comply_or_explain", "applicability": {"any": ["credit_origination", "mortgage_origination"], "all": []}, "key_topics": ["creditworthiness assessment", "automated models in credit decisioning", "model explainability"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "EXT-EBA-ST", "category": "external", "type": "eba_guideline", "title": "Guidelines on institutions' stress testing", "issuer": "EBA", "reference": "EBA/GL/2018/04", "version_date": "2018", "binding_level": "comply_or_explain", "applicability": {"any": ["stress_test", "icaap"], "all": []}, "key_topics": ["scenario design", "methodologies", "governance"], "extraction_priority": "medium", "source_url": null, "notes": null},
{"id": "EXT-EBA-IRRBB", "category": "external", "type": "eba_guideline", "title": "Guidelines on IRRBB and CSRBB", "issuer": "EBA", "reference": "EBA/GL/2022/14", "version_date": "2022", "binding_level": "comply_or_explain", "applicability": {"any": ["irrbb"], "all": []}, "key_topics": ["behavioural assumptions", "prepayment", "non-maturity deposits", "model validation"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "EXT-EBA-ESG", "category": "external", "type": "eba_guideline", "title": "Guidelines on the management of ESG risks", "issuer": "EBA", "reference": "EBA/GL/2025/01", "version_date": "Applies from 2026-01-11 (non-SNCI)", "binding_level": "comply_or_explain", "applicability": {"any": ["climate"], "all": []}, "key_topics": ["materiality assessment", "measurement methodologies", "transition planning"], "extraction_priority": "medium", "source_url": "https://www.eba.europa.eu/activities/single-rulebook/regulatory-activities/sustainable-finance/guidelines-management-esg-risks", "notes": null},
{"id": "EXT-EBA-ESGSA", "category": "external", "type": "eba_guideline", "title": "Guidelines on environmental scenario analysis", "issuer": "EBA", "reference": "EBA/GL/2025/04", "version_date": "2025", "binding_level": "comply_or_explain", "applicability": {"any": ["climate"], "all": []}, "key_topics": ["scenario analysis", "climate stress testing methodology"], "extraction_priority": "medium", "source_url": null, "notes": null},
{"id": "EXT-EBA-OUTS", "category": "external", "type": "eba_guideline", "title": "Guidelines on outsourcing arrangements", "issuer": "EBA", "reference": "EBA/GL/2019/02", "version_date": "2019", "binding_level": "comply_or_explain", "applicability": {"any": ["third_party_ai"], "all": []}, "key_topics": ["critical outsourcing", "due diligence", "exit strategies"], "extraction_priority": "low", "source_url": null, "notes": null},
{"id": "EXT-EBA-VALHB", "category": "external", "type": "eba_report", "title": "Supervisory handbook on the validation of IRB rating systems", "issuer": "EBA", "reference": "EBA supervisory handbook (2023)", "version_date": "2023", "binding_level": "supervisory_expectation", "applicability": {"any": ["irb"], "all": []}, "key_topics": ["validation scope", "independence", "validation tests"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "EXT-EBA-MLIRB", "category": "external", "type": "eba_report", "title": "Follow-up report on machine learning for IRB models", "issuer": "EBA", "reference": "EBA report (2023)", "version_date": "2023", "binding_level": "reference", "applicability": {"any": [], "all": ["irb", "ml"]}, "key_topics": ["explainability", "overfitting", "use of ML in IRB"], "extraction_priority": "medium", "source_url": null, "notes": null},
{"id": "EXT-ECB-GIM", "category": "external", "type": "ecb_guide", "title": "ECB guide to internal models", "issuer": "ECB Banking Supervision", "reference": "Version 4.0", "version_date": "2025-07-28", "binding_level": "supervisory_expectation", "applicability": {"any": ["irb", "market_ima"], "all": []}, "key_topics": ["overarching principles", "data governance", "MRM framework", "credit risk: DoD and parameter estimation", "machine learning expectations", "market risk under CRR3", "implementation of material changes within three months"], "extraction_priority": "high", "source_url": "https://www.bankingsupervision.europa.eu/ecb/pub/pdf/ssm.supervisory_guide202507.en.pdf", "notes": null},
{"id": "EXT-ECB-VALREP", "category": "external", "type": "ecb_instruction", "title": "Instructions for reporting the validation results of internal models (credit risk)", "issuer": "ECB Banking Supervision", "reference": "Validation reporting instructions and templates", "version_date": "2019 (templates updated periodically)", "binding_level": "supervisory_expectation", "applicability": {"any": ["irb"], "all": []}, "key_topics": ["standard validation tests", "reporting templates", "test thresholds"], "extraction_priority": "high", "source_url": "https://www.bankingsupervision.europa.eu/activities/internal_models/omm/html/index.en.html", "notes": null},
{"id": "EXT-ECB-ICAAP", "category": "external", "type": "ecb_guide", "title": "ECB Guide to the internal capital adequacy assessment process (ICAAP)", "issuer": "ECB Banking Supervision", "reference": "ECB ICAAP Guide", "version_date": "2018", "binding_level": "supervisory_expectation", "applicability": {"any": ["icaap", "stress_test"], "all": []}, "key_topics": ["capital adequacy perspectives", "stress testing", "risk quantification"], "extraction_priority": "medium", "source_url": null, "notes": null},
{"id": "EXT-ECB-CE", "category": "external", "type": "ecb_guide", "title": "ECB Guide on climate-related and environmental risks", "issuer": "ECB Banking Supervision", "reference": "ECB C&E Guide", "version_date": "2020", "binding_level": "supervisory_expectation", "applicability": {"any": ["climate"], "all": []}, "key_topics": ["risk management", "stress testing", "disclosure"], "extraction_priority": "medium", "source_url": null, "notes": null},
{"id": "EXT-IFRS9", "category": "external", "type": "accounting_standard", "title": "IFRS 9 Financial Instruments – impairment (Section 5.5)", "issuer": "IASB", "reference": "IFRS 9 as endorsed in the EU", "version_date": "Consolidated", "binding_level": "binding_law", "applicability": {"any": ["ifrs9"], "all": []}, "key_topics": ["12-month vs lifetime ECL", "SICR", "forward-looking information", "staging"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "EXT-IFRS13", "category": "external", "type": "accounting_standard", "title": "IFRS 13 Fair Value Measurement", "issuer": "IASB", "reference": "IFRS 13 as endorsed in the EU", "version_date": "Consolidated", "binding_level": "binding_law", "applicability": {"any": ["valuation"], "all": []}, "key_topics": ["fair value hierarchy", "valuation techniques"], "extraction_priority": "medium", "source_url": null, "notes": null},
{"id": "EXT-BCBS239", "category": "external", "type": "international_standard", "title": "Principles for effective risk data aggregation and risk reporting", "issuer": "Basel Committee", "reference": "BCBS 239", "version_date": "2013", "binding_level": "supervisory_expectation", "applicability": {"any": ["risk_reporting"], "all": []}, "key_topics": ["data accuracy and integrity", "completeness", "lineage"], "extraction_priority": "medium", "source_url": null, "notes": null},
{"id": "EXT-SR117", "category": "external", "type": "international_reference", "title": "Supervisory Guidance on Model Risk Management", "issuer": "Federal Reserve / OCC", "reference": "SR 11-7", "version_date": "2011", "binding_level": "reference", "applicability": {"any": ["all_models"], "all": []}, "key_topics": ["model definition", "development, implementation and use", "validation", "governance"], "extraction_priority": "low", "source_url": null, "notes": "US guidance; used as industry reference for MRM good practice."},
{"id": "EXT-PRA-SS123", "category": "external", "type": "international_reference", "title": "Model risk management principles for banks", "issuer": "PRA (UK)", "reference": "SS1/23", "version_date": "2023", "binding_level": "reference", "applicability": {"any": ["all_models"], "all": []}, "key_topics": ["model identification and tiering", "governance", "model development", "independent validation", "risk mitigants"], "extraction_priority": "low", "source_url": null, "notes": "UK guidance; used as industry reference for MRM good practice."},
{"id": "INT-POL-MRM", "category": "internal", "type": "policy", "title": "Model Risk Management Policy", "issuer": "Model Risk Management (2LoD)", "reference": "MRM-POL-001", "version_date": "v5.0 (2026-03)", "binding_level": "internal_mandatory", "applicability": {"any": ["all_models"], "all": []}, "key_topics": ["model definition", "roles 1LoD/2LoD/3LoD", "tiering", "lifecycle gates", "approval authorities"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "INT-POL-DATA", "category": "internal", "type": "policy", "title": "Data Management and Governance Policy", "issuer": "Chief Data Office", "reference": "DATA-POL-001", "version_date": "v3.2 (2025-11)", "binding_level": "internal_mandatory", "applicability": {"any": ["all_models"], "all": []}, "key_topics": ["data ownership", "critical data elements", "lineage"], "extraction_priority": "medium", "source_url": null, "notes": null},
{"id": "INT-POL-CREDIT", "category": "internal", "type": "policy", "title": "Credit Risk Policy", "issuer": "Credit Risk Management", "reference": "CR-POL-001", "version_date": "v8.1 (2026-01)", "binding_level": "internal_mandatory", "applicability": {"any": ["credit"], "all": []}, "key_topics": ["credit risk appetite", "rating assignment", "overrides"], "extraction_priority": "medium", "source_url": null, "notes": null},
{"id": "INT-POL-AI", "category": "internal", "type": "policy", "title": "Responsible AI Policy", "issuer": "AI Governance Office", "reference": "AI-POL-001", "version_date": "v2.0 (2026-05)", "binding_level": "internal_mandatory", "applicability": {"any": ["ml", "genai"], "all": []}, "key_topics": ["AI inventory", "AI Act classification", "human oversight", "fairness", "transparency"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "INT-POL-PRIV", "category": "internal", "type": "policy", "title": "Privacy and Data Protection Policy", "issuer": "Privacy Office", "reference": "PRIV-POL-001", "version_date": "v4.0 (2025-09)", "binding_level": "internal_mandatory", "applicability": {"any": ["personal_data"], "all": []}, "key_topics": ["DPIA", "purpose limitation", "retention"], "extraction_priority": "medium", "source_url": null, "notes": null},
{"id": "INT-POL-FEC", "category": "internal", "type": "policy", "title": "Financial Economic Crime Policy", "issuer": "Financial Crime Compliance", "reference": "FEC-POL-001", "version_date": "v6.0 (2026-02)", "binding_level": "internal_mandatory", "applicability": {"any": ["aml", "fraud"], "all": []}, "key_topics": ["CDD", "transaction monitoring", "risk-based approach"], "extraction_priority": "medium", "source_url": null, "notes": null},
{"id": "INT-POL-CLIM", "category": "internal", "type": "policy", "title": "Climate and Environmental Risk Policy", "issuer": "Sustainability Risk", "reference": "CER-POL-001", "version_date": "v2.1 (2026-01)", "binding_level": "internal_mandatory", "applicability": {"any": ["climate"], "all": []}, "key_topics": ["materiality assessment", "risk integration"], "extraction_priority": "low", "source_url": null, "notes": null},
{"id": "INT-POL-TPR", "category": "internal", "type": "policy", "title": "Third-Party and Outsourcing Risk Policy", "issuer": "Operational Risk", "reference": "TPR-POL-001", "version_date": "v3.0 (2025-06)", "binding_level": "internal_mandatory", "applicability": {"any": ["third_party_ai"], "all": []}, "key_topics": ["vendor due diligence", "exit plans", "DORA register"], "extraction_priority": "low", "source_url": null, "notes": null},
{"id": "INT-STD-INV", "category": "internal", "type": "standard", "title": "Model Inventory and Tiering Standard", "issuer": "Model Risk Management (2LoD)", "reference": "MRM-STD-010", "version_date": "v2.3", "binding_level": "internal_mandatory", "applicability": {"any": ["all_models"], "all": []}, "key_topics": ["model identification", "materiality x complexity tiering", "inventory fields"], "extraction_priority": "medium", "source_url": null, "notes": null},
{"id": "INT-STD-DEV", "category": "internal", "type": "standard", "title": "Model Development Standard", "issuer": "Model Risk Management (2LoD)", "reference": "MRM-STD-020", "version_date": "v4.1", "binding_level": "internal_mandatory", "applicability": {"any": ["all_models"], "all": []}, "key_topics": ["methodology selection", "benchmarking", "sensitivity analysis", "limitations log"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "INT-STD-DOC", "category": "internal", "type": "standard", "title": "Model Documentation Standard (incl. MDD and RDS templates)", "issuer": "Model Risk Management (2LoD)", "reference": "MRM-STD-021", "version_date": "v3.0", "binding_level": "internal_mandatory", "applicability": {"any": ["all_models"], "all": []}, "key_topics": ["mandatory sections", "RDS documentation template", "reproducibility"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "INT-STD-DQ", "category": "internal", "type": "standard", "title": "Data Quality Standard for Models", "issuer": "Chief Data Office / MRM", "reference": "MRM-STD-022", "version_date": "v2.2", "binding_level": "internal_mandatory", "applicability": {"any": ["all_models"], "all": []}, "key_topics": ["DQ dimensions", "DQ assessment", "deficiency log"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "INT-STD-EJ", "category": "internal", "type": "standard", "title": "Expert Judgement Standard", "issuer": "Model Risk Management (2LoD)", "reference": "MRM-STD-023", "version_date": "v1.4", "binding_level": "internal_mandatory", "applicability": {"any": ["all_models"], "all": []}, "key_topics": ["documentation of judgement", "challenge", "approval"], "extraction_priority": "medium", "source_url": null, "notes": null},
{"id": "INT-STD-IMPL", "category": "internal", "type": "standard", "title": "Model Implementation and Testing Standard", "issuer": "Model Risk Management (2LoD)", "reference": "MRM-STD-030", "version_date": "v2.0", "binding_level": "internal_mandatory", "applicability": {"any": ["all_models"], "all": []}, "key_topics": ["implementation testing", "UAT", "parallel run", "production reconciliation"], "extraction_priority": "medium", "source_url": null, "notes": null},
{"id": "INT-STD-MON", "category": "internal", "type": "standard", "title": "Model Monitoring Standard", "issuer": "Model Risk Management (2LoD)", "reference": "MRM-STD-040", "version_date": "v3.1", "binding_level": "internal_mandatory", "applicability": {"any": ["all_models"], "all": []}, "key_topics": ["KPIs and thresholds", "annual review", "triggers"], "extraction_priority": "medium", "source_url": null, "notes": null},
{"id": "INT-STD-CHG", "category": "internal", "type": "standard", "title": "Model Change and Regulatory Notification Standard", "issuer": "Model Risk Management (2LoD)", "reference": "MRM-STD-050", "version_date": "v2.4", "binding_level": "internal_mandatory", "applicability": {"any": ["all_models"], "all": []}, "key_topics": ["change classification", "regulatory notification", "ECB application readiness"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "INT-STD-IRB", "category": "internal", "type": "standard", "title": "IRB Rating System Standard (PD, LGD, EAD/CCF estimation)", "issuer": "Credit Risk Modelling (1LoD) / MRM", "reference": "CRM-STD-100", "version_date": "v5.2", "binding_level": "internal_mandatory", "applicability": {"any": ["irb"], "all": []}, "key_topics": ["RDS construction", "risk differentiation", "calibration", "master scale", "floors"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "INT-STD-MOC", "category": "internal", "type": "standard", "title": "Margin of Conservatism Standard", "issuer": "Model Risk Management (2LoD)", "reference": "CRM-STD-101", "version_date": "v2.0", "binding_level": "internal_mandatory", "applicability": {"any": ["irb"], "all": []}, "key_topics": ["MoC categories A/B/C", "quantification", "MoC monitoring"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "INT-STD-DOD", "category": "internal", "type": "standard", "title": "Definition of Default Standard", "issuer": "Credit Risk Management", "reference": "CR-STD-110", "version_date": "v3.0", "binding_level": "internal_mandatory", "applicability": {"any": ["irb", "ifrs9"], "all": []}, "key_topics": ["dpd counting", "materiality thresholds", "UTP triggers", "probation"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "INT-STD-IFRS9", "category": "internal", "type": "standard", "title": "IFRS 9 ECL Methodology Standard", "issuer": "Finance / Credit Risk Modelling", "reference": "FIN-STD-200", "version_date": "v4.0", "binding_level": "internal_mandatory", "applicability": {"any": ["ifrs9"], "all": []}, "key_topics": ["PD/LGD/EAD term structures", "SICR criteria", "forward-looking scenarios", "overlays"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "INT-STD-ST", "category": "internal", "type": "standard", "title": "Stress Testing and Scenario Modelling Standard", "issuer": "Enterprise Risk Management", "reference": "ERM-STD-300", "version_date": "v2.2", "binding_level": "internal_mandatory", "applicability": {"any": ["stress_test", "icaap", "climate"], "all": []}, "key_topics": ["scenario design", "satellite models", "governance"], "extraction_priority": "medium", "source_url": null, "notes": null},
{"id": "INT-STD-IRRBB", "category": "internal", "type": "standard", "title": "IRRBB Behavioural Modelling Standard", "issuer": "ALM / Treasury Risk", "reference": "ALM-STD-400", "version_date": "v2.1", "binding_level": "internal_mandatory", "applicability": {"any": ["irrbb"], "all": []}, "key_topics": ["prepayment", "NMD replicating portfolio", "behavioural assumptions"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "INT-STD-MKT", "category": "internal", "type": "standard", "title": "Market Risk and Valuation Model Standard", "issuer": "Market Risk Management", "reference": "MR-STD-500", "version_date": "v3.0", "binding_level": "internal_mandatory", "applicability": {"any": ["market_ima", "valuation"], "all": []}, "key_topics": ["ES methodology", "risk factor modellability", "valuation adjustments", "XVA"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "INT-STD-FEC", "category": "internal", "type": "standard", "title": "Financial Crime Model Standard", "issuer": "Financial Crime Compliance / MRM", "reference": "FEC-STD-600", "version_date": "v1.8", "binding_level": "internal_mandatory", "applicability": {"any": ["aml", "fraud"], "all": []}, "key_topics": ["scenario tuning", "above/below-the-line testing", "alert quality", "model coverage"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "INT-STD-ML", "category": "internal", "type": "standard", "title": "Machine Learning Model Standard", "issuer": "AI Governance Office / MRM", "reference": "AI-STD-700", "version_date": "v1.3", "binding_level": "internal_mandatory", "applicability": {"any": ["ml"], "all": []}, "key_topics": ["explainability", "fairness and bias testing", "feature governance", "drift monitoring"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "INT-STD-GENAI", "category": "internal", "type": "standard", "title": "Generative AI Use Standard", "issuer": "AI Governance Office", "reference": "AI-STD-710", "version_date": "v1.0", "binding_level": "internal_mandatory", "applicability": {"any": ["genai"], "all": []}, "key_topics": ["use-case approval", "prompt and model versioning", "hallucination testing", "human-in-the-loop", "output labelling"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "INT-STD-ACC", "category": "internal", "type": "standard", "title": "Credit Acceptance and Scorecard Standard", "issuer": "Retail Credit Risk", "reference": "CR-STD-120", "version_date": "v2.5", "binding_level": "internal_mandatory", "applicability": {"any": ["credit_origination", "mortgage_origination"], "all": []}, "key_topics": ["cut-offs", "reject inference", "overrides", "non-discrimination"], "extraction_priority": "medium", "source_url": null, "notes": null},
{"id": "INT-VAL-GEN", "category": "internal", "type": "validation_standard", "title": "Model Validation Standard", "issuer": "Model Validation (2LoD)", "reference": "MV-STD-001", "version_date": "v4.0", "binding_level": "internal_mandatory", "applicability": {"any": ["all_models"], "all": []}, "key_topics": ["validation scope by tier", "independence", "conceptual soundness", "replication", "validation opinion"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "INT-VAL-FIND", "category": "internal", "type": "validation_standard", "title": "Validation Findings and Rating Standard", "issuer": "Model Validation (2LoD)", "reference": "MV-STD-002", "version_date": "v2.1", "binding_level": "internal_mandatory", "applicability": {"any": ["all_models"], "all": []}, "key_topics": ["finding severity", "remediation deadlines", "closure evidence"], "extraction_priority": "medium", "source_url": null, "notes": null},
{"id": "INT-VAL-TEST", "category": "internal", "type": "validation_standard", "title": "Validation Testing Handbook (statistical tests and thresholds)", "issuer": "Model Validation (2LoD)", "reference": "MV-HB-003", "version_date": "v3.2", "binding_level": "internal_mandatory", "applicability": {"any": ["statistical", "ml"], "all": []}, "key_topics": ["discrimination (AUC/Gini)", "calibration (binomial, Jeffreys)", "stability (PSI)", "backtesting"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "INT-VAL-IRB", "category": "internal", "type": "validation_standard", "title": "IRB Validation Standard (incl. ECB validation reporting)", "issuer": "Model Validation (2LoD)", "reference": "MV-STD-010", "version_date": "v3.0", "binding_level": "internal_mandatory", "applicability": {"any": ["irb"], "all": []}, "key_topics": ["initial and annual validation", "ECB templates", "MoC review"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "INT-VAL-AI", "category": "internal", "type": "validation_standard", "title": "AI and ML Validation Standard", "issuer": "Model Validation (2LoD)", "reference": "MV-STD-020", "version_date": "v1.2", "binding_level": "internal_mandatory", "applicability": {"any": ["ml", "genai"], "all": []}, "key_topics": ["explainability testing", "bias testing", "LLM evaluation and hallucination testing", "robustness"], "extraction_priority": "high", "source_url": null, "notes": null},
{"id": "INT-GOV-MRC", "category": "internal", "type": "governance", "title": "Model Risk Committee – Terms of Reference", "issuer": "Model Risk Management (2LoD)", "reference": "MRM-GOV-001", "version_date": "v2.0", "binding_level": "internal_mandatory", "applicability": {"any": ["all_models"], "all": []}, "key_topics": ["approval authorities", "escalation", "conditions tracking"], "extraction_priority": "low", "source_url": null, "notes": null}
]
}
```

### 13.2 `/data/pilot_seed.json`
Pilot requirements (18 shared + 4 validation-layer), the RDS evidence document (v1.0 and draft v0.7 sections), the 1LoD AI assessment with confidence factors and mitigations, initial and scripted 1LoD decisions, the 2LoD blind assessment, draft findings, the library change v3.2 → v3.3, and upload examples.

```json
{
 "requirements": [
  {
   "id": "REQ-D01",
   "text": "The RDS covers at least 5 years of historical data for retail PD estimation.",
   "source_doc": "EXT-CRR-IRB",
   "article": "CRR Art. 180(2)(e)",
   "category": "data",
   "check_type": "ai+script",
   "applicability_rationale": "Retail PD model; observation period set in RDS.",
   "layer": "shared"
  },
  {
   "id": "REQ-D02",
   "text": "The observation period covers a representative mix of good and bad years, including a downturn.",
   "source_doc": "EXT-ECB-GIM",
   "article": "ECB guide to internal models – credit risk, LRA calibration",
   "category": "data",
   "check_type": "ai",
   "applicability_rationale": "PD calibrated to long-run average; window choice documented in RDS.",
   "layer": "shared"
  },
  {
   "id": "REQ-D07",
   "text": "Default is defined as > 90 dpd above the materiality threshold (EUR 100 absolute and 1% relative) or unlikeliness to pay.",
   "source_doc": "EXT-RTS-MAT",
   "article": "CRR Art. 178; RTS 2018/171; EBA/GL/2016/07",
   "category": "data",
   "check_type": "ai+script",
   "applicability_rationale": "IRB model; default flag constructed in RDS.",
   "layer": "shared"
  },
  {
   "id": "REQ-D08",
   "text": "Unlikeliness-to-pay triggers are documented and applied consistently.",
   "source_doc": "EXT-EBA-DOD",
   "article": "EBA/GL/2016/07 section 5",
   "category": "data",
   "check_type": "ai",
   "applicability_rationale": "Default flag construction.",
   "layer": "shared"
  },
  {
   "id": "REQ-D09",
   "text": "Probation (cure) periods are applied before a facility returns to non-default status.",
   "source_doc": "EXT-EBA-DOD",
   "article": "EBA/GL/2016/07 section 7",
   "category": "data",
   "check_type": "ai",
   "applicability_rationale": "Default flag construction, multiple defaults.",
   "layer": "shared"
  },
  {
   "id": "REQ-D12a",
   "text": "Every exclusion from the RDS has a documented reason.",
   "source_doc": "EXT-EBA-PDLGD",
   "article": "EBA/GL/2017/16 – data requirements",
   "category": "data",
   "check_type": "ai",
   "applicability_rationale": "Exclusions applied in RDS.",
   "layer": "shared"
  },
  {
   "id": "REQ-D12b",
   "text": "Every exclusion is quantified (facilities, share of population, defaults).",
   "source_doc": "EXT-EBA-PDLGD",
   "article": "EBA/GL/2017/16 – data requirements",
   "category": "data",
   "check_type": "ai",
   "applicability_rationale": "Exclusions applied in RDS.",
   "layer": "shared"
  },
  {
   "id": "REQ-D12c",
   "text": "The impact of exclusions on representativeness is analysed.",
   "source_doc": "EXT-EBA-PDLGD",
   "article": "EBA/GL/2017/16 – representativeness",
   "category": "data",
   "check_type": "ai",
   "applicability_rationale": "Exclusions applied in RDS.",
   "layer": "shared"
  },
  {
   "id": "REQ-D15",
   "text": "The RDS is representative of the current portfolio (risk drivers and default-rate levels).",
   "source_doc": "EXT-CRR-IRB",
   "article": "CRR Art. 179(1)(d); EBA/GL/2017/16",
   "category": "data",
   "check_type": "ai",
   "applicability_rationale": "Material change; portfolio composition shifted since v3.",
   "layer": "shared"
  },
  {
   "id": "REQ-D18",
   "text": "Data quality is assessed on completeness, accuracy, consistency and timeliness.",
   "source_doc": "INT-STD-DQ",
   "article": "MRM-STD-022 §3; BCBS 239 principles 3–5",
   "category": "data",
   "check_type": "ai",
   "applicability_rationale": "All model RDS components.",
   "layer": "shared"
  },
  {
   "id": "REQ-D19",
   "text": "Lineage from source systems to the RDS is documented for every variable.",
   "source_doc": "INT-POL-DATA",
   "article": "DATA-POL-001 §5",
   "category": "data",
   "check_type": "ai",
   "applicability_rationale": "All model RDS components.",
   "layer": "shared"
  },
  {
   "id": "REQ-D21",
   "text": "Data deficiencies are identified and linked to a Margin of Conservatism category.",
   "source_doc": "EXT-CRR-IRB",
   "article": "CRR Art. 179(1)(f); EBA/GL/2017/16 section 4.4; CRM-STD-101",
   "category": "data",
   "check_type": "ai",
   "applicability_rationale": "IRB model with known data deficiencies.",
   "layer": "shared"
  },
  {
   "id": "REQ-D22",
   "text": "Treatment of missing values and outliers is documented and justified.",
   "source_doc": "EXT-EBA-PDLGD",
   "article": "EBA/GL/2017/16 – data requirements",
   "category": "data",
   "check_type": "ai",
   "applicability_rationale": "RDS variables with missing values.",
   "layer": "shared"
  },
  {
   "id": "REQ-D25",
   "text": "Personal data use is minimised and covered by a DPIA.",
   "source_doc": "EXT-GDPR",
   "article": "GDPR Art. 5(1)(c) and 35; PRIV-POL-001",
   "category": "governance",
   "check_type": "ai",
   "applicability_rationale": "RDS contains personal data.",
   "layer": "shared"
  },
  {
   "id": "REQ-D26",
   "text": "Protected attributes are excluded and proxy variables are screened.",
   "source_doc": "INT-POL-CREDIT",
   "article": "CR-POL-001 §9 (fair treatment)",
   "category": "data",
   "check_type": "ai",
   "applicability_rationale": "Retail customers; candidate variables include postcode.",
   "layer": "shared"
  },
  {
   "id": "REQ-D30",
   "text": "The RDS build is reproducible from versioned code.",
   "source_doc": "INT-STD-DOC",
   "article": "MRM-STD-021 §4.2",
   "category": "documentation",
   "check_type": "ai+script",
   "applicability_rationale": "All models.",
   "layer": "shared"
  },
  {
   "id": "REQ-D31",
   "text": "Expert judgement applied in data treatment is documented and approved.",
   "source_doc": "INT-STD-EJ",
   "article": "MRM-STD-023 §2",
   "category": "governance",
   "check_type": "ai",
   "applicability_rationale": "Expert adjustments in default-flag approximation.",
   "layer": "shared"
  },
  {
   "id": "REQ-G01",
   "text": "The document follows the RDS template and is version-controlled with approvals.",
   "source_doc": "INT-STD-DOC",
   "article": "MRM-STD-021 §2",
   "category": "documentation",
   "check_type": "ai",
   "applicability_rationale": "All model documentation.",
   "layer": "shared"
  },
  {
   "id": "VAL-01",
   "text": "Validation independently replicates the RDS from source data.",
   "source_doc": "INT-VAL-GEN",
   "article": "MV-STD-001 §5.1",
   "category": "validation",
   "check_type": "script",
   "applicability_rationale": "Tier 1 model – full replication required.",
   "layer": "2lod"
  },
  {
   "id": "VAL-02",
   "text": "The implemented default flag (code) matches the documented definition.",
   "source_doc": "INT-VAL-IRB",
   "article": "MV-STD-010 §3.4",
   "category": "validation",
   "check_type": "script",
   "applicability_rationale": "IRB model – code-vs-documentation check mandatory.",
   "layer": "2lod"
  },
  {
   "id": "VAL-03",
   "text": "MoC for data deficiencies is supported by a sensitivity analysis.",
   "source_doc": "INT-VAL-IRB",
   "article": "MV-STD-010 §4.2; CRM-STD-101 §3",
   "category": "validation",
   "check_type": "ai+script",
   "applicability_rationale": "Known deficiencies (approximated default flag 2012–2015).",
   "layer": "2lod"
  },
  {
   "id": "VAL-04",
   "text": "Representativeness is tested on default-rate levels, not only on risk-driver distributions.",
   "source_doc": "INT-VAL-TEST",
   "article": "MV-HB-003 §6",
   "category": "validation",
   "check_type": "ai+script",
   "applicability_rationale": "Retail PD – representativeness test set per handbook.",
   "layer": "2lod"
  }
 ],
 "evidence_document": {
  "id": "EVD-01-RDS",
  "title": "Dataset Construction and DQ Assessment – Residential Real Estate Mortgages",
  "versions": {
   "1.0": [
    {
     "section": "1",
     "heading": "Purpose and scope",
     "text": "This document describes the construction of the reference data set (RDS) for the PD-MORT-NL v4 model and the assessment of its data quality. It follows the RDS template of MRM-STD-021 and was approved by the Head of Retail Credit Risk Modelling on 12 June 2027 (document version 1.0)."
    },
    {
     "section": "2.1",
     "heading": "Observation period",
     "text": "The reference data set covers monthly snapshots from January 2012 to December 2024, totalling 9.6 million account-months for 780,000 unique facilities."
    },
    {
     "section": "2.2",
     "heading": "Choice of observation window",
     "text": "The window was chosen to maximise the available history after the migration to the current mortgage administration system in 2011. It includes the 2012–2013 housing market downturn and the low-default period 2016–2021."
    },
    {
     "section": "3.3",
     "heading": "Default definition",
     "text": "A facility is flagged as defaulted when it is more than 90 days past due above a materiality threshold of EUR 100 absolute and 1% relative, or when an unlikeliness-to-pay trigger is met."
    },
    {
     "section": "3.4",
     "heading": "Unlikeliness-to-pay triggers",
     "text": "UTP triggers comprise distressed restructuring, forced sale of the collateral, bankruptcy of the obligor and specific credit risk adjustments. Triggers are sourced from the arrears management system and applied at obligor level."
    },
    {
     "section": "4.1",
     "heading": "Data sources and lineage",
     "text": "All 38 candidate variables are sourced from the mortgage administration system, the arrears management system and the collateral valuation database. Lineage from source table to RDS field is documented in Annex A for every variable."
    },
    {
     "section": "4.2",
     "heading": "Exclusions",
     "text": "Loans with incomplete collateral information were excluded from the RDS (3,412 facilities, 0.4% of the population; 61 defaults). Facilities originated under the former brand portfolio were excluded (1,208 facilities, 0.15%; 9 defaults) because origination data is unavailable. The combined exclusions affect the long-run default rate by +0.01pp."
    },
    {
     "section": "4.3",
     "heading": "Missing values and outliers",
     "text": "Missing values for debt-to-income at origination (2.3%) are imputed with the segment median; outliers in indexed LTV above 250% are capped. Both treatments are justified in Annex C."
    },
    {
     "section": "5.1",
     "heading": "Representativeness",
     "text": "Population stability between the RDS and the current portfolio was assessed using the PSI on loan-to-value bucket, loan age and interest-only share (PSI 0.04–0.06). Annex B adds a comparison of the full LTV distribution."
    },
    {
     "section": "5.3",
     "heading": "Impact of exclusions",
     "text": "Excluded loans show a comparable LTV distribution to retained loans (PSI 0.03) and a comparable default rate (0.47% vs 0.45%); the exclusions are therefore not expected to affect representativeness."
    },
    {
     "section": "6.1",
     "heading": "Data quality assessment",
     "text": "Completeness and accuracy were assessed for all 38 variables using the DQ rules of MRM-STD-022. Consistency was checked across the three source systems. All critical data elements pass the thresholds."
    },
    {
     "section": "6.2",
     "heading": "Data deficiencies",
     "text": "The default flag for 2012–2015 was approximated from arrears data prior to the implementation of the new definition of default. Probation periods could not be reconstructed for this period."
    },
    {
     "section": "7",
     "heading": "Personal data and fair treatment",
     "text": "The RDS contains personal data processed under the legal obligation of the CRR; a DPIA was completed (DPIA-2026-118). Nationality and gender are excluded. Postcode was assessed as a potential proxy and is only used at regional level within the house-price index."
    },
    {
     "section": "8",
     "heading": "Reproducibility",
     "text": "The RDS is built by versioned code in repository rds-mort-nl (tag v4.0.0). A full rebuild reproduces the RDS row count and default count exactly."
    }
   ],
   "0.7": [
    {
     "section": "1",
     "heading": "Purpose and scope",
     "text": "This document describes the construction of the reference data set (RDS) for the PD-MORT-NL v4 model and the assessment of its data quality. It follows the RDS template of MRM-STD-021 and was approved by the Head of Retail Credit Risk Modelling on 12 June 2027 (document version 1.0)."
    },
    {
     "section": "2.1",
     "heading": "Observation period",
     "text": "The reference data set covers monthly snapshots from January 2012 to December 2024, totalling 9.6 million account-months for 780,000 unique facilities."
    },
    {
     "section": "2.2",
     "heading": "Choice of observation window",
     "text": "The window was chosen to maximise the available history after the migration to the current mortgage administration system in 2011. It includes the 2012–2013 housing market downturn and the low-default period 2016–2021."
    },
    {
     "section": "3.3",
     "heading": "Default definition",
     "text": "A facility is flagged as defaulted when it is more than 90 days past due above a materiality threshold of EUR 100 absolute and 1% relative, or when an unlikeliness-to-pay trigger is met."
    },
    {
     "section": "3.4",
     "heading": "Unlikeliness-to-pay triggers",
     "text": "UTP triggers comprise distressed restructuring, forced sale of the collateral, bankruptcy of the obligor and specific credit risk adjustments. Triggers are sourced from the arrears management system and applied at obligor level."
    },
    {
     "section": "4.1",
     "heading": "Data sources and lineage",
     "text": "All 38 candidate variables are sourced from the mortgage administration system, the arrears management system and the collateral valuation database. Lineage from source table to RDS field is documented in Annex A for every variable."
    },
    {
     "section": "4.2",
     "heading": "Exclusions",
     "text": "Loans with incomplete collateral information were excluded from the RDS. Facilities originated under the former brand portfolio were excluded because origination data is unavailable. Representativeness impact: see §5.1."
    },
    {
     "section": "4.3",
     "heading": "Missing values and outliers",
     "text": "Missing values for debt-to-income at origination (2.3%) are imputed with the segment median; outliers in indexed LTV above 250% are capped. Both treatments are justified in Annex C."
    },
    {
     "section": "5.1",
     "heading": "Representativeness",
     "text": "Population stability between the RDS and the current portfolio was assessed using the PSI on loan-to-value bucket, loan age and interest-only share (PSI 0.04–0.06)."
    },
    {
     "section": "6.1",
     "heading": "Data quality assessment",
     "text": "Completeness and accuracy were assessed for all 38 variables using the DQ rules of MRM-STD-022. Consistency was checked across the three source systems. All critical data elements pass the thresholds."
    },
    {
     "section": "6.2",
     "heading": "Data deficiencies",
     "text": "The default flag for 2012–2015 was approximated from arrears data prior to the implementation of the new definition of default. Probation periods could not be reconstructed for this period."
    },
    {
     "section": "7",
     "heading": "Personal data and fair treatment",
     "text": "The RDS contains personal data processed under the legal obligation of the CRR; a DPIA was completed (DPIA-2026-118). Nationality and gender are excluded. Postcode was assessed as a potential proxy and is only used at regional level within the house-price index."
    },
    {
     "section": "8",
     "heading": "Reproducibility",
     "text": "The RDS is built by versioned code in repository rds-mort-nl (tag v4.0.0). A full rebuild reproduces the RDS row count and default count exactly."
    }
   ]
  }
 },
 "assessment_1lod": {
  "REQ-D01": {
   "verdict": "compliant",
   "citations": [
    {
     "doc": "EVD-01-RDS",
     "version": "1.0",
     "section": "2.1",
     "quote": "monthly snapshots from January 2012 to December 2024"
    }
   ],
   "confidence_factors": {
    "levels": {
     "match": "good",
     "coverage": "good",
     "location": "good",
     "consistency": "good",
     "verifiability": "good"
    },
    "notes": {
     "verifiability": "Script CC-01 confirmed 2012-01 to 2024-12 on the RDS table."
    }
   },
   "rationale": "13 years of history documented and confirmed by a deterministic check on the RDS table.",
   "mitigation": null,
   "script": {
    "id": "CC-01",
    "result": "pass",
    "detail": "min(snapshot)=2012-01, max(snapshot)=2024-12 → 13.0 years"
   }
  },
  "REQ-D02": {
   "verdict": "partial",
   "citations": [
    {
     "doc": "EVD-01-RDS",
     "version": "1.0",
     "section": "2.2",
     "quote": "includes the 2012–2013 housing market downturn"
    }
   ],
   "confidence_factors": {
    "levels": {
     "match": "good",
     "coverage": "weak",
     "location": "good",
     "consistency": "good",
     "verifiability": "weak"
    },
    "notes": {
     "coverage": "Downturn mentioned, but no analysis of why the mix of good and bad years is representative of the long run."
    }
   },
   "rationale": "The window includes a downturn, but the document does not demonstrate that the share of bad years is representative for long-run average calibration.",
   "mitigation": {
    "type": "remediation",
    "text": "Add a comparison of the observed default rate per year against a longer macro series (e.g. HPI and unemployment 2000–2024) to justify representativeness of the window."
   },
   "script": null
  },
  "REQ-D07": {
   "verdict": "compliant",
   "citations": [
    {
     "doc": "EVD-01-RDS",
     "version": "1.0",
     "section": "3.3",
     "quote": "more than 90 days past due above a materiality threshold of EUR 100 absolute and 1% relative"
    }
   ],
   "confidence_factors": {
    "levels": {
     "match": "good",
     "coverage": "good",
     "location": "good",
     "consistency": "good",
     "verifiability": "bad"
    },
    "notes": {
     "verifiability": "Code repository not linked to this run; implementation of the threshold cannot be confirmed."
    }
   },
   "rationale": "The documented definition matches CRR Art. 178 and RTS 2018/171. Confidence is lowered because only the documentation was assessed.",
   "mitigation": {
    "type": "verification",
    "text": "Link repository rds-mort-nl and run script check CC-03 (materiality threshold in default-flag code)."
   },
   "script": null
  },
  "REQ-D08": {
   "verdict": "compliant",
   "citations": [
    {
     "doc": "EVD-01-RDS",
     "version": "1.0",
     "section": "3.4",
     "quote": "UTP triggers comprise distressed restructuring, forced sale of the collateral, bankruptcy"
    }
   ],
   "confidence_factors": {
    "levels": {
     "match": "good",
     "coverage": "good",
     "location": "good",
     "consistency": "good",
     "verifiability": "weak"
    },
    "notes": {}
   },
   "rationale": "UTP triggers listed and applied at obligor level.",
   "mitigation": null,
   "script": null
  },
  "REQ-D09": {
   "verdict": "not_found",
   "citations": [],
   "confidence_factors": {
    "levels": {
     "match": "bad",
     "coverage": "bad",
     "location": "bad",
     "consistency": "good",
     "verifiability": "weak"
    },
    "notes": {
     "match": "No passage on probation or cure periods for the period after 2016.",
     "consistency": "§6.2 states probation periods could not be reconstructed for 2012–2015 only."
    }
   },
   "rationale": "The document is silent on probation periods after 2016. Evidence may exist in the Definition of Default implementation memo.",
   "mitigation": {
    "type": "verification",
    "text": "Upload the DoD implementation memo (CR-STD-110 implementation) or add a paragraph describing the probation logic after 2016."
   },
   "script": null
  },
  "REQ-D12a": {
   "verdict": "compliant",
   "citations": [
    {
     "doc": "EVD-01-RDS",
     "version": "1.0",
     "section": "4.2",
     "quote": "Loans with incomplete collateral information were excluded"
    },
    {
     "doc": "EVD-01-RDS",
     "version": "1.0",
     "section": "4.2",
     "quote": "origination data is unavailable"
    }
   ],
   "confidence_factors": {
    "levels": {
     "match": "good",
     "coverage": "good",
     "location": "good",
     "consistency": "good",
     "verifiability": "weak"
    },
    "notes": {}
   },
   "rationale": "A reason is documented for both exclusion categories.",
   "mitigation": null,
   "script": null
  },
  "REQ-D12b": {
   "verdict": "compliant",
   "citations": [
    {
     "doc": "EVD-01-RDS",
     "version": "1.0",
     "section": "4.2",
     "quote": "3,412 facilities, 0.4% of the population; 61 defaults"
    }
   ],
   "confidence_factors": {
    "levels": {
     "match": "good",
     "coverage": "good",
     "location": "good",
     "consistency": "good",
     "verifiability": "weak"
    },
    "notes": {}
   },
   "rationale": "Both exclusions quantified in facilities, share and defaults.",
   "mitigation": null,
   "script": null
  },
  "REQ-D12c": {
   "verdict": "compliant",
   "citations": [
    {
     "doc": "EVD-01-RDS",
     "version": "1.0",
     "section": "5.3",
     "quote": "comparable default rate (0.47% vs 0.45%)"
    }
   ],
   "confidence_factors": {
    "levels": {
     "match": "good",
     "coverage": "good",
     "location": "weak",
     "consistency": "good",
     "verifiability": "weak"
    },
    "notes": {
     "location": "Evidence in §5.3 instead of the template location §4.2."
    }
   },
   "rationale": "Impact on representativeness analysed on LTV distribution and default rate.",
   "mitigation": null,
   "script": null
  },
  "REQ-D15": {
   "verdict": "partial",
   "citations": [
    {
     "doc": "EVD-01-RDS",
     "version": "1.0",
     "section": "5.1",
     "quote": "PSI on loan-to-value bucket, loan age and interest-only share"
    }
   ],
   "confidence_factors": {
    "levels": {
     "match": "good",
     "coverage": "weak",
     "location": "good",
     "consistency": "good",
     "verifiability": "weak"
    },
    "notes": {
     "coverage": "Risk-driver distributions covered; default-rate levels between RDS and current portfolio not compared."
    }
   },
   "rationale": "Representativeness is shown for three risk drivers and the LTV distribution, but not for default-rate levels.",
   "mitigation": {
    "type": "remediation",
    "text": "Add a comparison of default rates per segment between the RDS and the most recent 3 years of the current portfolio."
   },
   "script": null
  },
  "REQ-D18": {
   "verdict": "partial",
   "citations": [
    {
     "doc": "EVD-01-RDS",
     "version": "1.0",
     "section": "6.1",
     "quote": "Completeness and accuracy were assessed for all 38 variables"
    }
   ],
   "confidence_factors": {
    "levels": {
     "match": "good",
     "coverage": "weak",
     "location": "good",
     "consistency": "good",
     "verifiability": "weak"
    },
    "notes": {
     "coverage": "Timeliness dimension not addressed."
    }
   },
   "rationale": "Three of four DQ dimensions assessed; timeliness missing.",
   "mitigation": {
    "type": "remediation",
    "text": "Add refresh-lag analysis per source system (timeliness dimension of MRM-STD-022)."
   },
   "script": null
  },
  "REQ-D19": {
   "verdict": "compliant",
   "citations": [
    {
     "doc": "EVD-01-RDS",
     "version": "1.0",
     "section": "4.1",
     "quote": "Lineage from source table to RDS field is documented in Annex A for every variable"
    }
   ],
   "confidence_factors": {
    "levels": {
     "match": "good",
     "coverage": "good",
     "location": "good",
     "consistency": "good",
     "verifiability": "weak"
    },
    "notes": {}
   },
   "rationale": "Lineage documented for all 38 variables.",
   "mitigation": null,
   "script": null
  },
  "REQ-D21": {
   "verdict": "not_found",
   "citations": [
    {
     "doc": "EVD-01-RDS",
     "version": "1.0",
     "section": "6.2",
     "quote": "The default flag for 2012–2015 was approximated"
    }
   ],
   "confidence_factors": {
    "levels": {
     "match": "weak",
     "coverage": "bad",
     "location": "good",
     "consistency": "good",
     "verifiability": "weak"
    },
    "notes": {
     "coverage": "Deficiency named but not linked to a MoC category or quantified."
    }
   },
   "rationale": "The deficiency is identified in §6.2 but no link to a MoC category is made in this document.",
   "mitigation": {
    "type": "compensating",
    "text": "Link the deficiency to MoC category A and reference the quantification (expected in MDD §7.2); upload the MDD as evidence."
   },
   "script": null
  },
  "REQ-D22": {
   "verdict": "compliant",
   "citations": [
    {
     "doc": "EVD-01-RDS",
     "version": "1.0",
     "section": "4.3",
     "quote": "imputed with the segment median"
    }
   ],
   "confidence_factors": {
    "levels": {
     "match": "good",
     "coverage": "good",
     "location": "good",
     "consistency": "good",
     "verifiability": "weak"
    },
    "notes": {}
   },
   "rationale": "Missing value and outlier treatment documented and justified in Annex C.",
   "mitigation": null,
   "script": null
  },
  "REQ-D25": {
   "verdict": "compliant",
   "citations": [
    {
     "doc": "EVD-01-RDS",
     "version": "1.0",
     "section": "7",
     "quote": "a DPIA was completed (DPIA-2026-118)"
    }
   ],
   "confidence_factors": {
    "levels": {
     "match": "good",
     "coverage": "good",
     "location": "good",
     "consistency": "good",
     "verifiability": "weak"
    },
    "notes": {}
   },
   "rationale": "Legal basis and DPIA referenced.",
   "mitigation": null,
   "script": null
  },
  "REQ-D26": {
   "verdict": "compliant",
   "citations": [
    {
     "doc": "EVD-01-RDS",
     "version": "1.0",
     "section": "7",
     "quote": "Postcode was assessed as a potential proxy"
    }
   ],
   "confidence_factors": {
    "levels": {
     "match": "good",
     "coverage": "good",
     "location": "good",
     "consistency": "good",
     "verifiability": "weak"
    },
    "notes": {}
   },
   "rationale": "Protected attributes excluded; proxy screening documented for postcode.",
   "mitigation": null,
   "script": null
  },
  "REQ-D30": {
   "verdict": "compliant",
   "citations": [
    {
     "doc": "EVD-01-RDS",
     "version": "1.0",
     "section": "8",
     "quote": "A full rebuild reproduces the RDS row count and default count exactly"
    }
   ],
   "confidence_factors": {
    "levels": {
     "match": "good",
     "coverage": "good",
     "location": "good",
     "consistency": "good",
     "verifiability": "weak"
    },
    "notes": {}
   },
   "rationale": "Build is versioned and reproducible.",
   "mitigation": null,
   "script": null
  },
  "REQ-D31": {
   "verdict": "partial",
   "citations": [
    {
     "doc": "EVD-01-RDS",
     "version": "1.0",
     "section": "6.2",
     "quote": "approximated from arrears data"
    }
   ],
   "confidence_factors": {
    "levels": {
     "match": "weak",
     "coverage": "weak",
     "location": "good",
     "consistency": "good",
     "verifiability": "weak"
    },
    "notes": {
     "coverage": "The approximation is an expert judgement; approval and challenge are not documented."
    }
   },
   "rationale": "Expert judgement in the default-flag approximation is described but its approval is not documented.",
   "mitigation": {
    "type": "remediation",
    "text": "Record the approximation in the expert judgement log with approver and date (MRM-STD-023)."
   },
   "script": null
  },
  "REQ-G01": {
   "verdict": "compliant",
   "citations": [
    {
     "doc": "EVD-01-RDS",
     "version": "1.0",
     "section": "1",
     "quote": "approved by the Head of Retail Credit Risk Modelling on 12 June 2027"
    }
   ],
   "confidence_factors": {
    "levels": {
     "match": "good",
     "coverage": "good",
     "location": "good",
     "consistency": "good",
     "verifiability": "weak"
    },
    "notes": {}
   },
   "rationale": "Template followed; version and approval recorded.",
   "mitigation": null,
   "script": null
  }
 },
 "decisions_1lod_initial": {
  "REQ-D01": {
   "decision": "accepted"
  },
  "REQ-D08": {
   "decision": "accepted"
  },
  "REQ-D12a": {
   "decision": "accepted"
  },
  "REQ-D12b": {
   "decision": "accepted"
  },
  "REQ-D19": {
   "decision": "accepted"
  },
  "REQ-D22": {
   "decision": "accepted"
  },
  "REQ-D25": {
   "decision": "accepted"
  },
  "REQ-D26": {
   "decision": "accepted"
  },
  "REQ-D30": {
   "decision": "accepted"
  },
  "REQ-G01": {
   "decision": "accepted"
  }
 },
 "decisions_1lod_scripted": {
  "REQ-D07": {
   "decision": "accepted",
   "reason": "Documentation matches regulation; code check out of scope for RDS document."
  },
  "REQ-D15": {
   "decision": "edited",
   "final_verdict": "compliant",
   "reason": "LTV distribution comparison added in Annex B."
  },
  "REQ-D21": {
   "decision": "edited",
   "final_verdict": "compliant",
   "reason": "Covered in MDD §7.2 (MoC category A, +6%)."
  },
  "REQ-D09": {
   "decision": "edited",
   "final_verdict": "compliant",
   "reason": "Probation logic described in DoD implementation memo (uploaded)."
  },
  "REQ-D02": {
   "decision": "accepted",
   "reason": "Remediation planned: macro comparison to be added in v1.1."
  },
  "REQ-D18": {
   "decision": "accepted",
   "reason": "Timeliness analysis to be added in v1.1."
  },
  "REQ-D31": {
   "decision": "accepted",
   "reason": "EJ log entry to be added."
  },
  "REQ-D12c": {
   "decision": "accepted"
  }
 },
 "assessment_2lod_blind": {
  "REQ-D01": {
   "verdict": "compliant",
   "rationale": "Confirmed; replication VAL-01 matches period.",
   "script": null
  },
  "REQ-D02": {
   "verdict": "partial",
   "rationale": "Same observation as 1LoD AI: representativeness of the window not demonstrated.",
   "script": null
  },
  "REQ-D07": {
   "verdict": "non_compliant",
   "rationale": "Documented definition is correct, but script VAL-02 shows the build code applies EUR 250 absolute.",
   "script": {
    "id": "CC-03",
    "result": "fail",
    "detail": "rds_build.py L214: MAT_ABS = 250 (documented: 100)"
   }
  },
  "REQ-D08": {
   "verdict": "compliant",
   "rationale": "Agree.",
   "script": null
  },
  "REQ-D09": {
   "verdict": "partial",
   "rationale": "DoD memo describes probation, but not for multiple defaults within 12 months.",
   "script": null
  },
  "REQ-D12a": {
   "verdict": "compliant",
   "rationale": "Agree.",
   "script": null
  },
  "REQ-D12b": {
   "verdict": "compliant",
   "rationale": "Agree.",
   "script": null
  },
  "REQ-D12c": {
   "verdict": "compliant",
   "rationale": "Agree.",
   "script": null
  },
  "REQ-D15": {
   "verdict": "partial",
   "rationale": "Annex B compares LTV only; default-rate levels still not compared (MV-HB-003 §6).",
   "script": null
  },
  "REQ-D18": {
   "verdict": "partial",
   "rationale": "Timeliness missing.",
   "script": null
  },
  "REQ-D19": {
   "verdict": "compliant",
   "rationale": "Agree; replication used Annex A successfully.",
   "script": null
  },
  "REQ-D21": {
   "verdict": "non_compliant",
   "rationale": "MDD §7.2 links the deficiency to MoC category A (+6%), but sensitivity analysis indicates +11% is needed.",
   "script": null
  },
  "REQ-D22": {
   "verdict": "compliant",
   "rationale": "Agree.",
   "script": null
  },
  "REQ-D25": {
   "verdict": "compliant",
   "rationale": "Agree.",
   "script": null
  },
  "REQ-D26": {
   "verdict": "compliant",
   "rationale": "Agree.",
   "script": null
  },
  "REQ-D30": {
   "verdict": "compliant",
   "rationale": "Agree; rebuild reproduced.",
   "script": null
  },
  "REQ-D31": {
   "verdict": "partial",
   "rationale": "Agree.",
   "script": null
  },
  "REQ-G01": {
   "verdict": "compliant",
   "rationale": "Agree.",
   "script": null
  },
  "VAL-01": {
   "verdict": "compliant",
   "rationale": "RDS replicated from source: 99.8% row match, default count identical.",
   "script": {
    "id": "VR-01",
    "result": "pass",
    "detail": "rows 9,600,412 vs 9,581,210 (99.8%); defaults 43,118 vs 43,118"
   }
  },
  "VAL-02": {
   "verdict": "non_compliant",
   "rationale": "Materiality threshold in code (EUR 250) differs from documentation and regulation (EUR 100).",
   "script": {
    "id": "CC-03",
    "result": "fail",
    "detail": "rds_build.py L214: MAT_ABS = 250"
   }
  },
  "VAL-03": {
   "verdict": "non_compliant",
   "rationale": "Sensitivity on the approximated default flag shows MoC category A should be ~+11%, not +6%.",
   "script": null
  },
  "VAL-04": {
   "verdict": "partial",
   "rationale": "Default-rate level comparison absent; risk-driver PSI acceptable.",
   "script": null
  }
 },
 "draft_findings_2lod": [
  {
   "id": "F-07",
   "requirement": "REQ-D07 / VAL-02",
   "severity": "high",
   "title": "Materiality threshold in code differs from documented definition of default",
   "observation": "RDS documentation §3.3 states EUR 100 / 1%. The RDS build script applies EUR 250 absolute (rds_build.py L214).",
   "impact": "Default flag understated for small arrears → PD calibration potentially too low.",
   "challenge": "Since when has EUR 250 been applied, and to which vintages of the RDS?",
   "owner": "Retail Credit Risk Modelling",
   "deadline": "2027-10-31"
  },
  {
   "id": "F-03",
   "requirement": "REQ-D21 / VAL-03",
   "severity": "high",
   "title": "MoC category A underestimates data deficiency impact",
   "observation": "MDD §7.2 applies +6% for the approximated default flag 2012–2015; validation sensitivity indicates ~+11%.",
   "impact": "Capital requirement understated until MoC recalibrated.",
   "challenge": "Please provide the sensitivity analysis supporting +6%.",
   "owner": "Retail Credit Risk Modelling",
   "deadline": "2027-10-31"
  },
  {
   "id": "F-05",
   "requirement": "REQ-D15 / VAL-04",
   "severity": "medium",
   "title": "Representativeness not tested on default-rate levels",
   "observation": "§5.1 and Annex B compare risk-driver distributions only.",
   "impact": "Calibration may not reflect current portfolio risk level.",
   "challenge": "Provide default-rate comparison per segment, RDS vs 2022–2024.",
   "owner": "Retail Credit Risk Modelling",
   "deadline": "2027-12-31"
  },
  {
   "id": "F-09",
   "requirement": "REQ-D18",
   "severity": "low",
   "title": "Timeliness DQ dimension not assessed",
   "observation": "§6.1 covers completeness, accuracy and consistency only.",
   "impact": "Limited.",
   "challenge": "Add refresh-lag analysis.",
   "owner": "Retail Credit Risk Modelling",
   "deadline": "2028-03-31"
  }
 ],
 "library_change": {
  "from": "3.2",
  "to": "3.3",
  "trigger": "ECB guide to internal models v4.0 (credit risk chapter) and CRR3",
  "changes": [
   {
    "id": "REQ-D01",
    "type": "modified",
    "old": "The RDS covers at least 5 years of historical data for retail PD estimation.",
    "new": "The RDS covers at least 5 years of historical data for retail PD estimation, and the calibration window demonstrably includes a period of economic downturn.",
    "source": "ECB guide v4.0 – LRA calibration",
    "impact_note": "PD-MORT-NL v4: verdict likely still valid (window includes 2012–2013 downturn) – confirm."
   },
   {
    "id": "REQ-D55",
    "type": "new",
    "new": "The correlation between yearly default rates and relevant macroeconomic indicators is analysed to support the LRA window.",
    "source": "ECB guide v4.0 – LRA calibration",
    "impact_note": "No evidence yet in any retail PD model."
   },
   {
    "id": "REQ-L14",
    "type": "modified",
    "old": "Downturn LGD is estimated per EBA/GL/2019/03.",
    "new": "Downturn LGD covers all relevant components and includes yearly elevated LGDs.",
    "source": "ECB guide v4.0 – LGD",
    "impact_note": "LGD models only."
   }
  ],
  "impact": [
   [
    "MDL-01",
    2
   ],
   [
    "MDL-02",
    4
   ],
   [
    "MDL-03",
    3
   ],
   [
    "MDL-04",
    5
   ],
   [
    "MDL-05",
    4
   ],
   [
    "MDL-06",
    3
   ],
   [
    "MDL-13",
    6
   ]
  ]
 },
 "upload_examples": [
  {
   "name": "ECB decision ECB-SSM-2025-NL-ABC-123 (excerpt).pdf",
   "kind": "requirement_source",
   "extracted": [
    {
     "id": "MS-01",
     "text": "Obligation: the institution shall apply a PD add-on of 5% until the definition-of-default remediation is completed.",
     "scope": "model_specific"
    },
    {
     "id": "MS-02",
     "text": "Limitation: the model shall not be applied to buy-to-let mortgages.",
     "scope": "model_specific"
    }
   ]
  },
  {
   "name": "Validation report PD-MORT-NL v3 (2025).pdf",
   "kind": "requirement_source",
   "extracted": [
    {
     "id": "MS-03",
     "text": "Open finding V3-F02: representativeness of self-employed borrowers to be demonstrated in the next model version.",
     "scope": "model_specific"
    }
   ]
  },
  {
   "name": "DoD implementation memo.pdf",
   "kind": "evidence"
  },
  {
   "name": "MDD PD-MORT-NL v4.pdf",
   "kind": "evidence"
  }
 ]
}
```

### 13.3 Additional evidence text for uploads (use when these files are uploaded in the demo)
- `MDD PD-MORT-NL v4.pdf` → section **7.2 Margin of Conservatism**: "The approximation of the default flag for 2012–2015 is treated as a category A data deficiency. A MoC of +6% relative is applied to the long-run average default rate."
- `DoD implementation memo.pdf` → section **3 Probation**: "After cure, a facility remains in probation for 3 months (12 months for distressed restructurings) before returning to non-default status."

---

## 14. Acceptance checklist

- [ ] All 14 demo steps work without console errors.
- [ ] No shared state between 1LoD and 2LoD: data crosses only via package files; hash verified on import; tampered package rejected; 2LoD sees 1LoD verdicts only after Reveal.
- [ ] Every AI verdict has citation or "Not found"; every confidence has a "Why?"; every non-compliant/partial/not-found/low-confidence row has a mitigation.
- [ ] Script checks visually distinct from AI checks.
- [ ] Excel export opens in Excel with all columns listed in 8.4.
- [ ] Reset demo data restores the initial state.
- [ ] `npm run build` and `npm run lint` pass; deploys on Vercel without configuration.
- [ ] No real bank name, logo or trademarked font anywhere; "Prototype · illustrative data" visible on every page.
