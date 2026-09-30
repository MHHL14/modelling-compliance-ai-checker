# Margin of Conservatism Standard

| | |
|---|---|
| **Reference** | CRM-STD-101 |
| **Version and date** | v2.0 (2025-11) |
| **Owner** | Model Risk Management (2LoD) |
| **Approval body** | Model Risk Committee |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose

1.1 This Standard specifies how deficiencies and uncertainty in the estimation of IRB risk parameters are identified, corrected where possible, quantified and reflected in a margin of conservatism (MoC). It implements CRR Article 179(1)(f), which requires institutions to add to their estimates a margin of conservatism related to the expected range of estimation errors, and section 4.4 of EBA/GL/2017/16.

1.2 The Standard ensures that the MoC is determined consistently across rating systems, is traceable to identified deficiencies, is supported by quantitative evidence and is reduced only when deficiencies have demonstrably been remedied.

## 2 Scope, applicability and definitions

2.1 The Standard applies to all PD, LGD, ELBE, LGD in-default and CCF estimates used for own funds requirements under the IRB approach and governed by CRM-STD-100. It applies to initial development, recalibration, the annual review of estimates and any model change.

2.2 The following definitions apply:

- **Best estimate** — the estimate of a risk parameter after appropriate adjustments and before MoC, downturn adjustment and regulatory floors.
- **Appropriate adjustment (AA)** — a correction of the estimate that removes an identified bias caused by a deficiency, where the deficiency can be corrected.
- **Deficiency** — any identified shortcoming in data, methods, processes or in the relevance of historical experience that may cause the estimate to deviate from the true value of the risk parameter.
- **MoC register** — the register, maintained per rating system, of all identified deficiencies with their category, quantification and remediation status.
- **Relative MoC** — MoC expressed as a percentage of the best estimate (for example +6% of PD). **Absolute MoC** — MoC expressed in percentage points of the parameter.
- **Calibration segment** — as defined in CRM-STD-100.

## 3 MoC framework and categories

3.1 The final risk parameter estimate shall consist of the best estimate, including any appropriate adjustments, plus the MoC. The MoC shall not be used to compensate for deficiencies that can be corrected through an appropriate adjustment.

3.2 **Category A — data and methodological deficiencies.** Category A covers the MoC related to identified deficiencies in data and methods, including missing, incomplete or approximated data; default flags approximated for periods before the current definition of default was implemented under CR-STD-110; missing information on probation or cures; inconsistent data after system migrations; exclusions with residual effect; missing collateral or recovery information; and methodological simplifications.

3.3 **Category B — relevant changes.** Category B covers the MoC related to relevant changes to underwriting standards, risk appetite, collection and recovery policies, the product mix, the legal environment or the economic environment that reduce the representativeness of historical data for the current and foreseeable portfolio.

3.4 **Category C — general estimation error.** Category C covers the MoC related to the general estimation error arising from the finite size and composition of the RDS and the statistical uncertainty of the estimation method.

3.5 Each identified deficiency shall be linked to exactly one category, A or B, and recorded in the MoC register with a unique identifier, a description, the affected parameters and calibration segments, and a reference to the related entry in the data deficiency log maintained under MRM-STD-022.

3.6 Each deficiency shall be quantified individually, as its effect on the risk parameter per calibration segment, before any aggregation within the category.

3.7 The quantification of each category A and category B deficiency shall be supported by a sensitivity analysis that re-estimates the parameter under plausible alternative treatments of the deficiency. The MoC for the deficiency shall not be lower than the adverse effect indicated by the sensitivity analysis unless a lower value is justified in the model documentation and approved by Model Risk Management.

3.8 For illustration: where the default flag for an early part of the observation period (for example 2012–2015) was approximated from arrears data, the deficiency is category A. Its MoC is quantified by re-calibrating the PD under alternative approximations (for example with and without reconstructed probation periods, or with different past-due thresholds) and taking the adverse effect on the LRA, expressed as a relative MoC.

## 4 Identification of deficiencies

4.1 Deficiencies shall be identified systematically at each development, recalibration and annual review, using the trigger list in Annex 1 of this Standard, which covers the RDS (completeness, approximations, exclusions, system changes, external data), the default definition, the estimation methods and changes in processes and environment.

4.2 Deficiencies identified by Model Validation, by model monitoring under MRM-STD-040, by Internal Audit or by the supervisor shall be assessed for their effect on the estimates and, where relevant, added to the MoC register within three months.

4.3 For each deficiency, the Model Owner shall first assess whether an appropriate adjustment can correct the bias. Where an appropriate adjustment is applied, the remaining uncertainty of the adjustment shall itself be assessed for MoC under category A.

4.4 The deficiency assessment, including deficiencies considered and rejected, shall be documented in the MoC section of the model development document (MDD) in accordance with MRM-STD-021.

## 5 Quantification

5.1 The MoC shall be quantified at least at the level of each category and each calibration segment. For PD, the MoC may alternatively be quantified per grade.

5.2 Permitted quantification methods are, in order of preference: (a) re-estimation under alternative assumptions (sensitivity analysis); (b) bootstrap or scenario analysis; (c) benchmarking against comparable internal or external data; and (d) expert judgement. Expert judgement shall be used only where methods (a) to (c) are not feasible and shall be documented and approved in accordance with MRM-STD-023.

5.3 The sensitivity analysis shall define the plausible range of each alternative treatment, report the parameter under each treatment, and document the selection of the value within the range.

5.4 The MoC for each deficiency shall be non-negative. A deficiency whose effect lowers the estimate shall not reduce the MoC of other deficiencies.

