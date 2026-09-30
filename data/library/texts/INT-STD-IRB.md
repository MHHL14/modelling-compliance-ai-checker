# IRB Rating System Standard (PD, LGD, EAD/CCF estimation)

| | |
|---|---|
| **Reference** | CRM-STD-100 |
| **Version and date** | v5.2 (2026-03) |
| **Owner** | Credit Risk Modelling (1LoD), co-owned by Model Risk Management |
| **Approval body** | Model Risk Committee |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose

1.1 This Standard sets the Bank's requirements for the design, estimation, calibration, implementation, use and review of rating systems and risk parameters under the Internal Ratings-Based (IRB) approach. It translates Regulation (EU) No 575/2013 as amended by Regulation (EU) 2024/1623 (CRR), in particular Articles 144 and 169 to 191, EBA/GL/2017/16, EBA/GL/2019/03, Commission Delegated Regulation (EU) 2021/930 and the ECB guide to internal models into binding internal rules.

1.2 The Standard supplements the Model Development Standard (MRM-STD-020) and the Model Documentation Standard (MRM-STD-021) with IRB-specific requirements. Where this Standard is stricter, it prevails.

## 2 Scope and applicability

2.1 The Standard applies to all rating systems and risk-parameter models used, or intended to be used, for the calculation of own funds requirements under the IRB approach: PD models for retail and non-retail exposure classes, LGD models (performing and in-default, including ELBE), and EAD/CCF models.

2.2 Own estimates of LGD and conversion factors shall be used only for exposure classes and facility types for which CRR, as amended by Regulation (EU) 2024/1623, permits them. Exposures to large corporates and financial sector entities are treated under the foundation approach.

2.3 The margin of conservatism is governed by CRM-STD-101 and the definition of default by CR-STD-110. Both are integral to compliance with this Standard.

## 3 Definitions

- **Rating system** — all methods, processes, controls, data collection and IT systems that support the assessment of credit risk, the assignment of exposures to grades or pools and the quantification of default and loss estimates (CRR Article 142(1)(1)).
- **Reference data set (RDS)** — the data set used for development, calibration and testing of a model, documented in accordance with the RDS template of MRM-STD-021.
- **Calibration segment** — a uniquely identified subset of the application portfolio for which a single PD, LGD or CCF calibration is performed.
- **One-year default rate** — the number of obligors (or facilities, where applicable) defaulting within one year of a reference date divided by the number of non-defaulted obligors at that reference date.
- **Long-run average (LRA) default rate** — the arithmetic average of one-year default rates over the observation period.
- **Rating philosophy** — the extent to which grade assignment reflects current conditions (point-in-time) or conditions over an economic cycle (through-the-cycle).
- **Best estimate** — the risk parameter estimate before margin of conservatism, downturn adjustment and regulatory floors.
- **Input floor** — the minimum value of PD, LGD or EAD prescribed by the CRR for the calculation of risk-weighted exposure amounts.

## 4 Rating system design and rating philosophy

4.1 Each rating system shall document its rating philosophy, including the risk drivers that make grade assignment sensitive to current conditions, and the expected dynamics of grade migration and grade-level default rates over the economic cycle.

4.2 The Bank standard is a hybrid philosophy: grade assignment may respond to changes in obligor-specific and current economic conditions, while PDs per grade are calibrated to the long-run average default rate. A deviation from this philosophy requires Model Risk Committee approval.

4.3 Each rating system shall consist of clearly separated components: (a) the risk differentiation function (score or rating model); (b) the assignment to grades or pools; (c) the calibration; (d) the margin of conservatism; (e) the application of regulatory floors; and (f) the override process.

4.4 Non-retail PD shall be assigned at obligor level. Retail PD may be assigned to pools of exposures that share homogeneous risk characteristics, in accordance with CRR Article 170(3).

4.5 A change of rating philosophy is a change to the rating system and shall be classified under MRM-STD-050 and Commission Delegated Regulation (EU) No 529/2014.

## 5 Master scale

