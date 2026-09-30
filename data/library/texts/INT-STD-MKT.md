# Market Risk and Valuation Model Standard

| | |
|---|---|
| **Reference** | MR-STD-500 |
| **Version and date** | v3.0 (2026-03) |
| **Owner** | Market Risk Management |
| **Approval body** | Market Risk Committee, with endorsement of the Model Risk Committee for model methodology provisions |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose

1.1 This Standard sets the requirements for the models used to calculate own funds requirements for market risk under the alternative internal model approach (IMA) and for the models used to value financial instruments at fair value, including valuation adjustments (XVA) and prudent valuation.

1.2 The Standard implements Part Three, Title IV, Chapter 1b of Regulation (EU) No 575/2013 as amended by Regulation (EU) 2024/1623 (CRR), the related regulatory technical standards on back-testing and profit and loss attribution and on the assessment of risk factor modellability, CRR Articles 34 and 105 and Commission Delegated Regulation (EU) 2016/101 on prudent valuation, and IFRS 13 *Fair Value Measurement*. It operationalises MRM-POL-001 for the market risk and valuation model family.

## 2 Scope and applicability

2.1 The Standard applies to: (a) the expected shortfall (ES) model, the stress scenario risk measure for non-modellable risk factors (NMRF) and the default risk charge (DRC) model; (b) until the IMA own funds requirements apply in the EU, the value-at-risk (VaR) and stressed VaR models approved under CRR Article 363; (c) pricing models used for fair value, including exposure simulation models used for credit, debit and funding valuation adjustments; (d) models used for independent price verification (IPV) and for additional valuation adjustments (AVA).

2.2 In-scope models are subject to MRM-POL-001, MRM-STD-020, MRM-STD-021, MRM-STD-030 and MV-STD-001. Where this Standard is more specific, it prevails.

## 3 Definitions

- **Expected shortfall (ES)** — the average of losses beyond the 97.5th percentile of the one-tailed loss distribution.
- **Liquidity horizon** — the time assumed to be needed to exit or hedge a risk position in stressed markets without materially affecting prices, as prescribed per risk factor category.
- **Modellable risk factor** — a risk factor that passes the risk factor eligibility test (RFET) based on real price observations.
- **NMRF** — a risk factor that does not pass the RFET, capitalised through a stress scenario risk measure.
- **Hypothetical P&L (HPL) / Risk-theoretical P&L (RTPL)** — the daily P&L from revaluing end-of-day positions with front-office pricing models, and the P&L predicted by the risk model, respectively.
- **PLA test** — the profit and loss attribution test comparing HPL and RTPL.
- **XVA** — the valuation adjustments for counterparty credit risk (CVA), own credit (DVA) and funding (FVA).
- **Model risk AVA** — the additional valuation adjustment for valuation uncertainty arising from the existence of alternative models or calibrations.

## 4 Model approval and general requirements

4.1 Every pricing and risk model shall be registered in the model inventory and tiered in accordance with MRM-STD-010 before use for P&L, risk measurement or capital. The IMA models shall be classified Tier 1.

4.2 No model shall be used for official valuation or capital until approved by the Model Risk Committee following independent validation. New products requiring a new or modified pricing model shall not be traded before the model is approved or a temporary approval with trading limits is granted.

4.3 Changes and extensions to IMA models shall be classified according to the applicable regulatory technical standards on the materiality of changes to internal models for market risk. Changes requiring prior supervisory approval shall not be implemented before approval is obtained. Classification shall be documented in accordance with MRM-STD-050.

4.4 The trading desk structure used for IMA eligibility shall be documented and approved by the Market Risk Committee, including the business strategy, risk limits and the model assigned to each desk.

## 5 Expected shortfall model

5.1 ES shall be calculated daily at the 97.5th percentile, one-tailed, for each trading desk using the IMA and for all such desks together.

5.2 ES shall be calculated with a base horizon of ten days and scaled to the prescribed liquidity horizons (10, 20, 40, 60 and 120 days) per risk factor category in accordance with CRR. The mapping of risk factors to liquidity horizon categories shall be documented.

5.3 ES shall be calibrated to a twelve-month period of stress for the Bank's current portfolio. The stress period shall be identified from an observation window starting at least in 2007, using a reduced set of risk factors that explains at least 75% of the full ES, and shall be reviewed at least quarterly.

5.4 Market data time series shall be updated at least monthly. Proxies and data filling methods shall be documented and their impact on ES assessed quarterly.

5.5 Positions shall be revalued with full revaluation where the pricing model is non-linear and the position material; approximations (sensitivity-based or grid-based) shall be justified by quantitative evidence of accuracy.

## 6 Non-modellable risk factors

6.1 The RFET shall be performed at least quarterly for every risk factor, based on verifiable real price observations over the preceding twelve months, in accordance with the regulatory technical standards on risk factor modellability.

6.2 Risk factors failing the RFET shall be capitalised through a stress scenario risk measure calibrated at least as prudently as the ES under the stress period. The calibration method and any assumed zero correlation between NMRF shall be documented.

6.3 The model documentation shall record the use of external data vendors for real price observations, including the controls over data completeness and verification.

## 7 Default risk charge

7.1 The DRC model shall measure default and migration-to-default losses with a one-year horizon at the 99.9th percentile, assuming constant positions over the horizon.

7.2 Default correlations shall be estimated from listed equity prices or credit spreads over a period of at least ten years including the stress period. The factor structure shall be documented and justified.

