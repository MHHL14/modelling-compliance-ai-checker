# Model Implementation and Testing Standard

| | |
|---|---|
| **Reference** | MRM-STD-030 |
| **Version and date** | v2.0 (2025-03) |
| **Owner** | Model Risk Management (2LoD) |
| **Approval body** | Model Risk Committee |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose

1.1 A model that is correctly developed and validated can still produce wrong results if it is implemented incorrectly. This Standard sets the minimum requirements for translating an approved model into a production environment, testing the implementation, and controlling the model once it is in production, so that the model used in practice is the model that was developed, documented, validated and approved.

1.2 The Standard implements the implementation and use requirements of the Model Risk Management Policy (MRM-POL-001) and supports compliance with CRR Article 174 (use of models) and Article 185 (validation of internal estimates), with the ECB guide to internal models (general topics on model implementation and IT systems) and with BCBS 239 principle 3 (accuracy and integrity of risk data).

## 2 Scope and applicability

2.1 The Standard applies to every first implementation of a model in the Model Inventory (MRM-STD-010), to every re-implementation (for example migration to a new platform) and to every model change that alters code, parameters or input data flows, as classified under MRM-STD-050.

2.2 It covers all implementation forms: core banking and rating systems, calculation engines, vendor platforms, scripts scheduled in production, and end-user computing tools used to produce model outputs.

2.3 Requirements are proportionate to model tier. Where a provision differs by tier, this is stated explicitly.

## 3 Definitions

**Development code:** the code used by the model developer to build and estimate the model and to produce the outputs reported in the model development document (MDD).

**Production code:** the code, configuration and parameter tables that compute model outputs in the production environment.

**Implementation specification:** the document specifying precisely what the production code shall compute (section 4).

**Independent implementation testing:** testing of the production implementation by a person or team not involved in writing the production code (section 6).

**Parallel run:** the operation of the new or changed implementation alongside the existing process, on live data, without its outputs being used for decisions (section 7).

**Reconciliation:** the record-level comparison of outputs of the production implementation with outputs of the development code on identical input data (section 8).

**User acceptance testing (UAT):** testing by the model users and Model Owner to confirm that the implemented model is fit for its intended business use (section 9).

## 4 Implementation specification

4.1 Before implementation starts, the model developer shall prepare an implementation specification, approved by the Model Owner, that is consistent with the approved MDD.

4.2 The implementation specification shall define, for every input variable, its source field in production and its lineage in accordance with DATA-POL-001 §5, and shall identify any difference between the development data source and the production data source.

4.3 The implementation specification shall define every transformation, binning, missing value and outlier treatment, formula, coefficient, lookup table, rating scale mapping, floor, cap and override rule, with numerical precision and rounding conventions.

4.4 The implementation specification shall include a set of test cases with expected outputs, produced with the development code, covering typical cases, boundary values, missing and invalid inputs and every segment and rating grade.

## 5 Code management and version control

5.1 Development code and production code shall be held in a version control system approved by Group IT. Every version used to produce reported or production outputs shall be tagged and retrievable.

5.2 The version of the development code, the RDS version and the parameter set that produced the results in the MDD shall be recorded in the MDD, so that the results can be reproduced.

5.3 Changes to production code shall follow the Bank change management process, including four-eyes code review by a person other than the author and documented approval before deployment.

5.4 Parameter tables (coefficients, scorecard points, calibration mappings, master scale) shall be treated as code: they shall be version controlled, access restricted and changed only through the change management process.

5.5 Access to production code and parameters shall be restricted to authorised personnel. Model developers shall not have write access to the production environment.

## 6 Independent implementation testing

6.1 Every implementation shall be tested before go-live by a tester independent of the person or team that wrote the production code. For Tier 1 models, the tester shall also be independent of the model development team.

6.2 Testing shall include, at a minimum: execution of all test cases in the implementation specification; verification of input data mapping and transformations; verification of the handling of missing, invalid and boundary values; and verification of outputs for every segment.

6.3 The test plan, test cases, results, identified defects and their resolution shall be documented in a test report. All defects affecting model outputs shall be resolved and retested before go-live.

6.4 Model Validation shall review the test report for Tier 1 and Tier 2 models as part of the pre-implementation validation under MV-STD-001, and may perform its own replication tests.

## 7 Parallel runs

7.1 A parallel run shall be performed before a new or materially changed Tier 1 model, and any IRB model, is used for decisions or regulatory reporting. For Tier 2 models a parallel run is required where the change alters input data flows or production platforms.

7.2 The parallel run shall cover at least one full production cycle and at least three monthly reference dates for Tier 1 models, and at least one monthly reference date for Tier 2 models.

7.3 The results of the parallel run shall be analysed, including the migration between old and new outputs (for example rating grade migration matrices), the impact on key risk measures (for example RWA, expected loss, ECL) and any operational issues. The analysis shall be documented and provided to Model Validation.