5.1 Non-retail PD rating systems shall map to the Bank master scale of 20 non-defaulted grades and one default grade, exceeding the minimum of seven non-defaulted grades required by CRR Article 170(1)(b).

5.2 Retail PD rating systems shall map to the retail master scale of 12 non-defaulted grades (R01–R12) and one default grade (RD), with the following PD boundaries:

| Grade | PD from (incl.) | PD to (excl.) | Grade | PD from (incl.) | PD to (excl.) |
|---|---|---|---|---|---|
| R01 | 0.00% | 0.10% | R07 | 1.75% | 3.00% |
| R02 | 0.10% | 0.20% | R08 | 3.00% | 5.50% |
| R03 | 0.20% | 0.35% | R09 | 5.50% | 10.00% |
| R04 | 0.35% | 0.60% | R10 | 10.00% | 20.00% |
| R05 | 0.60% | 1.00% | R11 | 20.00% | 35.00% |
| R06 | 1.00% | 1.75% | R12 | 35.00% | 100.00% |

5.3 Each grade or pool of a rating system shall map to exactly one master scale grade, and PDs shall increase monotonically with grade.

5.4 No single non-defaulted grade shall contain more than 30% of the obligors (non-retail) or exposures (retail) of the rating system, unless the concentration is justified by evidence of homogeneous risk and approved by Model Risk Management (CRR Article 170(1)(d)).

5.5 Changes to the master scales require approval by the Model Risk Committee.

## 6 Reference data set construction

6.1 Each model shall have an RDS documented in accordance with the RDS template of MRM-STD-021, specifying the data sources, the observation period, the sampling, the default and loss definitions and all exclusions.

6.2 The observation period shall cover at least: five years for retail PD (CRR Article 180(2)(e)) and non-retail PD (CRR Article 180(1)(h)); five years for retail LGD (CRR Article 181(2)); seven years for non-retail LGD (CRR Article 181(1)(j)); five years for retail CCF and seven years for non-retail CCF (CRR Article 182). Where relevant data covering a longer period is available, the longer period shall be used.

6.3 The observation period used for the long-run average shall contain a representative mix of good and bad years, including at least one period of economic downturn. The choice of the window, and the downturn period it contains, shall be justified in the RDS documentation.

6.4 Every exclusion from the RDS shall be approved by the Model Owner. The aggregate effect of all exclusions on the long-run average default rate, or on the average realised LGD or CCF, shall be quantified and reported.

6.5 The representativeness of the RDS for the current application portfolio shall be demonstrated on the distribution of risk drivers and on the level of default rates (CRR Article 179(1)(d)). A PSI above 0.10 on a risk driver is amber and requires explanation; a PSI above 0.25 is red and requires an assessment of the effect on the estimates.

6.6 The default flag in the RDS shall be constructed in accordance with CR-STD-110. Where the default flag for historical periods is approximated, the approximation shall be documented, its effect quantified and the resulting deficiency linked to a MoC category under CRM-STD-101.

6.7 Data quality shall be assessed in accordance with MRM-STD-022, and lineage from source systems to the RDS shall be documented in accordance with DATA-POL-001.

6.8 The RDS shall be built by versioned code such that it can be reproduced in full by Model Validation.

6.9 External or pooled data may be used only where its comparability with the Bank's portfolio and default definition is demonstrated, including an analysis of differences in the default definition.

## 7 Risk differentiation

7.1 The long list of candidate risk drivers shall combine statistical analysis and expert input and shall cover all material drivers of the risk parameter, in accordance with CRR Article 179(1)(a). The expected direction of the effect of each driver shall be stated and confirmed in the final model.

7.2 Discriminatory power shall be measured by the area under the ROC curve (or Gini coefficient) on the development sample and on an out-of-time sample, and assessed against the thresholds of the Validation Testing Handbook (MV-HB-003).

7.3 The homogeneity of exposures within grades and the heterogeneity between adjacent grades shall be tested, and grades that are not statistically distinct shall be merged or justified.

7.4 Human judgement in the risk differentiation (qualitative modules, notching rules) shall be documented and approved in accordance with MRM-STD-023.

