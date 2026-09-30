# Requirement library — authoring guide (Part 2)

This folder holds the real content of the requirement library of the Model Compliance Workbench prototype: one requirements file per library document, and — for internal documents — the full text of the document itself. The document register is `data/documents.json` (72 documents; do not change it). Model inventory: `data/models.json`. Pilot seed: `data/pilot_seed.json`.

Write as if you work in Model Risk Management at a large European bank. A model developer or validator must recognise every requirement as correct, precise and traceable. No filler, no vague "the model should be good" statements.

## Files

- `data/library/requirements/<DOC-ID>.json` — one file per document ID from `documents.json` (for example `EXT-CRR-IRB.json`).
- `data/library/texts/<DOC-ID>.md` — **internal documents only** (IDs starting with `INT-`): the full text of the policy or standard.

## Requirements file schema

```json
{
  "docId": "EXT-CRR-IRB",
  "requirements": [
    {
      "id": "CRR-179-1-a",
      "article": "CRR Art. 179(1)(a)",
      "chapter": "Data requirements — general",
      "text": "Estimates are plausible and intuitive and are based on the material drivers of the respective risk parameters.",
      "quote": "optional short verbatim quote from the source (max 25 words)",
      "category": "data",
      "check_type": "ai",
      "components": ["mdd"],
      "applies_if": { "any": ["irb_pd", "irb_lgd"], "all": [] },
      "not_applicable_reason": "Applies to PD and LGD estimation only.",
      "layer": "shared",
      "verification": "verified",
      "verification_note": "Checked against EUR-Lex consolidated text 2024."
    }
  ]
}
```

Field rules:

| Field | Rule |
|---|---|
| `id` | Globally unique. Format `<PREFIX>-<reference>` using the prefix given in your task (for example `CRR-179-1-a`, `EBA-PDLGD-020b`, `MRM-STD-021-4.2`). Letters, digits, dots and hyphens only. **Pilot IDs (REQ-…, VAL-…) must be kept exactly** — see below. |
| `article` | Exact reference to article / paragraph / point / section as a practitioner would cite it: "CRR Art. 180(2)(e)", "EBA/GL/2017/16 para 36", "ECB guide to internal models, Credit risk, para 124", "MRM-STD-021 §4.2". |
| `chapter` | Short heading used to group requirements in the UI (the chapter or topic of the source). |
| `text` | The obligation in plain, formal English, faithful to the source, one obligation per requirement (split compound provisions into separate requirements; that is what makes a real matrix long). Start with the subject: "The institution…", "The RDS…", "The model documentation…", "Default definition…". Max ~45 words. |
| `quote` | Optional. Only for EU legal acts, EBA and ECB publications and US Fed/OCC guidance (reuse permitted with attribution). **Never** quote IFRS standards, BCBS, PRA, DNB or Dutch law text — paraphrase instead. Max 25 words, verbatim. |
| `category` | `data` · `methodology` · `governance` · `documentation` · `validation` |
| `check_type` | `ai` (assessed from documentation) · `script` (deterministic check on data or code) · `ai+script` (both) |
| `components` | Where the requirement is assessed: `rds` (data / reference data set documentation), `mdd` (methodology and model development document). A requirement can list both. (The "Full model" component automatically includes everything; governance-only requirements list both.) |
| `applies_if` | Requirement-level relevance on top of the document-level rule, using **only these model tags**: `all_models, aml, capital, climate, corporate, credit, credit_origination, fraud, genai, icaap, ifrs9, irb, irb_ead, irb_lgd, irb_pd, irrbb, market, market_ima, ml, mortgage, mortgage_origination, natural_person_credit, personal_data, retail, risk_reporting, sme, statistical, stress_test, third_party_ai, valuation`. `any` empty = no extra condition. Example: an LGD downturn requirement in the CRR file has `"any": ["irb_lgd"]`. |
| `not_applicable_reason` | Required when `applies_if` is restrictive: the one-line reason shown when a model does not meet it ("Applies to retail PD estimation only."). |
| `layer` | `shared` for everything, except the validation standards (`INT-VAL-*`) which use `2lod`. |
| `verification` | `verified` when you are confident the reference and the substance are correct (checked against the official text, or certain from knowledge); `to_review` when you are unsure about the exact paragraph number or wording. **Never guess silently** — mark `to_review` and explain in `verification_note`. |
| `verification_note` | Short: what you checked, or what is uncertain. |

## Depth and size

Decompose to article / paragraph / point level. Indicative counts per document:

- binding law with high extraction priority: **40–100** requirements (CRR IRB is the largest);
- EBA guidelines and ECB guides with high priority: **30–70**;
- medium priority: **15–35**;
- low priority and reference documents (SR 11-7, SS1/23, CRD Art. 101): **8–20**.

Cover the document's `key_topics` in `documents.json`: every key topic must be represented.

## Internal documents (`INT-*`)

These are fictional internal policies and standards of the bank. Write the **full document text** in `data/library/texts/<DOC-ID>.md`:

- a header block: title, reference (from `documents.json`), version and date (`version_date`), owner (`issuer`), approval body (Model Risk Committee for MRM documents), status "Approved";
- sections: 1 Purpose, 2 Scope and applicability, 3 Definitions, 4… substantive chapters with **numbered provisions** (4.1, 4.2 …), roles and responsibilities, exceptions and dispensations, related documents (cite the external regulation it implements and other internal documents by reference), document history;
- 1,500–3,500 words, formal house style of a European bank, consistent with the external regulation it implements and with the other internal documents;
- no real bank names.

Derive the requirements from its numbered provisions (`article`: "MRM-STD-021 §4.2"). Internal documents are `verification: "verified"` (you are the author) unless a provision depends on external law you are unsure about.

## Pilot requirements — keep exactly

The pilot seed (`data/pilot_seed.json`, key `requirements`) defines requirements with fixed IDs. When your task covers their source document, include these records **with the same `id`, `text` and `article`**, add the other fields (components, applies_if, etc.), and do not create a duplicate of the same obligation under another ID. Their `components` must include `rds`.

| Pilot ID | Source document |
|---|---|
| REQ-D01, REQ-D15, REQ-D21 | EXT-CRR-IRB |
| REQ-D02 | EXT-ECB-GIM |
| REQ-D07 | EXT-RTS-MAT |
| REQ-D08, REQ-D09 | EXT-EBA-DOD |
| REQ-D12a, REQ-D12b, REQ-D12c, REQ-D22 | EXT-EBA-PDLGD |
| REQ-D18 | INT-STD-DQ |
| REQ-D19 | INT-POL-DATA |
| REQ-D25 | EXT-GDPR |
| REQ-D26 | INT-POL-CREDIT |
| REQ-D30, REQ-G01 | INT-STD-DOC |
| REQ-D31 | INT-STD-EJ |
| VAL-01 | INT-VAL-GEN (layer `2lod`) |
| VAL-02, VAL-03 | INT-VAL-IRB (layer `2lod`) |
| VAL-04 | INT-VAL-TEST (layer `2lod`) |

Library change v3.2 → v3.3 (`pilot_seed.json`, key `library_change`): include **REQ-L14** in `EXT-EBA-DLGD` with its v3.2 text (the `old` text), and **REQ-D55** in `EXT-ECB-GIM` with `"introduced_in": "3.3"` (an extra field) and the `new` text.

## Before you finish

Run `node scripts/validate-library.mjs <DOC-ID> [<DOC-ID> …]` for your documents and fix every error it reports.
