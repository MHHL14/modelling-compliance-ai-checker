# IRRBB Behavioural Modelling Standard

| | |
|---|---|
| **Reference** | ALM-STD-400 |
| **Version and date** | v2.1 (2025-12) |
| **Owner** | ALM / Treasury Risk |
| **Approval body** | Asset and Liability Committee (ALCO), with endorsement of the Model Risk Committee for model methodology provisions |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose

1.1 This Standard sets the requirements for the behavioural models used to measure and manage interest rate risk in the banking book (IRRBB): models for non-maturity deposits (NMD), prepayment of loans, early redemption of term deposits and pipeline (offer) risk. Behavioural assumptions materially determine the Bank's economic value of equity (EVE) and net interest income (NII) sensitivities, the supervisory outlier test (SOT) outcomes and hedging decisions, and therefore require a consistent and well-governed approach.

1.2 The Standard implements the behavioural modelling expectations of EBA/GL/2022/14 (Guidelines on IRRBB and CSRBB) and the modelling constraints of Commission Delegated Regulation (EU) 2024/856 on the supervisory outlier tests. It operationalises MRM-POL-001 for the IRRBB model family.

## 2 Scope and applicability

2.1 The Standard applies to all behavioural models and behavioural assumptions used in the Bank's IRRBB measurement, including EVE and NII metrics, the SOT, the ICAAP internal capital for IRRBB, hedge accounting designations and funds transfer pricing (FTP).

2.2 In-scope models include in particular the mortgage prepayment model, the NMD volume and rate pass-through models, the NMD replicating portfolio, consumer loan prepayment assumptions, term deposit early redemption assumptions and the mortgage pipeline model.

2.3 In-scope models are subject to MRM-POL-001, MRM-STD-020, MRM-STD-021, MRM-STD-022 and MV-STD-001. Credit spread risk in the banking book (CSRBB) models are outside the scope of this Standard.

## 3 Definitions

- **Non-maturity deposit (NMD)** — a deposit without contractual maturity whose client may withdraw or the Bank may reprice at any time, such as current and savings accounts.
- **Stable part / core part** — the part of NMD volumes that is unlikely to be withdrawn (stable) and, within it, the part that is unlikely to reprice with market rates (core).
- **Pass-through rate (beta)** — the share of a market rate change passed on to the client rate, including its lag.
- **Replicating portfolio** — a portfolio of fixed-income instruments of different tenors whose yield mirrors the client rate of the NMD, used to express the repricing profile of the core part.
- **Conditional prepayment rate (CPR)** — the annualised share of outstanding principal prepaid in excess of scheduled amortisation.
- **Pipeline** — mortgage offers issued with a committed interest rate that have not yet been drawn.
- **Supervisory outlier test (SOT)** — the EVE and NII tests under Article 98(5) of Directive 2013/36/EU and Delegated Regulation (EU) 2024/856.

## 4 General requirements

4.1 Behavioural assumptions shall be based on the Bank's own historical data, supplemented by expert judgement where data are insufficient. Expert judgement shall comply with MRM-STD-023 and its impact on EVE and NII shall be quantified.

4.2 Behavioural models shall be conditional on the interest rate scenario: prepayment speeds, deposit volumes and pass-through rates shall respond to the rate paths of each scenario used for EVE, NII and the SOT, rather than being held constant.

4.3 The same behavioural models and parameters shall be used for internal EVE and NII measurement, the SOT, the ICAAP, hedging and FTP. Any difference required by regulation or purpose shall be documented and its impact quantified.

4.4 Behavioural models shall be registered in the model inventory and tiered according to MRM-STD-010. The NMD and mortgage prepayment models shall be classified Tier 1.

4.5 The model documentation shall describe the segmentation of the modelled portfolio. Segments shall be homogeneous in client behaviour and, as a minimum, distinguish retail transactional, retail non-transactional, SME and non-financial wholesale deposits for NMD.

## 5 Non-maturity deposits

5.1 The NMD volume model shall split balances into a volatile part and a stable part. The stable part shall be estimated from historical balance dynamics, for example as the balance that is not expected to be withdrawn with a defined confidence level over the modelling horizon.

5.2 The stability of volumes shall be assessed under stress, including rapid, digitally enabled outflows and migration from savings to term products or alternative investments when market rates rise. The assumptions for the stable part shall be at least as conservative as those used in the Bank's liquidity stress testing.

5.3 The pass-through model shall estimate the long-term beta and the speed of adjustment of client rates to market rates, allowing for asymmetry between rising and falling rates and for the floor on client rates. It shall be estimated over a period including both rising and falling rate environments.

5.4 The core part shall be derived from the stable part and the pass-through estimate. The repricing profile of the core part shall be expressed through a replicating portfolio or a maturity allocation, and the choice of tenors and weights shall be justified by the estimated pass-through behaviour, not by margin targets.

5.5 The average repricing maturity of NMD from retail and non-financial wholesale counterparties used in the SOT shall not exceed five years. For internal measurement the maximum tenor allocated to any NMD segment shall be ten years, and the average repricing maturity per segment shall be reported quarterly to ALCO.

5.6 Development data for NMD models shall cover at least ten years, or the longest period available, and shall include at least one period of rising interest rates.