7.5 Machine learning techniques shall comply with AI-STD-700. The contribution of each risk driver to the outcome shall be explainable at portfolio and individual level.

7.6 Protected attributes shall not be used and proxy variables shall be screened in accordance with CR-POL-001 section 9.

## 8 PD calibration

8.1 PD estimates shall be calibrated per calibration segment to the long-run average of one-year default rates, in accordance with CRR Article 180(1)(a) and (2)(a) and EBA/GL/2017/16.

8.2 One-year default rates shall be calculated at least quarterly, using overlapping one-year windows. The LRA shall be the arithmetic average of these rates over the observation period.

8.3 Where the observation period is not representative of the likely range of variability of default rates, the LRA shall be adjusted upward, and the adjustment documented and justified.

8.4 Calibration shall be tested per grade and for the portfolio using a binomial or Jeffreys test, with results assessed against the thresholds of MV-HB-003.

8.5 The final PD shall be the calibrated best estimate increased by the MoC determined under CRM-STD-101 and subject to the floors in section 11.

## 9 LGD estimation

9.1 LGD shall be estimated from realised LGDs of all defaults in the RDS, including defaults with incomplete recovery processes, for which future recoveries shall be estimated in accordance with EBA/GL/2017/16.

9.2 Realised LGD shall reflect economic loss, including material direct and indirect costs and additional drawings after default. Recoveries and costs shall be discounted to the default date using the primary interbank rate at the time of default plus an add-on of five percentage points.

9.3 The long-run average LGD shall be calculated as the default-weighted average of realised LGDs over the observation period.

9.4 A maximum recovery period shall be defined per portfolio on the basis of observed workout durations. Cures shall be defined consistently with the return to non-default status under CR-STD-110.

9.5 The effect of collateral shall be reflected through collateral values, haircuts and time to realisation, recognised in accordance with EBA/GL/2020/05.

9.6 LGD shall reflect economic downturn conditions in accordance with EBA/GL/2019/03 and Commission Delegated Regulation (EU) 2021/930. The downturn period shall be identified from the economic factors specified in that Regulation, and the downturn LGD estimate shall be documented per calibration segment.

9.7 Where neither observed nor estimated downturn impact can be derived, the downturn LGD shall be set at the long-run average LGD plus 15 percentage points, capped at 105%, as provided in EBA/GL/2019/03.

9.8 For defaulted exposures, ELBE and LGD in-default shall be estimated per reference date in default in accordance with EBA/GL/2017/16 chapter 7; the difference between LGD in-default and ELBE shall reflect unexpected loss during the recovery period.

## 10 EAD and CCF estimation

10.1 Own estimates of conversion factors shall be used only for revolving commitments for which CRR Article 166 permits them.

10.2 Realised CCFs shall be calculated using a fixed horizon of 12 months prior to the default date. Additional drawings after default shall be included in LGD, not in CCF.

10.3 The long-run average CCF shall be calculated as the default-weighted average of realised CCFs. Final CCF estimates shall not be negative.

10.4 CCF estimates shall reflect economic downturn conditions in accordance with EBA/GL/2019/03.

## 11 Input floors

11.1 The PD applied to each exposure shall be at least 0.05%, and at least 0.10% for qualifying revolving retail exposures to revolvers, in accordance with CRR Articles 160(1) and 163(1).

11.2 The LGD applied to retail exposures shall be at least the input floors of CRR Article 164(4), in particular 5% for exposures secured by residential property, 50% for qualifying revolving retail exposures and 30% for other unsecured retail exposures.

11.3 The LGD applied to non-retail exposures with own LGD estimates shall be at least the input floors of CRR Article 161(5), in particular 25% for unsecured exposures.

11.4 EAD for exposures with own CCF estimates shall be at least the EAD input floor of CRR Article 166.

11.5 Floors shall be applied at exposure level after the MoC and the downturn adjustment. The share of exposures, and of EAD, to which a floor is binding shall be reported in the model documentation and in annual monitoring.

## 12 Use test and implementation

