# Model Validation Standard

| | |
|---|---|
| **Title** | Model Validation Standard |
| **Reference** | MV-STD-001 |
| **Version and date** | v4.0 (2026-04) |
| **Owner** | Model Validation (2LoD) – Head of Model Validation |
| **Approval body** | Model Risk Committee |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose

1.1 This Standard sets the minimum requirements for the independent validation of models by the Model Validation function (MV). It implements the validation chapter of the Model Risk Management Policy (MRM-POL-001) and gives effect to the validation requirements of Article 185 of Regulation (EU) No 575/2013 (CRR), the EBA supervisory handbook on the validation of rating systems under the IRB approach and the ECB guide to internal models (general topics, internal validation).

1.2 The Standard defines what a validation must cover, how deep it must go for each model tier, and how the results are expressed in a validation opinion. Model-type-specific requirements are set in MV-STD-010 (IRB models) and MV-STD-020 (AI and ML models). Statistical tests and thresholds are set in the Validation Testing Handbook (MV-HB-003). Findings are rated and followed up in accordance with MV-STD-002.

## 2 Scope and applicability

2.1 This Standard applies to all models recorded in the model inventory in accordance with MRM-STD-010, regardless of risk type, legal entity or whether the model is developed internally or sourced from a third party.

2.2 It applies to initial validations, periodic validations and change validations as defined in §4.4. Model-type-specific standards take precedence where they are more stringent.

2.3 Validation work performed by external parties on behalf of MV is subject to this Standard in full.

## 3 Definitions

- **Model owner** – the first line of defence (1LoD) unit accountable for the model, its performance and its use.
- **Reference data set (RDS)** – the data set used for the development or recalibration of a model, as documented in accordance with MRM-STD-021.
- **Replication** – the independent reconstruction by MV of a data set or model result from the underlying sources, using MV's own code.
- **Implemented parameters** – all numerical and logical elements of a model as deployed in code, including coefficients, transformations, bin boundaries, grade boundaries, cut-offs, overrides, floors, margins of conservatism and post-model adjustments.
- **Validation opinion** – the overall conclusion of MV on the fitness of a model for its intended use (§10.2).
- **Tier** – the model risk tier (1 = highest, 3 = lowest) assigned under MRM-STD-010.

## 4 Independence and validation scope

4.1 **Organisational independence.** MV is organisationally independent of the units that develop, own or use models. It reports to the Chief Risk Officer through the Head of Model Risk Management. The remuneration of validators is not linked to the outcome of validations or to the approval of models.

4.2 **Individual independence.** A validator shall not validate a model to whose development, calibration or implementation he or she contributed, nor a model developed by a unit in which he or she worked during the preceding twelve months. Early challenge by MV during development is permitted, is documented, and does not replace the validation.

4.3 **External validators.** External parties may perform validation activities under the direction and review of MV. An external party that contributed to the development of the model shall not validate it. MV remains responsible for the validation opinion.

4.4 **Validation types.** MV performs:
(a) an *initial validation* before first use of a new model and before any application for supervisory approval;
(b) a *periodic validation* of every model in use at the frequency set in §4.6;
(c) a *change validation* before implementation of a change classified as material under MRM-STD-050; non-material changes are subject to a targeted review of the changed components.

4.5 **Scope by tier.** The minimum validation scope depends on the model tier:

| Validation area | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|---|
| Data replication (§5.1) | Full replication of the RDS | Replication of key variables on the full population | Reconciliation of record counts and totals |
| Re-estimation (§5.2) | Full re-estimation | Re-estimation of main components | Re-performance of key outputs |
| Code-versus-documentation check (§5.3) | All implemented parameters | All implemented parameters | Sample-based |
| Conceptual soundness (§6) | Full review | Full review | Focused review |
| Outcome analysis and benchmarking (§8) | Back-testing and independent benchmark | Back-testing and benchmark | Back-testing |
| Use test (§9) | Full review | Full review | Confirmation of use |