5.5 Category C MoC for PD shall be at least the difference between the upper bound of a one-sided 90% confidence interval of the LRA default rate and the LRA default rate per calibration segment, taking into account the autocorrelation of yearly default rates. For LGD and CCF, category C MoC shall be at least the difference between the 90th percentile of the bootstrapped distribution of the long-run average and the long-run average.

5.6 The MoC shall be expressed as a relative MoC for PD and as either relative or absolute MoC for LGD and CCF, consistently within a rating system.

## 6 Application and aggregation

6.1 The total MoC per calibration segment shall be the simple sum of the category A, B and C MoCs. Diversification between categories or between deficiencies is not permitted.

6.2 For PD, the MoC shall be applied to the calibrated best estimate before the regulatory floor. For LGD and CCF, the order in which appropriate adjustments, MoC and downturn adjustment are applied shall be documented and applied consistently between development and production.

6.3 The application of MoC shall preserve the rank ordering of grades; PDs after MoC shall increase monotonically with grade.

6.4 The MoC shall be included in all risk parameters used for own funds requirements. Where IRB parameters are used for internal purposes that require unbiased estimates, such as IFRS 9 under FIN-STD-200, the MoC shall be removed and the removal documented.

6.5 The effect of the MoC on risk-weighted exposure amounts shall be reported per category and per rating system.

## 7 Remediation

7.1 Each category A deficiency shall have a remediation plan with an owner and a target date, unless the deficiency is documented as permanent (for example historical data that cannot be recovered). Permanent deficiencies shall be reassessed at each annual review.

7.2 Where the total MoC of a rating system exceeds 20% of the best estimate for PD, or 5 percentage points for LGD or CCF, the Model Owner shall present to the Model Risk Committee an assessment of whether the rating system requires redevelopment.

7.3 An MoC component may be reduced or removed only after the remediation of the underlying deficiency has been implemented and confirmed by Model Validation.

## 8 MoC monitoring and reporting

8.1 The MoC shall be reviewed at least annually as part of the annual review of estimates under CRM-STD-100 section 13, including the continued relevance of each deficiency and the adequacy of its quantification.

8.2 The MoC register shall be kept up to date and shall record, per deficiency, the category, the quantification method, the MoC value, the calibration segments affected and the remediation status.

8.3 Model Risk Management shall report quarterly to the Model Risk Committee on the level and evolution of MoC per rating system and category, and on the progress of remediation plans.

8.4 Changes in the MoC shall be classified as model changes in accordance with MRM-STD-050 and Commission Delegated Regulation (EU) No 529/2014.

8.5 Model Validation shall assess the adequacy of the MoC, including an independent sensitivity analysis of material category A deficiencies, in accordance with MV-STD-010.

## 9 Roles and responsibilities

9.1 **Model Owners and Credit Risk Modelling (1LoD)** identify deficiencies, propose appropriate adjustments, quantify the MoC and maintain the MoC register.
9.2 **Model Risk Management (2LoD)** owns this Standard, approves expert-judgement-based MoC and deviations under 3.7, and reports on MoC.
9.3 **Model Validation (2LoD)** independently assesses the identification and quantification of deficiencies and the adequacy of the MoC.
9.4 The **Model Risk Committee** approves the MoC as part of model approval and decides on redevelopment under 7.2.

## 10 Exceptions and dispensations

10.1 Deviations from this Standard require a dispensation from the Model Risk Committee, time-bound to a maximum of 12 months and recorded in the MRM dispensation register. No dispensation may be granted that results in the omission of a MoC for an identified deficiency.

## 11 Related documents

- Regulation (EU) No 575/2013 (CRR), Article 179(1)(f); EBA/GL/2017/16 section 4.4; ECB guide to internal models
- CRM-STD-100 IRB Rating System Standard; CR-STD-110 Definition of Default Standard
- MRM-POL-001; MRM-STD-021 Model Documentation Standard; MRM-STD-022 Data Quality Standard for Models; MRM-STD-023 Expert Judgement Standard; MRM-STD-040 Model Monitoring Standard; MRM-STD-050 Model Change and Regulatory Notification Standard
- MV-STD-010 IRB Validation Standard; FIN-STD-200 IFRS 9 ECL Methodology Standard

## 12 Document history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2021-01 | First version implementing EBA/GL/2017/16 section 4.4. |
| 1.1 | 2023-04 | Category C method for PD specified; MoC register introduced. |
| 2.0 | 2025-11 | Mandatory sensitivity analysis for each category A and B deficiency (3.7); link to the data deficiency log of MRM-STD-022; redevelopment trigger (7.2); quarterly reporting. |

## Annex 1 Trigger list for the identification of deficiencies

| Area | Triggers to be assessed | Typical category |
|---|---|---|
| RDS completeness | Missing periods, portfolios or variables; imputed values above 10% of a model variable; exclusions with residual effect on the LRA | A |
| Default definition | Default flag approximated for historical periods; probation periods or multiple defaults not reconstructable; changes in materiality thresholds | A |
| Loss and exposure data | Incomplete recovery processes; missing cost allocation; missing collateral values or valuation dates; missing limit history for CCF | A |
| Methods | Simplified treatment of incomplete workouts; approximations in the LRA calculation; low number of defaults in a calibration segment | A |
| Systems and processes | Migration of source systems; changes in data capture or collection processes during the observation period | A |
| Underwriting and policies | Changes in acceptance criteria, cut-offs, affordability rules, collection and recovery strategies | B |
| Environment | Changes in legal framework (for example insolvency law), market conditions or product mix not reflected in the RDS | B |
| Estimation error | Size of the RDS and number of defaults per calibration segment; volatility of yearly default rates | C |
