# Model Monitoring Standard

| | |
|---|---|
| **Reference** | MRM-STD-040 |
| **Version and date** | v3.1 (2025-10) |
| **Owner** | Model Risk Management (2LoD) |
| **Approval body** | Model Risk Committee |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose

1.1 This Standard sets the minimum requirements for the ongoing monitoring of models in use, so that deterioration in model performance, changes in the portfolio or the environment, and weaknesses in model use are detected early and acted upon.

1.2 The Standard implements the ongoing monitoring requirements of the Model Risk Management Policy (MRM-POL-001). For models used to calculate own funds requirements, it supports compliance with CRR Article 174(d) (regular cycle of model validation including monitoring of model performance and stability), CRR Article 185 (validation of internal estimates, including the annual comparison of realised default rates with estimated PDs) and CRR Article 172(3) and EBA/GL/2017/16 as regards the monitoring of overrides. It is aligned with the ECB guide to internal models and with the ECB instructions for reporting the validation results of internal models.

## 2 Scope and applicability

2.1 The Standard applies to all models in use in the Model Inventory (MRM-STD-010), from go-live until decommissioning, including vendor models and models used under a temporary approval.

2.2 Monitoring is a first line of defence activity performed by or on behalf of the Model Owner. It complements, and does not replace, the independent validation performed under MV-STD-001.

2.3 Requirements are proportionate to model tier. Statistical tests referred to in this Standard are specified in the Validation Testing Handbook (MV-HB-003); where this Standard sets a threshold, the same test definition shall be used in monitoring and in validation.

## 3 Definitions

**Monitoring plan:** the model-specific document defining the metrics, thresholds, data, frequency, responsibilities and escalation for monitoring a model (section 4).

**Key performance indicator (KPI):** a quantitative metric of model performance or stability, such as discriminatory power, calibration accuracy, population stability or override rate.

**Traffic light:** the classification of a KPI result as green (within tolerance), amber (early warning) or red (breach).

**Trigger:** a predefined condition that requires a specific action, such as an ad hoc review, recalibration, redevelopment or notification.

**Annual model review:** the yearly review by the Model Owner of the model's continued fitness for purpose (section 9).

## 4 Monitoring plan

4.1 Every model shall have a monitoring plan, prepared by the model developer as part of the model documentation required by MRM-STD-021 and approved by the Model Owner before go-live. The monitoring plan of Tier 1 and Tier 2 models shall be reviewed by Model Validation before approval.

4.2 The monitoring plan shall define: the KPIs and their calculation; the amber and red thresholds for each KPI; the monitoring frequency; the data sets and reference periods used; the segments at which KPIs are computed; the responsible persons; and the escalation and actions per traffic light.

4.3 KPIs shall cover, at a minimum and where applicable to the model type: (a) discriminatory power; (b) calibration or predictive accuracy; (c) population and characteristic stability; (d) data quality of production input data under MRM-STD-022; (e) overrides and overlays under MRM-STD-023; and (f) model use and coverage (share of the portfolio in scope that is rated or scored by the model).

4.4 Monitoring shall be performed at the level of the overall model and of each material segment, rating grade or pool, so that deterioration in a part of the portfolio is not masked by aggregate results.

4.5 The monitoring plan shall be updated whenever the model changes and reviewed at least annually as part of the annual model review.

## 5 KPIs and thresholds

5.1 Unless the monitoring plan approves model-specific thresholds with documented justification, the default thresholds in this section apply.

5.2 **Population stability:** the population stability index (PSI) of the model score or rating distribution, and of each model input variable, shall be computed against the development sample. PSI below 0.10 is green, from 0.10 to 0.25 amber, and above 0.25 red.

5.3 **Discriminatory power:** the area under the ROC curve (AUC) or the Gini coefficient (accuracy ratio) shall be computed on the most recent observation window and compared with the value at development. A relative decline of the Gini coefficient of more than 10% is amber and of more than 20% red. In addition, a Gini coefficient below 0.40 for corporate and below 0.50 for retail rating models is red regardless of the change.

5.4 **Calibration of PD models:** for each rating grade and for the portfolio, the realised default rate shall be compared with the estimated PD using a one-sided binomial or Jeffreys test as defined in MV-HB-003. A p-value below 5% for the portfolio, or for more than 20% of grades, is amber; a p-value below 1% for the portfolio, or for more than 30% of grades, is red.

5.5 **Calibration of LGD and EAD/CCF models:** realised LGD and realised CCF shall be compared with estimates by grade or pool and for the portfolio, using the tests in MV-HB-003. A portfolio-level underestimation of more than 5% relative (amber) or 10% relative (red) triggers escalation.

5.6 **Non-credit models:** for models other than credit risk parameters (for example valuation, IRRBB, financial crime and ML models), the monitoring plan shall define equivalent performance, stability and accuracy KPIs, such as backtesting exceptions, prediction error or alert productivity, with thresholds approved by Model Risk Management.

5.7 **Overrides:** override rates and directions shall be monitored with the thresholds set in MRM-STD-023 §6.2 unless stricter model-specific thresholds apply.

## 6 Monitoring frequency

6.1 Monitoring shall be performed at least at the following frequency:

| Model tier | Minimum frequency |
|---|---|
| Tier 1 | Quarterly |
| Tier 2 | Semi-annually |
| Tier 3 | Annually |

6.2 Calibration KPIs based on annual default horizons may be computed annually for all tiers, provided that stability, data quality and override KPIs are monitored at the frequency above.

6.3 Monitoring results shall be finalised and reported within 60 calendar days after the end of the monitoring reference period.

## 7 Breach escalation and triggers

7.1 An amber result shall be analysed by the Model Owner, its cause documented in the monitoring report, and the KPI placed under closer observation at the next monitoring cycle.

7.2 A red result, or an amber result on the same KPI in two consecutive monitoring cycles, is a trigger. The Model Owner shall notify Model Risk Management and Model Validation within ten business days of the result being known and shall submit a root cause analysis and action plan within 60 calendar days.

7.3 The action plan shall propose one of the following: no action, with justification; a temporary overlay under MRM-STD-023; recalibration; redevelopment; or restriction of the model's use. Changes shall be processed under MRM-STD-050.

7.4 Red results on Tier 1 models, and all triggers not resolved within six months, shall be reported to the Model Risk Committee.

7.5 For IRB models, monitoring results that indicate the rating system no longer meets the requirements of the CRR shall be assessed for notification to the competent authority in accordance with MRM-STD-050 and for an additional margin of conservatism under CRM-STD-101.

## 8 Monitoring of overrides and model use

8.1 For models with an override facility, the monitoring report shall present override rates by direction, reason code, magnitude and approving unit, and the realised performance of overridden cases compared with non-overridden cases, as required by MRM-STD-023 §6.

8.2 Material overlays in place shall be listed in each monitoring report with their amount, purpose and planned removal date.

8.3 The monitoring report shall show the coverage of the model: the share of the in-scope portfolio assessed by the model, and the number and share of exposures with missing or outdated model outputs.

## 9 Annual model review

9.1 Each model shall undergo an annual model review by the Model Owner, covering: the monitoring results of the past year; changes in the portfolio, products, processes, data or external environment; the status of open validation findings and data deficiencies; the EJ log and continued need of overlays; and code-versus-documentation consistency under MRM-STD-030.

9.2 The annual model review shall conclude whether the model remains fit for purpose and whether recalibration, redevelopment or other action is required. The conclusion shall be signed off by the Model Owner and submitted to Model Risk Management.

9.3 For IRB models, the annual model review shall include the comparison of realised default rates, loss rates and conversion factors with estimates required by CRR Article 185(b) and (c), and shall be made available to Model Validation for the annual validation.

## 10 Monitoring reporting

10.1 Monitoring results shall be documented in a monitoring report per model, stored in the model repository, showing each KPI with its value, threshold, traffic light and trend over at least the last four monitoring cycles.

10.2 Model Risk Management shall consolidate monitoring results in a portfolio-level report to the Model Risk Committee at least quarterly, covering all red results, open triggers and overdue action plans.

10.3 Monitoring code and data shall be version controlled and reproducible in accordance with MRM-STD-030.

## 11 Roles and responsibilities

11.1 **Model Owners:** accountable for the monitoring plan, timely monitoring, analysis of results, escalation, action plans and the annual model review.

11.2 **Model developers and monitoring teams:** compute KPIs and prepare monitoring reports.

11.3 **Model Validation:** reviews monitoring plans for Tier 1 and Tier 2 models, uses monitoring results in validation and challenges the analysis of triggers.

11.4 **Model Risk Management:** maintains this Standard, approves model-specific thresholds, tracks triggers and reports to the Model Risk Committee.

11.5 **Model Risk Committee:** decides on escalated breaches and on restrictions of model use.

## 12 Exceptions and dispensations

12.1 Deviations from this Standard, including less strict thresholds or lower frequencies, require a dispensation approved by the Head of Model Risk Management in accordance with MRM-POL-001, with a maximum duration of twelve months. Dispensations for Tier 1 models are reported to the Model Risk Committee.

## 13 Related documents

- Regulation (EU) No 575/2013 (CRR), Articles 172(3), 174(d) and 185
- EBA/GL/2017/16, Guidelines on PD estimation, LGD estimation and the treatment of defaulted exposures
- ECB guide to internal models; ECB instructions for reporting the validation results of internal models
- MRM-POL-001 Model Risk Management Policy
- MRM-STD-010 Model Inventory and Tiering Standard
- MRM-STD-020 Model Development Standard
- MRM-STD-021 Model Documentation Standard
- MRM-STD-022 Data Quality Standard for Models
- MRM-STD-023 Expert Judgement Standard
- MRM-STD-030 Model Implementation and Testing Standard
- MRM-STD-050 Model Change and Regulatory Notification Standard
- CRM-STD-101 Margin of Conservatism Standard
- MV-STD-001 Model Validation Standard; MV-HB-003 Validation Testing Handbook

## 14 Document history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2017-09 | First issue. |
| 2.0 | 2020-11 | Tier-based frequencies and default thresholds introduced. |
| 3.0 | 2023-12 | Alignment with ECB validation reporting instructions; Jeffreys test adopted for PD calibration. |
| 3.1 | 2025-10 | Override and coverage monitoring (section 8) and consecutive-amber trigger (7.2) added. |