Periodic validations may limit the review of conceptual soundness to changes since the last validation, provided a full-scope validation was performed within the last three years for Tier 1 models.

4.6 **Frequency.** Periodic validation takes place at least annually for Tier 1 models and for all models used for regulatory capital, at least every two years for Tier 2 models and at least every three years for Tier 3 models. An ad-hoc validation is triggered by a red monitoring result under MRM-STD-040, a material change of the portfolio or of the model's use, or an open High finding that calls the model's reliability into question.

4.7 **Planning and scoping.** MV maintains an annual validation plan approved by the Model Risk Committee. Each validation starts with a scoping memo that records the validation type, the tier-based scope, the applicable requirements from the requirement library and any scope limitations.

## 5 Replication and implementation verification

5.1 **Independent replication of the data set.** MV independently replicates the RDS from source data, using its own code and the documented data lineage, without reusing the model developer's extraction or build code. The depth of replication follows §4.5. The replication reconciles the number of records, the number of defaults or events and the distribution of key variables with the developer's RDS; unexplained differences above 0.5% of records or events are recorded as findings.

5.2 **Re-estimation.** MV re-estimates the model on the replicated RDS following the documented methodology. Differences in estimated parameters or outputs that are not explained by documented choices are recorded as findings.

5.3 **Code-versus-documentation check.** MV verifies that every implemented parameter in the model code matches the value and logic documented in the approved model development document (MDD) and RDS documentation. The check covers development code and, where available, production code. Each deviation is recorded as a finding, irrespective of its quantitative impact.

5.4 **Production implementation review.** MV verifies, on a test sample drawn independently of the model owner's implementation tests under MRM-STD-030, that the production implementation reproduces the outputs of the validated model. Grade or class assignments must match in full; unexplained numerical differences are recorded as findings.

5.5 **Evidence retention.** Replication code, input extracts and results are stored in MV's version-controlled repository for at least the life of the model plus five years.

## 6 Conceptual soundness

6.1 MV assesses whether the modelling approach is appropriate for the model's purpose, portfolio and intended use, with reference to alternative approaches in academic literature and industry practice.

6.2 MV identifies the key assumptions of the model, assesses their validity and verifies that the model limitations are documented together with their mitigants.

6.3 MV reviews the selection of risk drivers for statistical significance, economic rationale and plausibility of sign and magnitude.

6.4 MV challenges each material expert-judgement component against the requirements of MRM-STD-023, including the documented rationale and the sensitivity of the model output to the judgement.

6.5 MV performs its own sensitivity analysis of the model output to the key assumptions and parameters.

## 7 Data

7.1 MV independently assesses the quality of the RDS against the data quality dimensions of MRM-STD-022 and does not rely solely on the model owner's data quality assessment.

7.2 MV assesses the representativeness of the development data for the current and expected portfolio using the tests of MV-HB-003 §6.

7.3 MV assesses the impact of each material data treatment (exclusions, imputations, outlier treatment and filters) on the number of records and events and on the model outcome.

7.4 MV assesses the fitness for use of external and vendor data used in the model.

## 8 Outcome analysis and benchmarking

8.1 MV performs outcome analysis comparing model outputs with realised outcomes on out-of-sample and, where available, out-of-time data, using the tests and thresholds of MV-HB-003.

8.2 For Tier 1 and Tier 2 models MV compares the model outputs with at least one independent benchmark, such as a challenger model built by MV, external ratings or external data; material divergences are explained in the validation report.

8.3 Where outcome analysis is not possible because of limited history or a low number of events, MV documents the alternative evidence used, such as benchmarking, expert review or stress tests, and reports the limitation in the validation report.

## 9 Use test

9.1 MV verifies that the model is used in line with its approved purpose and scope and identifies any use outside the approved scope.