7.3 PDs used in the DRC shall be consistent with the Bank's IRB PDs where they exist, subject to a floor of 0.03%, and the source of each PD shall be documented.

## 8 Back-testing and profit and loss attribution

8.1 Each IMA trading desk shall be back-tested daily by comparing one-day VaR at the 99th and 97.5th percentiles with actual and hypothetical P&L. A desk exceeding twelve overshootings at the 99th percentile or thirty at the 97.5th percentile in the most recent 250 business days shall no longer use the IMA.

8.2 Firm-wide back-testing at the 99th percentile shall be performed daily; the number of overshootings shall determine the regulatory multiplier add-on and shall be reported to the Market Risk Committee.

8.3 The PLA test shall be performed quarterly for each desk using the Spearman correlation and the Kolmogorov-Smirnov test statistic on HPL and RTPL. Desks in the red zone shall be capitalised under the standardised approach; desks in the amber zone shall be subject to the capital surcharge.

8.4 Differences between HPL and RTPL shall be analysed at risk factor level. Every structural difference (missing risk factor, proxy or pricing approximation) shall be recorded and addressed through a remediation plan.

8.5 Overshootings shall be explained within five business days. Recurrent unexplained overshootings shall be escalated to the Model Risk Committee.

## 9 Valuation models

9.1 Pricing models shall be calibrated to observable market instruments where available. Calibration quality shall be monitored daily, with thresholds for calibration errors and escalation of breaches.

9.2 The model documentation shall state the model limitations and the resulting usage restrictions (products, parameter ranges, maturities). Front Office shall not use a model outside its approved scope.

9.3 Valuation inputs shall be classified by level of the IFRS 13 fair value hierarchy. Day-one profit on instruments valued with significant unobservable inputs shall be deferred in accordance with the accounting policy.

9.4 Exposure simulation for CVA and FVA shall use risk-neutral calibration consistent with the pricing of the underlying trades, reflect netting and collateral agreements, and capture wrong-way risk where material.

9.5 CVA shall use market-implied probabilities of default and LGD, derived from credit default swaps or documented proxy curves where the counterparty has no liquid CDS. The proxy methodology shall be documented and validated.

9.6 The funding curve used for FVA and the treatment of the overlap between DVA and FVA shall be documented and approved by the Valuation Committee.

9.7 Fair value adjustments for known model limitations (model reserves) shall be quantified, documented and reviewed at least quarterly.

## 10 Independent price verification and prudent valuation

10.1 Market prices and model inputs shall be verified independently of the risk-taking units at least monthly by Product Control, in accordance with CRR Article 105(8). IPV differences above thresholds shall be adjusted in the books and reported.

10.2 AVAs shall be calculated for all fair-valued positions in accordance with Delegated Regulation (EU) 2016/101, targeting a 90% level of certainty, and deducted from CET1 capital under CRR Article 34.

10.3 The model risk AVA shall be estimated for each valuation model where alternative models or calibrations exist, by determining a range of plausible valuations from the alternatives. Where this is not possible, an expert-based approach approved by the Valuation Committee shall be used and documented under MRM-STD-023.

10.4 Model risk identified by validation findings shall be reflected in the model risk AVA or model reserve until the finding is closed.

## 11 Roles and responsibilities

11.1 **Market Risk Modelling (1LoD)** develops and owns the IMA models and performs back-testing and PLA.
11.2 **Front Office Quantitative Analytics (1LoD)** develops and owns pricing and XVA models.
11.3 **Product Control** performs IPV and calculates AVAs.
11.4 **Market Risk Management (2LoD risk function)** owns this Standard, monitors IMA eligibility and reports to the Market Risk Committee.
11.5 **Model Validation (2LoD)** validates all in-scope models.
11.6 **Valuation Committee** approves valuation methodologies, model reserves and AVA methodologies; the **Model Risk Committee** approves models.
11.7 **Internal Audit (3LoD)** reviews the IMA and valuation control framework.

## 12 Exceptions and dispensations

12.1 Deviations from this Standard require a dispensation approved by the Market Risk Committee and, where a model provision is concerned, by the Model Risk Committee. Deviations that affect compliance with regulatory approval conditions are not eligible for dispensation. Dispensations are time-bound (maximum 12 months) and recorded in the MRM dispensation register.

## 13 Related documents

- Regulation (EU) No 575/2013 (CRR), Part Three, Title IV, Chapter 1b; Articles 34, 105 and 363
- Regulatory technical standards on back-testing and profit and loss attribution requirements and on the criteria for assessing the modellability of risk factors under the IMA
- Commission Delegated Regulation (EU) 2016/101 — RTS for prudent valuation
- IFRS 13 *Fair Value Measurement*, as endorsed in the EU
- ECB Guide to internal models, market risk chapter
- MRM-POL-001; MRM-STD-010; MRM-STD-020; MRM-STD-021; MRM-STD-023; MRM-STD-030; MRM-STD-050; MV-STD-001

## 14 Document history

| Version | Date | Change |
|---|---|---|
| 2.0 | 2022-09 | Introduction of ES, NMRF and DRC requirements in preparation for the IMA. |
| 2.1 | 2024-10 | Alignment with Regulation (EU) 2024/1623; transitional provision for VaR and stressed VaR models. |
| 3.0 | 2026-03 | XVA exposure and proxy-curve requirements; model risk AVA link to validation findings. |