12.1 IRB ratings and risk parameters shall be used in credit approval, limit setting, risk-adjusted pricing, internal capital allocation and management reporting, in accordance with CRR Article 144(1)(b) and CR-POL-001 section 6.

12.2 Differences between the risk parameters used for own funds requirements and those used for internal purposes shall be documented and justified.

12.3 A new rating system shall have been in use, in a manner broadly consistent with the IRB requirements, for at least three years before it is used for own funds requirements, in accordance with CRR Article 145.

12.4 Implementation in production shall be tested in accordance with MRM-STD-030, including a reconciliation of production outputs with the development code.

## 13 Review of estimates and monitoring

13.1 Estimates shall be reviewed when new information comes to light and at least annually, in accordance with CRR Article 179(1). The annual review shall cover back-testing, representativeness, the need for recalibration and the adequacy of the MoC.

13.2 Model performance shall be monitored at least quarterly in accordance with MRM-STD-040, covering population stability, discriminatory power, calibration and override rates.

13.3 A red monitoring outcome, or an annual review concluding that estimates are no longer adequate, shall lead to a recalibration or redevelopment plan approved by the Model Risk Committee within three months.

13.4 Changes to rating systems shall be classified and notified in accordance with MRM-STD-050 and Commission Delegated Regulation (EU) No 529/2014.

13.5 Each rating system shall be validated independently at least annually in accordance with MV-STD-010 and CRR Article 185.

## 14 Roles and responsibilities

14.1 **Credit Risk Modelling (1LoD)** develops, calibrates, documents and monitors rating systems and performs the annual review of estimates.
14.2 **Model Owners** in Credit Risk Management are accountable for the rating system and its use.
14.3 **Model Risk Management (2LoD)** co-owns this Standard, maintains the MoC framework (CRM-STD-101) and oversees compliance.
14.4 **Model Validation (2LoD)** validates rating systems in accordance with MV-STD-010.
14.5 The **Model Risk Committee** approves rating systems, master scale changes and material changes.
14.6 **Internal Audit (3LoD)** reviews the rating systems at least annually, in accordance with CRR Article 191.

## 15 Exceptions and dispensations

15.1 Deviations from this Standard require a dispensation from the Model Risk Committee, time-bound to a maximum of 12 months and recorded in the MRM dispensation register. No dispensation may be granted from requirements that directly implement the CRR, including the minimum observation periods of 6.2 and the input floors of section 11.

## 16 Related documents

- Regulation (EU) No 575/2013 (CRR) as amended by Regulation (EU) 2024/1623, Articles 142–191
- Commission Delegated Regulations (EU) No 529/2014, 2018/171, 2021/930 and 2022/439
- EBA/GL/2016/07, EBA/GL/2017/16, EBA/GL/2019/03, EBA/GL/2020/05; ECB guide to internal models
- MRM-POL-001; MRM-STD-020; MRM-STD-021; MRM-STD-022; MRM-STD-023; MRM-STD-030; MRM-STD-040; MRM-STD-050
- CRM-STD-101 Margin of Conservatism Standard; CR-STD-110 Definition of Default Standard; CR-POL-001 Credit Risk Policy; FIN-STD-200 IFRS 9 ECL Methodology Standard; AI-STD-700 Machine Learning Model Standard; DATA-POL-001 Data Management and Governance Policy
- MV-STD-010 IRB Validation Standard; MV-HB-003 Validation Testing Handbook

## 17 Document history

| Version | Date | Change |
|---|---|---|
| 4.0 | 2021-01 | Implementation of EBA/GL/2016/07 and EBA/GL/2017/16; downturn LGD per EBA/GL/2019/03. |
| 5.0 | 2025-01 | CRR3 alignment: restriction of own LGD and CCF estimates, revised input floors, EAD floor. |
| 5.1 | 2025-06 | Retail master scale revised to 12 non-defaulted grades; grade concentration limit. |
| 5.2 | 2026-03 | Justification of the LRA window (6.3); default-rate representativeness (6.5); aggregate effect of exclusions (6.4); floor reporting (11.5). |