## 8 Reconciliation of production output with development

8.1 Before go-live, the outputs of the production implementation shall be reconciled at record level with the outputs of the development code on an identical input data set, covering at least the full RDS or a representative sample of at least 10,000 records per segment where the RDS is larger.

8.2 Reconciliation tolerances shall be defined in advance. Unless otherwise justified: continuous outputs (for example PD, LGD, CCF, scores) shall agree within an absolute difference of 10⁻⁶ or a relative difference of 0.01%; categorical outputs (for example rating grade, segment, pool) shall agree for 100% of records.

8.3 All differences outside tolerance shall be investigated and explained. Unexplained differences shall block go-live.

8.4 The lineage of development data and of production input data shall be compared, and the effect of any difference in source or transformation on model outputs shall be quantified.

8.5 Reconciliation between production outputs and the downstream systems that consume them (for example capital calculation, ECL engine, credit decision systems) shall be performed at go-live and at least annually thereafter.

## 9 User acceptance

9.1 UAT shall be performed by representatives of the model users, coordinated by the Model Owner, to confirm that the implemented model supports the intended use, that outputs are presented correctly and that operational processes (including overrides under MRM-STD-023) function as designed.

9.2 UAT results shall be documented and signed off by the Model Owner and the head of the principal user function before go-live.

## 10 Go-live approval and production controls

10.1 A model shall only be used in production after the implementation test report, reconciliation results, parallel run analysis (where required) and UAT sign-off have been completed and the model has been approved for use in accordance with MRM-POL-001.

10.2 Production controls shall include: completeness and validity checks on input data applying the DQ rules of MRM-STD-022; controls that each run uses the approved code and parameter version; logging of every run with its reference date, input data version and code version; and exception reporting for failed or incomplete runs.

10.3 Manual reruns, manual output adjustments and fallback procedures shall be documented, authorised and logged. Adjustments of outputs outside the model are overlays or overrides and are governed by MRM-STD-023.

10.4 Model outputs used for regulatory reporting shall be retained, together with the input data and code version used to produce them, for the retention period in DATA-POL-001 §10.

## 11 Consistency between code and documentation

11.1 The production code shall be consistent with the MDD and the implementation specification at all times. Any difference shall be treated as a defect or submitted as a model change under MRM-STD-050.

11.2 The Model Owner shall confirm consistency between the production code, the implementation specification and the MDD after each change and at least annually as part of the annual model review under MRM-STD-040.

11.3 Model Validation shall verify code-versus-documentation consistency for Tier 1 models at each full validation, including by independent replication of model outputs on a sample.

## 12 Roles and responsibilities

12.1 **Model developers:** prepare the implementation specification and test cases and support reconciliation.

12.2 **IT and implementation teams:** build the production implementation, operate version control and production controls.

12.3 **Independent testers:** perform independent implementation testing under section 6.

12.4 **Model Owners:** approve the implementation specification, coordinate UAT, sign off go-live readiness and confirm code-versus-documentation consistency.

12.5 **Model Validation:** reviews test and reconciliation results before go-live and verifies implementation at each validation.

12.6 **Model Risk Management:** maintains this Standard and grants dispensations.

## 13 Exceptions and dispensations

13.1 Deviations from this Standard require a dispensation approved by the Head of Model Risk Management in accordance with MRM-POL-001, stating compensating controls and a maximum duration of six months for Tier 1 models and twelve months for other models. Dispensations for Tier 1 models are reported to the Model Risk Committee.

13.2 In an emergency (for example correction of a production error), a change may be deployed before completion of all tests with the approval of the Model Owner and Model Risk Management, provided that the outstanding tests are completed within 30 calendar days.

## 14 Related documents

- Regulation (EU) No 575/2013 (CRR), Articles 174 and 185
- ECB guide to internal models, General topics (model implementation and IT systems)
- BCBS 239, principle 3
- MRM-POL-001 Model Risk Management Policy
- MRM-STD-010 Model Inventory and Tiering Standard
- MRM-STD-020 Model Development Standard
- MRM-STD-021 Model Documentation Standard
- MRM-STD-022 Data Quality Standard for Models
- MRM-STD-023 Expert Judgement Standard
- MRM-STD-040 Model Monitoring Standard
- MRM-STD-050 Model Change and Regulatory Notification Standard
- DATA-POL-001 Data Management and Governance Policy
- MV-STD-001 Model Validation Standard

## 15 Document history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2018-05 | First issue. |
| 1.1 | 2021-01 | Independent testing and UAT sign-off requirements added. |
| 2.0 | 2025-03 | Full revision: implementation specification, quantitative reconciliation tolerances, parallel run durations and code-versus-documentation consistency. |
