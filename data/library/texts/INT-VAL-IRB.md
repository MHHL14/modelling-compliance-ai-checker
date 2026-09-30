# IRB Validation Standard (incl. ECB validation reporting)

| | |
|---|---|
| **Title** | IRB Validation Standard (incl. ECB validation reporting) |
| **Reference** | MV-STD-010 |
| **Version and date** | v3.0 (2026-05) |
| **Owner** | Model Validation (2LoD) – Head of Model Validation |
| **Approval body** | Model Risk Committee |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose, scope and definitions

1.1 **Purpose.** This Standard sets the additional requirements for the validation of rating systems under the internal ratings-based (IRB) approach. It supplements MV-STD-001 and implements CRR Art. 185, the EBA supervisory handbook on the validation of rating systems under the IRB approach, the ECB guide to internal models (credit risk and general topics chapters) and the ECB instructions for reporting the validation results of internal models.

1.2 **Scope.** The Standard applies to all PD, LGD and EAD/CCF models of IRB rating systems approved or submitted for approval, including slotting approaches, and to the rating processes, data and IT implementation that form part of the rating system in the sense of CRR Art. 142(1)(1).

1.3 **Definitions.**
- **Rating system** – all methods, processes, controls, data collection and IT systems that support the assessment of credit risk, the assignment of exposures to grades or pools and the quantification of default and loss estimates.
- **Annual validation** – the validation of each IRB rating system performed every year under §2.2.
- **Full-scope validation** – a validation covering all areas of MV-STD-001 §§5–9 and all sections of this Standard.
- **MoC** – margin of conservatism under the EBA Guidelines on PD estimation, LGD estimation and the treatment of defaulted exposures (EBA/GL/2017/16) and CRM-STD-101.
- **ELBE** – best estimate of expected loss for defaulted exposures.

1.4 IRB models are Tier 1 or Tier 2 under MRM-STD-010; the minimum scope of MV-STD-001 §4.5 applies in addition to this Standard.

## 2 IRB validation framework

2.1 **Initial validation.** MV performs a full-scope validation of a new rating system, and of a material model change under Commission Delegated Regulation (EU) No 529/2014 and MRM-STD-050, before the application for supervisory approval is submitted.

2.2 **Annual validation.** MV validates each IRB rating system at least annually. The annual validation covers at least: back-testing under §5, benchmarking under §6, representativeness under MV-HB-003 §6, data quality, the review of estimates by the model owner, changes since the last validation, the use test and override analysis, and the follow-up of open findings.

2.3 **Full-scope cycle.** In addition to the annual validation, MV performs a full-scope validation of each rating system at least every three years and after each material change.

2.4 **Rating process.** MV assesses the rating assignment process, including the timeliness of rating updates, the share of obligors with outdated ratings and the frequency and justification of overrides.

2.5 **Reference dates.** The annual validation uses a reference date of 31 December; the report is finalised by 30 June of the following year.

2.6 **Use test.** MV verifies that the IRB risk parameters are used in credit approval, pricing, limit setting, risk appetite and internal capital allocation as required by CRR Art. 144(1)(b), and that any difference between the regulatory parameters and the parameters used internally is documented and justified.

## 3 Data and definition of default

3.1 **Observation period.** MV verifies that the historical observation periods used for estimation meet the minimum lengths of CRR Articles 180 to 182 for the relevant parameter and exposure class.

3.2 **Default definition compliance.** MV assesses whether the definition of default applied in the RDS and in production complies with CRR Art. 178, the EBA Guidelines on the application of the definition of default (EBA/GL/2016/07), Commission Delegated Regulation (EU) 2018/171 on the materiality threshold, and CR-STD-110.

3.3 **Historical adjustments.** Where the definition of default changed during the observation period, MV assesses the adjustments or approximations applied to historical data and whether residual deficiencies are identified for MoC under §4.

3.4 **Default flag code-versus-documentation check.** MV verifies, by independent code review and re-performance on the replicated RDS, that the default flag implemented in code matches the documented definition of default. The check covers at least the days-past-due counting, the absolute and relative materiality thresholds, the unlikeliness-to-pay triggers, the probation and cure periods and the contagion rules, in both the RDS build code and the production code.

3.5 MV assesses the quality of IRB data against MRM-STD-022, with specific attention to the completeness of default and recovery data and the accuracy of the loss components (recoveries, costs, discounting).

3.6 **Pooled and external data.** Where the RDS combines data from several sources, legal entities or external data pools, MV verifies that the definition of default is applied consistently across sources, or that differences are adjusted for and covered by MoC under §4.

## 4 Margin of conservatism

4.1 MV reviews whether the model owner has identified all relevant deficiencies and assigned them to the categories of CRM-STD-101: category A (data and methodological deficiencies), category B (relevant changes to underwriting standards, risk appetite, collection policies or other sources of additional uncertainty) and category C (general estimation error).

4.2 **Sensitivity support for MoC.** MV verifies that the MoC for each identified data deficiency is supported by a sensitivity analysis that quantifies the effect of the deficiency on the risk parameter. MV performs its own sensitivity analysis; where MV's estimate of the effect exceeds the applied MoC, a finding is raised.