9.2 For models used in decision-making processes, and for IRB models in line with CRR Art. 144(1)(b), MV assesses whether the model outputs play an essential role in the relevant processes.

9.3 MV analyses the frequency, direction and rationale of overrides of model outputs. An override rate above the threshold defined in the monitoring plan is analysed in the validation report.

## 10 Validation report and opinion

10.1 **Report content.** The validation report contains at least: an executive summary with the validation opinion; a description of the model and its intended use; the validation type, the tier-based scope and any scope limitations; the results per validation area of §§5–9; the findings rated under MV-STD-002; the conditions attached to the opinion; and the list of library requirements assessed with their outcome.

10.2 **Opinion categories.** MV expresses one of three opinions:
(a) *Fit for purpose* – the model is conceptually sound, correctly implemented and performs adequately for its intended use;
(b) *Fit for purpose with conditions* – the model may be used provided that the conditions stated in the report are met;
(c) *Not fit for purpose* – the model shall not be used, or its continued use requires a decision of the approval authority under MRM-POL-001 with compensating measures.

10.3 The opinion is consistent with the severity of open findings as set out in MV-STD-002 §9.

10.4 Each condition specifies the required action or restriction, its owner and its deadline, and is measurable.

10.5 **Review and sign-off.** Each validation report is reviewed by a senior validator who was not part of the validation team. Reports on Tier 1 and Tier 2 models are signed off by the Head of Model Validation; reports on Tier 3 models by the responsible team lead. The report is submitted to the approval authority under MRM-POL-001 before the model approval decision.

10.6 The model owner provides a management response to each finding within 20 business days of the draft report.

## 11 Roles and responsibilities

- **Head of Model Validation** – owns this Standard, approves the validation plan for submission to the Model Risk Committee and signs off validation reports.
- **Validators** – perform validations in accordance with this Standard and document all work in a reproducible manner.
- **Model owner (1LoD)** – provides complete and timely access to data, code, documentation and developers, and responds to findings.
- **Model Risk Committee** – approves the validation plan and decides on escalated matters.
- **Internal Audit (3LoD)** – periodically reviews the effectiveness of the validation function.

## 12 Exceptions and dispensations

12.1 A deviation from this Standard requires a written dispensation approved by the Head of Model Validation, or by the Model Risk Committee for Tier 1 models. A dispensation is time-limited to a maximum of twelve months, states the compensating measures and is recorded in the model inventory.

12.2 A scope limitation imposed by lack of access to data, code or documentation is not a dispensation; it is recorded as a finding under MV-STD-002.

## 13 Related documents

- Regulation (EU) No 575/2013 (CRR), Articles 144 and 185
- EBA supervisory handbook on the validation of rating systems under the IRB approach
- ECB guide to internal models (general topics chapter)
- MRM-POL-001 Model Risk Management Policy
- MRM-STD-010 Model Inventory and Tiering Standard
- MRM-STD-021 Model Documentation Standard; MRM-STD-022 Data Quality Standard for Models; MRM-STD-023 Expert Judgement Standard
- MRM-STD-030 Model Implementation and Testing Standard; MRM-STD-040 Model Monitoring Standard; MRM-STD-050 Model Change and Regulatory Notification Standard
- MV-STD-002 Validation Findings and Rating Standard; MV-HB-003 Validation Testing Handbook; MV-STD-010 IRB Validation Standard; MV-STD-020 AI and ML Validation Standard
- MRM-GOV-001 Model Risk Committee – Terms of Reference

## 14 Document history

| Version | Date | Change |
|---|---|---|
| 3.0 | 2023-06 | Alignment with revised ECB guide to internal models; tier-based scope table introduced. |
| 3.1 | 2024-09 | Code-versus-documentation check extended to production code. |
| 4.0 | 2026-04 | Independent RDS replication made mandatory for all tiers at tier-dependent depth (§5.1); requirement library traceability added to report content (§10.1); alignment with MRM-POL-001 v5.0. |
