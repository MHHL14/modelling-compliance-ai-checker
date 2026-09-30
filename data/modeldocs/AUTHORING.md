# Model documentation library — authoring guide (Part 3)

The model documentation library holds the development documentation of the 20 models in `data/models.json`. In the prototype, a model developer **selects** documents from this library (or uploads their own) for the draft check and the self-assessment; the simulated AI assesses the locked requirement set against exactly the selected documents, using the **evidence map** in each section. The 2nd line assesses the same frozen documents and uses the **code facts** and **validation tests** for its script checks.

Write as the bank's model development team would: realistic, specific, internally consistent, in the bank's documentation template (MRM-STD-021; read `data/library/texts/INT-STD-DOC.md` for the RDS and MDD templates). A model developer or validator must recognise the documents as genuine.

## File

`data/modeldocs/<MODEL-ID>.json` — one file per model.

```json
{
  "modelId": "MDL-07",
  "documents": [
    {
      "id": "EVD-07-MDD",
      "title": "IFRS 9 Mortgages methodology document",
      "type": "Model development document",
      "component": ["mdd"],
      "owner": "Retail Credit Risk Modelling",
      "versions": [
        {
          "version": "0.9",
          "status": "draft",
          "date": "2027-04-30",
          "sections": [
            {
              "section": "4.2",
              "heading": "Significant increase in credit risk",
              "text": "Full paragraph text (60–220 words) ...",
              "evidence": [
                { "req": "IFRS9-5.5.9", "coverage": "full", "quote": "an exact sentence or clause copied verbatim from text" }
              ]
            }
          ]
        },
        { "version": "1.0", "status": "final", "date": "2027-06-05", "sections": [ ] }
      ]
    }
  ],
  "deficiencies": [
    {
      "req": "IFRS9-5.5.17",
      "doc": "EVD-07-MDD",
      "verdict": "partial",
      "rationale": "Scenario weights are documented but the rationale for the 50/30/20 split is not evidenced.",
      "mitigation": { "type": "remediation", "text": "Document the derivation of scenario weights and their governance approval." }
    }
  ],
  "codeFacts": [
    {
      "id": "CC-21",
      "reqs": ["FIN-STD-200-4.3"],
      "check": "SICR relative PD threshold in the staging code",
      "result": "fail",
      "detail": "staging.py L88: SICR_MULTIPLIER = 3.0 (documented: 2.5)"
    }
  ],
  "validationTests": [
    { "req": "MV-STD-001-5.1", "id": "VR-01", "result": "pass", "verdict": "compliant", "detail": "Stage allocation reproduced for 99.6% of facilities (Q4 2026 snapshot)." }
  ]
}
```

## Rules

| Item | Rule |
|---|---|
| Documents per model | **4–6**, fitting the model type. Keep every document already listed in the model's `evidence_documents` in `models.json` (same `id` and `title`; `type` may be normalised) and add the missing ones. Typical set: RDS / data documentation, model development document (MDD), data quality report, implementation and testing report, monitoring or performance report; plus explainability and fairness report (ML), evaluation and guardrail test report (GenAI), expert panel minutes (expert models), backtesting report (market risk), change memo (models in a change). Do **not** include a code repository as a document. IDs: `EVD-<nn>-<SHORT>`. |
| `component` | `["rds"]` for data / reference data set documentation and data quality reports, `["mdd"]` for methodology documents, `["rds","mdd"]` for reports that evidence both (implementation, monitoring, validation reports). |
| Versions | The two main documents (RDS/data documentation and MDD) have a **draft** (`0.x`) and a **final** (`1.0` or the model's own version numbering) version; other documents have one final version. The draft is the final minus some content: 2–4 sections missing or incomplete, so the draft check finds real gaps that are resolved in the final version. |
| Sections | 12–30 sections for main documents, 6–15 for others, numbered per the MRM-STD-021 template. Text 60–220 words each, concrete: data periods, population sizes, default/loss rates, performance metrics (AUC, Gini, PSI, back-testing results), parameter values, dates, committee approvals. Numbers must be plausible for the model type and consistent across the model's documents and with `models.json`. |
| Evidence map | For each section, list the requirement IDs it addresses (`req`), `coverage` `full` or `partial`, and a `quote` that appears **verbatim** in that section's `text`. Only use requirement IDs that exist in `data/library/requirements/*.json` and that apply to this model (document-level applicability in `documents.json` and requirement-level `applies_if`). Across the final versions of the model's documents, cover **at least 75%** of the applicable requirements for the component they document; leave some requirements deliberately unevidenced (realistic gaps: evidence that sits in no document, or only in a document the user might not select). |
| Deficiencies | 3–6 per model, realistic for the model type (an approximation without MoC link, an undocumented override, scenario weights without rationale, a missing sub-analysis, a threshold that is documented but not justified). `verdict` is `partial` or `non_compliant`. |
| Code facts | 2–4 per model. At least **one `fail`** where the implementation differs from what the documentation states (the documentation must state the documented value explicitly in a section, and that section's evidence map must cover the same requirement with `coverage: full` — this is what makes the 1st line see "compliant, low confidence — code not linked" and the 2nd line find "code differs from documentation"). The others `pass`. |
| Validation tests | 3–5 per model, referencing requirement IDs from the validation standards (`INT-VAL-*` files) that apply to the model: replication (MV-STD-001), code-versus-documentation (MV-STD-001 / MV-STD-010), statistical tests from MV-HB-003 (discrimination, calibration, stability, representativeness), AI-specific tests from MV-STD-020 for ML/GenAI. At least one `pass` and one `fail` or `partial`. |
| Pilot MDL-01 | Keep the pilot exactly: the RDS document `EVD-01-RDS` versions `0.7` and `1.0` must use the section texts from `data/pilot_seed.json` (`evidence_document.versions`) verbatim, and their evidence maps must reproduce the pilot citations in `assessment_1lod` (same requirement, section, quote). The MDD `EVD-01-MDD` must contain section 7.2 with the text in the build spec (MoC +6% for the approximated default flag) and a DoD implementation memo `EVD-01-DODMEMO` must contain section 3 on probation. Code fact CC-03 (fail, `rds_build.py L214: MAT_ABS = 250 (documented: 100)`) and validation tests matching VAL-01..VAL-04 in `assessment_2lod_blind`. |

## Before you finish

Run `node scripts/validate-modeldocs.mjs <MODEL-ID> …` and fix every error it reports.