4.3 MV verifies that the MoC for general estimation error (category C) is quantified from the estimation uncertainty of the calibration, such as confidence intervals or bootstrap distributions.

4.4 MV verifies that the MoC is not used to compensate for deficiencies that can be remediated, and that each deficiency under category A or B has a remediation plan.

4.5 MV reports the total MoC per parameter and its change compared with the previous validation, and analyses material increases.

## 5 Back-testing

5.1 **PD.** MV back-tests PD estimates annually per grade and at portfolio level against one-year observed default rates and the long-run average, using the binomial and Jeffreys tests of MV-HB-003 §7, in line with CRR Art. 185(b).

5.2 **LGD.** MV back-tests LGD, downturn LGD, ELBE and LGD in-default under MV-HB-003 §9.

5.3 **CCF.** MV back-tests CCF and EAD estimates under MV-HB-003 §10.

5.4 MV assesses discriminatory power and stability of each model under MV-HB-003 §§5 and 8.

5.5 Where realised values deviate from estimates beyond the red thresholds of MV-HB-003, MV analyses the reasons and assesses whether recalibration or a model change is required; the conclusion is documented in the validation report.

5.6 MV applies back-testing methods consistently across validation cycles, as required by CRR Art. 185. A change of method is justified in the validation report, and the result under the previous method is reported in parallel for at least one cycle.

## 6 Benchmarking and review of estimates

6.1 MV compares the risk parameters with relevant external data sources and benchmarks, such as external ratings, pooled data and the results of the supervisory benchmarking exercise under CRD Art. 78, in line with CRR Art. 185(c).

6.2 For Tier 1 IRB models MV develops or maintains an independent challenger model or recalibration and explains material differences in the validation report.

6.3 MV assesses the annual review of estimates by the model owner required by CRR Art. 179(1)(c) and CRM-STD-100, including the inclusion of the most recent data in the calibration sample and the documented conclusion on the need for recalibration.

## 7 ECB validation reporting

7.1 MV prepares the annual validation results for all PD, LGD and CCF models in the scope of the ECB request, using the templates and test specifications of the ECB instructions for reporting the validation results of internal models.

7.2 MV reconciles the data used for the ECB templates with the data used in the internal validation and with the exposures reported in COREP; reconciliation differences are documented.

7.3 The templates are subject to four-eyes review within MV, signed off by the Head of Model Validation and submitted through Supervisory Relations within the deadline set by the ECB.

7.4 Differences between internal test results and ECB template results, for example due to different sample definitions, are explained in the internal validation report.

7.5 Each red result in the ECB templates is addressed in the internal validation report by a finding under MV-STD-002 or by a documented justification.

7.6 MV retains the submitted templates, the underlying data extracts and the code used to produce them for at least five years after submission, so that the results can be reproduced on supervisory request.

## 8 Validation report and management reporting

8.1 The IRB validation report contains, in addition to MV-STD-001 §10.1, a compliance overview mapping the rating system to the applicable CRR articles and library requirements, the ECB template results and the MoC review of §4.

8.2 MV presents an annual summary of IRB validation results, open findings and opinions to the Model Risk Committee and, through the Chief Risk Officer, to the management body, in support of CRR Art. 189.

## 9 Roles and responsibilities

- **Head of Model Validation** – owns this Standard and signs off IRB validation reports and ECB validation templates.
- **Validators (Credit Risk)** – perform IRB validations and prepare the ECB templates.
- **Model owner (1LoD)** – provides data, documentation, code and the annual review of estimates; remediates findings.
- **Supervisory Relations** – submits the validation templates to the ECB.
- **Internal Audit (3LoD)** – reviews the rating system and the validation function at least annually, as required by CRR Art. 191.

## 10 Exceptions and dispensations

10.1 Deviations from this Standard require a dispensation approved by the Model Risk Committee and are reported in the IRB validation summary. A dispensation cannot waive requirements derived from the CRR or from the ECB validation reporting instructions.

## 11 Related documents

- Regulation (EU) No 575/2013 (CRR), Articles 142, 144, 178–182, 185, 189 and 191; Directive 2013/36/EU (CRD), Article 78
- Commission Delegated Regulation (EU) No 529/2014; Commission Delegated Regulation (EU) 2018/171
- EBA/GL/2016/07; EBA/GL/2017/16; EBA supervisory handbook on the validation of rating systems under the IRB approach
- ECB guide to internal models; ECB instructions for reporting the validation results of internal models
- MRM-POL-001; MRM-STD-022; MRM-STD-050; CRM-STD-100 IRB Rating System Standard; CRM-STD-101 Margin of Conservatism Standard; CR-STD-110 Definition of Default Standard
- MV-STD-001; MV-STD-002; MV-HB-003

## 12 Document history

| Version | Date | Change |
|---|---|---|
| 2.0 | 2023-05 | ECB validation reporting chapter added. |
| 2.1 | 2024-11 | Default flag code-versus-documentation check extended to production code. |
| 3.0 | 2026-05 | MoC review restructured in line with CRM-STD-101 v2.0; independent MV sensitivity analysis for data-deficiency MoC (§4.2); three-year full-scope cycle. |