## 6 Prepayment models

6.1 The mortgage prepayment model shall model prepayment as a function of at least the refinancing incentive (the difference between the client rate and the prevailing market rate for the remaining fixed-rate period), loan seasoning, the penalty-free prepayment allowance, and relocation and sale of the property.

6.2 Full prepayments, partial prepayments (curtailments) and rate resets at the end of the fixed-rate period shall be modelled or analysed separately, as their drivers differ.

6.3 The model shall reflect contractual prepayment penalties and the penalty-free allowance, including the compensation received on penalty-bearing prepayments, when projecting EVE and NII.

6.4 Prepayment models shall be calibrated on at least five years of loan-level history and shall be recalibrated when back-testing under §8 shows a structural deviation.

6.5 Prepayment assumptions for consumer loans and early redemption assumptions for term deposits shall be documented, rate-dependent where material, and back-tested in accordance with §8.

## 7 Pipeline risk

7.1 The pipeline model shall estimate the expected take-up of mortgage offers as a function of the change in market rates since the offer date and of the remaining offer validity period.

7.2 Pipeline exposures shall be included in EVE and NII measurement and in the hedging strategy from the offer date, using the expected take-up under each rate scenario.

## 8 Back-testing of behavioural assumptions

8.1 Model owners shall back-test all behavioural models at least annually. Back-testing shall compare predicted and realised values of NMD volumes per segment, client deposit rates, prepayment rates per cohort and product, and pipeline take-up rates.

8.2 Back-testing results shall be assessed against quantitative thresholds set in the model documentation, derived from the traffic-light approach of the Validation Testing Handbook (MV-HB-003). A red outcome shall trigger recalibration or a documented rationale approved by ALCO.

8.3 Model owners shall perform sensitivity analysis on the key behavioural assumptions at least annually, quantifying the impact on EVE and NII of alternative assumptions (for example a shorter core-deposit maturity, higher betas and faster prepayments), and report the results to ALCO.

8.4 Model risk arising from behavioural assumptions shall be reflected in the ICAAP internal capital for IRRBB, based on the sensitivity analysis of §8.3.

## 9 Supervisory outlier tests and metrics

9.1 The SOT shall be computed using the Bank's own behavioural models, subject to the constraints of Delegated Regulation (EU) 2024/856, including the cap of §5.5.

9.2 The SOT shall be computed at least quarterly for the six supervisory EVE shock scenarios and the two NII shock scenarios. Results shall be compared with the regulatory thresholds (decline in EVE exceeding 15% of Tier 1 capital; large decline in NII relative to Tier 1 capital) and with internal early-warning levels set by ALCO.

9.3 The documentation shall demonstrate that the behavioural models are applied consistently to the prescribed shock scenarios, including the application of rate floors and the post-shock behaviour of pass-through and prepayment.

## 10 Governance

10.1 ALCO shall approve the key behavioural assumptions (stable and core proportions, betas, replicating portfolio tenors, prepayment calibration) at least annually and whenever they change materially.

10.2 Behavioural models shall be approved by the Model Risk Committee in accordance with MRM-POL-001, following independent validation under MV-STD-001.

10.3 Changes to behavioural models or parameters shall follow the Model Change and Regulatory Notification Standard (MRM-STD-050). A change with an impact of more than 2% of Tier 1 capital on the worst SOT EVE outcome shall be classified as a material change.

10.4 Data used for behavioural models shall comply with MRM-STD-022, and the reference data set shall be documented with the RDS template of MRM-STD-021.

## 11 Roles and responsibilities

11.1 **ALM Modelling (1LoD)** develops, calibrates, monitors and back-tests behavioural models.
11.2 **ALM / Treasury Risk (2LoD risk function)** owns this Standard, challenges assumptions and reports IRRBB metrics.
11.3 **Treasury** uses the models for hedging and FTP and provides business input to expert judgement.
11.4 **Model Validation (2LoD)** validates the models.
11.5 **ALCO** approves key behavioural assumptions; the **Model Risk Committee** approves models.
11.6 **Internal Audit (3LoD)** periodically reviews compliance with this Standard.

## 12 Exceptions and dispensations

12.1 Deviations from this Standard require a dispensation approved by ALCO and, where a model provision is concerned, by the Model Risk Committee. Dispensations are time-bound (maximum 12 months) and recorded in the MRM dispensation register.

## 13 Related documents

- EBA/GL/2022/14 — Guidelines on IRRBB and CSRBB
- Commission Delegated Regulation (EU) 2024/856 — RTS on supervisory outlier tests; Directive 2013/36/EU Article 98(5)
- MRM-POL-001; MRM-STD-010; MRM-STD-020; MRM-STD-021; MRM-STD-022; MRM-STD-023; MRM-STD-050; MV-STD-001; MV-HB-003
- ERM-STD-300 Stress Testing and Scenario Modelling Standard

## 14 Document history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2021-06 | First issue. |
| 2.0 | 2024-02 | Alignment with EBA/GL/2022/14; pipeline model; deposit outflow stress. |
| 2.1 | 2025-12 | Alignment with Delegated Regulation (EU) 2024/856; materiality threshold for model changes. |
