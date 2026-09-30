# Validation Testing Handbook (statistical tests and thresholds)

| | |
|---|---|
| **Title** | Validation Testing Handbook (statistical tests and thresholds) |
| **Reference** | MV-HB-003 |
| **Version and date** | v3.2 (2026-06) |
| **Owner** | Model Validation (2LoD) – Head of Model Validation |
| **Approval body** | Model Risk Committee |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose

1.1 This Handbook sets the mandatory statistical tests, test specifications and traffic-light thresholds that the Model Validation function (MV) applies in outcome analysis, representativeness and stability testing under MV-STD-001 §§7–8. It implements the quantitative validation expectations of CRR Art. 185, the EBA supervisory handbook on the validation of rating systems under the IRB approach and the ECB guide to internal models, and is aligned with the tests of the ECB instructions for reporting the validation results of internal models.

1.2 Common tests and thresholds make validation results comparable across models and over time, as required by CRR Art. 185 for the consistency of validation methods.

## 2 Scope and applicability

2.1 The Handbook applies to all statistical and machine-learning models validated by MV. Sections 5, 7 and 8 apply to all rating, scoring and classification models; sections 9 and 10 apply to LGD and EAD/CCF models; section 11 applies in addition to machine-learning models.

2.2 Model-specific thresholds that deviate from this Handbook may be set only under §14.

## 3 Definitions

- **AUC** – area under the receiver operating characteristic curve. **Gini** = 2 × AUC − 1.
- **Development sample** – the data on which the model was estimated or last calibrated.
- **Current portfolio** – the portfolio at the most recent reference date and, for default-rate comparisons, the most recent three observation years.
- **Out-of-time (OOT) sample** – observations from a period after the development window.
- **PSI** – population stability index, PSI = Σ (aᵢ − eᵢ) · ln(aᵢ / eᵢ), where aᵢ and eᵢ are the actual and expected shares in bucket i.
- **Traffic light** – the classification of a test result as green, amber or red.

## 4 General testing principles

4.1 Tests are performed on an out-of-sample and, where available, an out-of-time sample. For initial validations in-sample results are reported in addition. The observation window, sample definition and exclusions are documented for each test.

4.2 **Traffic-light consequences.** A green result requires no action. An amber result is analysed and explained in the validation report and may lead to a finding. A red result leads to a finding of at least Medium severity under MV-STD-002; a red calibration result for a model used for regulatory capital is assessed for High severity.

4.3 Unless specified otherwise, hypothesis tests are one-sided in the direction of risk underestimation; amber applies at a p-value below 5% and red at a p-value below 1%.

4.4 Where a grade or segment contains fewer than 20 defaults or events, the result is reported but interpreted together with the pooled result over grades or years; the Jeffreys test is preferred for low-default portfolios.

4.5 Test results are reproducible: MV records the code version, library versions and random seeds used.

## 5 Discriminatory power

5.1 MV computes the AUC and Gini on the validation sample together with a 95% confidence interval (DeLong method or bootstrap with at least 1,000 replications).

5.2 Absolute thresholds for the Gini coefficient of PD and scoring models are:

| Model type | Green | Amber | Red |
|---|---|---|---|
| Retail behavioural PD | ≥ 0.60 | 0.50 – < 0.60 | < 0.50 |
| Retail application, SME PD and scorecards | ≥ 0.45 | 0.35 – < 0.45 | < 0.35 |
| Corporate and institutions PD | ≥ 0.55 | 0.45 – < 0.55 | < 0.45 |

5.3 MV compares the current AUC with the AUC at initial validation or last recalibration. The result is amber if the relative decrease of the Gini exceeds 10% or the decrease is statistically significant at 5%, and red if the relative decrease exceeds 20%.

5.4 MV tests the rank ordering of grades: observed default rates must increase monotonically with the grade. A statistically significant inversion between adjacent grades is amber.

