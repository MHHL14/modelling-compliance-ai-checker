# IFRS 9 ECL Methodology Standard

| | |
|---|---|
| **Reference** | FIN-STD-200 |
| **Version and date** | v4.0 (2026-02) |
| **Owner** | Finance / Credit Risk Modelling |
| **Approval body** | Group Impairment Committee, with endorsement of the Model Risk Committee for model methodology provisions |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose

1.1 This Standard sets the minimum methodological requirements for the models used by the Bank to measure expected credit losses (ECL) under IFRS 9 *Financial Instruments*, Section 5.5, as endorsed in the European Union. It covers stage allocation, the estimation of probability of default (PD), loss given default (LGD) and exposure at default (EAD) term structures, the use of forward-looking information, management overlays, and the validation and back-testing of ECL models.

1.2 The Standard implements the expectations of EBA/GL/2017/06 (Guidelines on credit institutions' credit risk management practices and accounting for expected credit losses) and operationalises the Model Risk Management Policy (MRM-POL-001) for the IFRS 9 model family.

## 2 Scope and applicability

2.1 The Standard applies to all models, model components and quantitative methods used to determine the stage allocation and loss allowance of financial assets measured at amortised cost or at fair value through other comprehensive income, loan commitments and financial guarantee contracts, for all Group entities reporting under IFRS.

2.2 In-scope models include staging and significant increase in credit risk (SICR) models, PD, LGD and EAD models, macroeconomic scenario and satellite models to the extent they feed ECL, and the calculation engine. Individual assessment of Stage 3 exposures by the workout function is in scope only for the methodological requirements of §7.5.

2.3 All in-scope models are models in the sense of MRM-POL-001 and are subject to the Model Development Standard (MRM-STD-020), the Model Documentation Standard (MRM-STD-021) and the Model Validation Standard (MV-STD-001) in addition to this Standard. Where this Standard is more specific, it prevails for IFRS 9 models.

## 3 Definitions

- **12-month ECL** — the portion of lifetime ECL resulting from default events possible within 12 months after the reporting date.
- **Lifetime ECL** — ECL resulting from all possible default events over the expected life of a financial instrument.
- **Stage 1 / 2 / 3** — performing exposures without SICR (12-month ECL); performing exposures with SICR since initial recognition (lifetime ECL); credit-impaired exposures (lifetime ECL).
- **SICR** — significant increase in credit risk since initial recognition.
- **PIT PD** — point-in-time PD, reflecting current and forecast economic conditions without conservatism.
- **Management overlay** — an adjustment to modelled ECL made outside the approved model, including post-model adjustments (PMA) and top-level adjustments.
- **Reasonable and supportable forecast period (RSP)** — the horizon over which explicit macroeconomic forecasts are used.
- **Watchlist** — the Bank's list of performing obligors under enhanced monitoring as defined in the Credit Risk Policy (CR-POL-001).

## 4 General principles

4.1 ECL models shall produce an unbiased, probability-weighted estimate of credit losses that reflects a range of possible outcomes, the time value of money and reasonable and supportable information about past events, current conditions and forecasts of future economic conditions that is available without undue cost or effort. Prudential conservatism (margins of conservatism, downturn calibration, regulatory floors) shall not be included.

4.2 The definition of default used for IFRS 9 purposes shall be the prudential definition of default set out in the Definition of Default Standard (CR-STD-110), which implements CRR Article 178, Commission Delegated Regulation (EU) 2018/171 and EBA/GL/2016/07. Stage 3 shall comprise all exposures in default under that definition, and purchased or originated credit-impaired (POCI) assets shall be identified separately.

4.3 Where IRB risk parameters or rating systems governed by CRM-STD-100 are used as a starting point, each adjustment required to make them IFRS 9-compliant — removal of margins of conservatism and downturn components, TTC-to-PIT conversion, removal of regulatory floors, change of discount rate and extension to lifetime horizon — shall be documented, justified and quantified in the model documentation.

4.4 Differences between IFRS 9 and IRB model design choices that are not required by the differing objectives of the two frameworks shall be identified and justified in a reconciliation section of the model documentation.

4.5 Every IFRS 9 model shall be registered in the model inventory and tiered in accordance with the Model Inventory and Tiering Standard (MRM-STD-010). ECL models covering portfolios representing more than 10% of the Bank loss allowance shall be classified at least Tier 1.

## 5 Stage allocation and SICR

5.1 Stage allocation shall be performed at facility level at each reporting date. Collective assessment is permitted only for groups of exposures sharing credit risk characteristics and shall be used where facility-level information does not capture a SICR in a timely manner.

5.2 The primary quantitative SICR criterion shall compare the remaining-lifetime PD at the reporting date with the remaining-lifetime PD that was expected at initial recognition for the same remaining term, both under the probability-weighted forward-looking scenarios. The use of 12-month PD as an approximation requires evidence that the result is not materially different.

5.3 A SICR shall be deemed to have occurred when the ratio of current to origination annualised lifetime PD exceeds a portfolio-specific relative threshold, provided that the absolute PD increase also exceeds a minimum absolute threshold. The absolute threshold prevents transfers caused by immaterial movements in low-PD exposures.

5.4 Relative and absolute thresholds shall be calibrated per portfolio and documented. The calibration shall demonstrate the trade-off between the early identification of defaults (capture rate) and stage volatility, and shall be re-assessed at least annually.

5.5 Irrespective of the quantitative criterion, the following backstops shall allocate a performing exposure to Stage 2:
(a) more than 30 days past due on a material amount; the rebuttable presumption in IFRS 9 shall not be rebutted for any portfolio without a dispensation under §14;
(b) forbearance measures granted to a performing exposure, for at least the duration of the forborne-performing probation period of two years;
(c) inclusion on the watchlist.

5.6 Qualitative SICR indicators that are not reflected in the PD (such as sector or regional deterioration identified by Credit Risk Management) shall be applied through documented collective Stage 2 transfers. Each collective transfer shall specify the affected population, the triggering evidence and its review date.

5.7 The low credit risk exemption may be applied only to debt securities with an internal rating equivalent to investment grade. It shall not be applied to loans and advances.

5.8 Exposures shall return from Stage 2 to Stage 1 only when none of the Stage 2 criteria is met at the reporting date; no additional probation shall apply beyond that of forborne exposures. Exposures shall leave Stage 3 only after completion of the probation period defined in CR-STD-110.

5.9 The origination PD, or the rating at origination, shall be stored for every facility for its full life. For facilities originated before origination PDs were available, the proxy approach shall be documented and its impact on stage allocation analysed.

## 6 PD term structures

6.1 PD models shall provide PIT PD term structures covering the expected life of each exposure: the maximum contractual period, or for revolving facilities the behavioural life determined under §8.3.

6.2 PD term structures shall be conditional on each macroeconomic scenario. The methodology (for example TTC-to-PIT conversion via a systematic factor, rating migration matrices or survival models) shall be justified against alternatives in the model documentation.

6.3 The 12-month PIT PD shall be calibrated to recently observed default rates of the portfolio, adjusted to current conditions. Long-run average default rates shall not be used as the PIT calibration target.

6.4 Cumulative PD curves shall be monotonically non-decreasing and marginal PDs shall be non-negative. Beyond the reasonable and supportable forecast period, PDs shall revert to long-run levels over a documented reversion period.

6.5 Lifetime PD shall account for prepayment and other attrition either explicitly or through the survival definition, consistently with the EAD model.

## 7 LGD

7.1 LGD estimates shall be best estimates without downturn adjustment, margin of conservatism or regulatory floors. Recoveries and directly attributable costs shall be discounted at the effective interest rate of the exposure.

7.2 For secured exposures, collateral values shall be indexed from the latest valuation to the reporting date and projected with scenario-specific forward-looking indices. For residential mortgages the Bank's house price index (HPI) projections from the scenario models shall be used for each scenario.

7.3 Forced-sale haircuts, time to sale and sale costs shall be calibrated on the Bank's observed collateral realisations and reviewed at least annually.

7.4 Where the LGD model includes a cure component, cure shall be defined consistently with the exit from default under CR-STD-110, and the LGD of cured exposures shall reflect the risk of re-default.

7.5 Stage 3 exposures above the individual assessment threshold set in CR-POL-001 shall be measured with probability-weighted discounted cash flow scenarios prepared by the workout function; all other Stage 3 exposures shall use LGD models that depend on time in default.

## 8 EAD

8.1 EAD term structures for amortising products shall be based on contractual cash-flow schedules, adjusted for expected prepayments and including accrued interest.

8.2 EAD for undrawn commitments shall use credit conversion factors estimated on the Bank's own experience of drawdowns before default, without regulatory floors.

8.3 For revolving facilities that include both a drawn and an undrawn component, the measurement period shall be the period over which the Bank is exposed to credit risk and ECL would not be mitigated by credit risk management actions, estimated from historical behaviour, not the contractual notice period.

## 9 Forward-looking information and macroeconomic scenarios

9.1 ECL shall be computed under at least three macroeconomic scenarios — baseline, upside and downside — produced by the scenario models governed by the Stress Testing and Scenario Modelling Standard (ERM-STD-300). The baseline shall be consistent with the scenario used for financial planning.

9.2 Scenario probability weights shall be set quarterly and supported by a documented quantitative rationale, such as the position of each scenario in the distribution of historical or forecast GDP outcomes. No scenario shall carry a weight below 10%.

9.3 ECL shall be calculated separately under each scenario and then probability-weighted. The effect of non-linearity (the difference between the weighted ECL and the ECL under the baseline) shall be reported quarterly.

9.4 The reasonable and supportable forecast period shall be three years, followed by a reversion to long-run average conditions over a documented period of no more than two years.

9.5 Macroeconomic variables in satellite models shall be economically intuitive, have the expected sign, be statistically significant and be tested out of sample. Variable selection and rejected alternatives shall be documented.

9.6 Scenarios, weights and the resulting ECL sensitivity to a 100% weighting of each scenario shall be approved quarterly by the Group Impairment Committee and made available for IFRS 7 disclosure.

## 10 Management overlays

10.1 A management overlay may only be recognised to address an identified limitation of the approved models or a risk that the models do not capture, including emerging risks such as climate and environmental risks under CER-POL-001. Overlays shall not be used to smooth results.

10.2 Every overlay shall be recorded in the overlay register with its rationale, the model limitation addressed, the affected portfolio and stages, the quantification method, the amount, the approval, the review date and the planned remediation.

10.3 Overlays shall be quantified with an evidence-based method (for example scenario analysis, sensitivity analysis or an alternative model run). Expert judgement used in quantification shall comply with the Expert Judgement Standard (MRM-STD-023).

10.4 Overlays shall be approved as follows: up to EUR 5 million by the Head of IFRS 9 Modelling and the Head of Finance Reporting jointly; above EUR 5 million or 5% of the portfolio loss allowance by the Group Impairment Committee. Model Validation shall review every overlay above EUR 5 million before approval.

10.5 Where an overlay reflects a SICR not captured by the staging model, the corresponding exposures shall also be transferred to Stage 2 so that stage allocation and measurement are consistent.

10.6 All overlays shall be re-assessed quarterly. An overlay that has been in place for four consecutive quarters shall trigger a formal model change assessment under the Model Change and Regulatory Notification Standard (MRM-STD-050).

## 11 Data

11.1 Data used for ECL model development, calibration and production shall comply with the Data Quality Standard for Models (MRM-STD-022) and the Data Management and Governance Policy (DATA-POL-001). The reference data set shall be documented using the RDS template of MRM-STD-021.

11.2 Development data for PD models shall cover at least five years and, where available, a full economic cycle, and its representativeness for the current portfolio shall be analysed.

11.3 ECL model input exposures shall be reconciled to the general ledger at each quarterly reporting date and unexplained differences above the materiality threshold set by Finance shall be resolved before sign-off.

## 12 Validation, monitoring and back-testing

12.1 IFRS 9 models shall be independently validated before first use and after material changes, and periodically in line with MV-STD-001: annually for Tier 1 and at least every two years for Tier 2 models.

12.2 Model owners shall perform back-testing at least annually, covering as a minimum: (a) 12-month PIT PD against observed default rates per rating grade; (b) LGD against realised losses on closed workouts; (c) CCF against realised drawdowns; (d) stage allocation performance, including the share of defaults that were in Stage 2 at least six months before default and the frequency of stage reversals.

12.3 Monitoring results shall be assessed against the traffic-light thresholds of the Validation Testing Handbook (MV-HB-003). A red outcome shall lead to a remediation plan approved by the Model Risk Committee within three months, and to an assessment of the need for a temporary overlay under §10.

12.4 The accuracy of the satellite models linking macroeconomic variables to risk parameters shall be assessed annually by comparing projected and realised parameter values for past baseline scenarios.

12.5 The ECL calculation engine shall be tested in accordance with the Model Implementation and Testing Standard (MRM-STD-030). Material model changes shall be run in parallel for at least one quarterly reporting cycle before going live.

## 13 Roles and responsibilities

13.1 **IFRS 9 Modelling (1LoD)** owns the ECL models, performs development, monitoring and back-testing, and maintains the overlay register.
13.2 **Enterprise Stress Testing** provides the macroeconomic scenarios and satellite models in accordance with ERM-STD-300.
13.3 **Credit Risk Management** maintains the watchlist, forbearance and default flags used as staging inputs.
13.4 **Finance** is responsible for the accounting policy, the booking of the loss allowance and IFRS 7 disclosures.
13.5 **Model Validation (2LoD)** validates the models and reviews overlays in accordance with §10.4.
13.6 **Group Impairment Committee** approves scenarios, weights and material overlays; the **Model Risk Committee** approves models in accordance with MRM-POL-001.
13.7 **Internal Audit (3LoD)** periodically assesses compliance with this Standard.

## 14 Exceptions and dispensations

14.1 Deviations from this Standard require a dispensation approved by the Model Risk Committee, after consultation of the Group Impairment Committee where the deviation affects accounting outcomes. Dispensations are time-bound (maximum 12 months), recorded in the MRM dispensation register and reported to the Group Impairment Committee quarterly.

## 15 Related documents

- IFRS 9 *Financial Instruments* (Section 5.5) and IFRS 7 *Financial Instruments: Disclosures*, as endorsed in the EU
- EBA/GL/2017/06 — Guidelines on credit risk management practices and accounting for expected credit losses
- EBA/GL/2016/07 — Guidelines on the application of the definition of default
- MRM-POL-001 Model Risk Management Policy; MRM-STD-010 Model Inventory and Tiering Standard; MRM-STD-020 Model Development Standard; MRM-STD-021 Model Documentation Standard; MRM-STD-022 Data Quality Standard for Models; MRM-STD-023 Expert Judgement Standard; MRM-STD-030 Model Implementation and Testing Standard; MRM-STD-050 Model Change and Regulatory Notification Standard
- CR-POL-001 Credit Risk Policy; CR-STD-110 Definition of Default Standard; CRM-STD-100 IRB Rating System Standard
- ERM-STD-300 Stress Testing and Scenario Modelling Standard; CER-POL-001 Climate and Environmental Risk Policy
- MV-STD-001 Model Validation Standard; MV-HB-003 Validation Testing Handbook

## 16 Document history

| Version | Date | Change |
|---|---|---|
| 3.0 | 2023-03 | Introduction of absolute SICR threshold; overlay register. |
| 3.1 | 2024-06 | Alignment with revised definition of default; watchlist backstop. |
| 4.0 | 2026-02 | Overlay approval limits and four-quarter remediation trigger; minimum scenario weight; staging back-testing metrics; HPI projection requirement for mortgage LGD. |