5.5 For LGD and CCF models MV computes the generalised AUC (or Somers' D) and compares it with the value at development; the thresholds for relative decrease of §5.3 apply.

## 6 Representativeness

6.1 MV assesses the representativeness of the development sample for the current portfolio by comparing both (a) the distributions of the risk drivers and the model score and (b) the default-rate levels. A comparison of risk-driver distributions alone is not sufficient.

6.2 Risk-driver distributions are compared using the PSI per risk driver and for the score or grade distribution, with the thresholds of §8.2, complemented by a comparison of the shares of missing and special values.

6.3 Default-rate levels are compared per segment and per grade between the development sample and the current portfolio, using a two-sample test of proportions at the 5% significance level. A significant difference in either direction is amber; a significant difference above 20% relative is red.

6.4 MV also assesses qualitative representativeness: the segmentation, product mix, lending and underwriting standards, collection and recovery policies, economic conditions and the legal environment, consistent with the EBA Guidelines on PD estimation, LGD estimation and the treatment of defaulted exposures (EBA/GL/2017/16).

6.5 A result that indicates material non-representativeness leads to a finding and to an assessment of whether recalibration or a margin of conservatism under CRM-STD-101 is required.

## 7 Calibration

7.1 **Binomial test.** For each grade MV tests the null hypothesis that the grade PD is correct against the alternative that it underestimates the observed default rate, using the exact binomial distribution. Thresholds follow §4.3.

7.2 **Jeffreys test.** For each grade and at portfolio level MV computes the p-value of the grade PD under the Beta(D + ½, N − D + ½) posterior, where D is the number of defaults and N the number of obligors, as specified in the ECB validation reporting instructions. Thresholds follow §4.3.

7.3 **Hosmer–Lemeshow test.** MV applies the Hosmer–Lemeshow chi-square test across all grades on the out-of-time sample (degrees of freedom equal to the number of grades). Amber applies at a p-value below 5% and red below 1%. Because the test assumes independent defaults, a red result is corroborated by the per-grade tests before a finding is raised.

7.4 Portfolio calibration is red if the portfolio-level Jeffreys test is red or if more than 20% of grades, and at least two grades, are red.

7.5 For IRB PD models MV compares the long-run average default rate with the portfolio-average PD at calibration level; a relative deviation above 10% is amber and above 20% is red.

7.6 For IFRS 9 and other models requiring unbiased estimates, calibration tests are applied two-sided and overestimation is treated in the same way as underestimation. For IRB models overestimation is reported but does not lead to a red result.

## 8 Stability

8.1 MV computes the PSI on the score or grade distribution and, as characteristic stability index, on each risk driver, using at least ten buckets or the rating grades; empty buckets are floored at 0.01%.

8.2 **PSI thresholds.** PSI below 0.10 is green, PSI from 0.10 to below 0.25 is amber and PSI of 0.25 or above is red.

8.3 MV analyses the twelve-month rating migration matrix. A share of obligors migrating by more than two grades above 10% is amber and above 20% is red.

8.4 MV monitors grade concentration: a grade containing more than 20% of exposures is amber and more than 30% is red, unless justified by the portfolio structure.

## 9 LGD back-testing

9.1 MV compares realised LGDs with estimated LGDs per segment or pool for defaults with closed recovery processes in the validation period, using a one-sided t-test on the mean difference. Thresholds follow §4.3.

9.2 MV assesses the treatment of incomplete recovery processes and quantifies the effect of their inclusion or exclusion on the back-testing result.

9.3 MV verifies that downturn LGD estimates are not lower than the realised LGDs observed in the downturn period identified under the EBA Guidelines for the estimation of LGD appropriate for an economic downturn.

9.4 For defaulted exposures MV compares the ELBE with realised LGDs and verifies that LGD in-default is not lower than ELBE for any exposure.

## 10 CCF and EAD tests

10.1 MV compares realised CCFs with estimated CCFs per facility type for defaults in the validation period, measured with a fixed twelve-month horizon before default, using a one-sided t-test. Thresholds follow §4.3.

10.2 MV computes the EAD coverage ratio (sum of estimated EAD over sum of realised EAD): 1.00 or above is green, 0.90 to below 1.00 is amber and below 0.90 is red.

10.3 MV verifies that the treatment of realised CCFs below zero or above one in back-testing is consistent with the model and quantifies its effect.

## 11 Machine-learning-specific tests

11.1 **Overfitting.** MV compares performance on training, test and out-of-time samples. A Gini difference between training and out-of-time sample above 5 percentage points is amber and above 10 percentage points is red.

11.2 **Seed and hyperparameter stability.** MV re-trains the model with at least five random seeds and with perturbed hyperparameters. A standard deviation of the Gini above 2 percentage points is amber.

11.3 **Interpretable challenger.** MV compares the model with an interpretable challenger, such as a logistic regression on the same data. A Gini uplift below 3 percentage points is amber, and the added complexity must be justified under MV-STD-020 §4.2.

11.4 **Feature importance stability.** MV compares feature importances between development and out-of-time samples; a Spearman rank correlation below 0.7 for the top 20 features is amber.

11.5 **Calibration of ML outputs.** The tests of §7 are applied to the calibrated output. MV additionally reports the Brier score and the reliability curve.

## 12 Reporting of test results

12.1 All tests are reported in an annex to the validation report, stating the sample, the test statistic, the threshold and the traffic-light result.

12.2 Any test of this Handbook that is not performed is listed with the reason in the validation report.

## 13 Roles and responsibilities

- **Head of Model Validation** – owns this Handbook and approves model-specific thresholds.
- **Validators** – apply the tests and thresholds and document results under §12.
- **Model owner (1LoD)** – provides the data needed for testing; applies the same tests in monitoring under MRM-STD-040.

## 14 Exceptions and dispensations

14.1 Model-specific thresholds or alternative tests may be approved by the Head of Model Validation where the model type or data do not allow application of this Handbook. The justification and the approved alternative are recorded in the validation scoping memo and reported to the Model Risk Committee.

## 15 Related documents

- Regulation (EU) No 575/2013 (CRR), Article 185
- EBA/GL/2017/16 Guidelines on PD estimation, LGD estimation and the treatment of defaulted exposures
- EBA supervisory handbook on the validation of rating systems under the IRB approach
- ECB guide to internal models; ECB instructions for reporting the validation results of internal models
- MRM-POL-001 Model Risk Management Policy; MRM-STD-040 Model Monitoring Standard; CRM-STD-101 Margin of Conservatism Standard
- MV-STD-001 Model Validation Standard; MV-STD-002 Validation Findings and Rating Standard; MV-STD-010 IRB Validation Standard; MV-STD-020 AI and ML Validation Standard

## 16 Document history

| Version | Date | Change |
|---|---|---|
| 3.0 | 2024-02 | Jeffreys test aligned with ECB validation reporting; ML tests introduced. |
| 3.1 | 2025-05 | CCF coverage ratio and downturn LGD comparison added. |
| 3.2 | 2026-06 | Section 6 revised: default-rate levels mandatory in representativeness testing; feature importance stability test added. |
