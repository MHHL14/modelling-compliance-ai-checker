# Stress Testing and Scenario Modelling Standard

| | |
|---|---|
| **Reference** | ERM-STD-300 |
| **Version and date** | v2.2 (2026-01) |
| **Owner** | Enterprise Risk Management |
| **Approval body** | Enterprise Risk Committee, with endorsement of the Model Risk Committee for model methodology provisions |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose

1.1 This Standard sets the requirements for the design of stress test scenarios and for the models used to translate those scenarios into projected risk parameters, profit and loss, risk-weighted assets and capital. It ensures that the Bank's stress testing programme is forward-looking, severe but plausible, consistently applied across risk types and fit for use in the internal capital adequacy assessment process (ICAAP), recovery planning, risk appetite and IFRS 9 forward-looking information.

1.2 The Standard implements EBA/GL/2018/04 (Guidelines on institutions' stress testing), the ECB Guide to the ICAAP and, for climate scenarios, EBA/GL/2025/01 and EBA/GL/2025/04. It operationalises MRM-POL-001 for the stress testing model family.

## 2 Scope and applicability

2.1 The Standard applies to all Group-wide and entity-level stress tests, including the annual ICAAP stress test, reverse stress testing, supervisory stress tests executed by the Bank, climate stress tests and scenario analysis, and ad hoc stress tests requested by the management body.

2.2 In-scope models are scenario generation models, satellite models linking macroeconomic and financial variables to risk parameters (PD, LGD, CCF, prepayment, deposit volumes, margins, market risk factors), projection and aggregation tools, and climate transmission models. Sensitivity analyses on single risk factors are in scope for §4 and §11 only.

2.3 Models in scope are subject to MRM-POL-001, MRM-STD-020, MRM-STD-021 and MV-STD-001. Satellite models also used for IFRS 9 shall additionally meet FIN-STD-200.

## 3 Definitions

- **Scenario** — a consistent set of projected paths of macroeconomic and financial variables over the stress horizon, accompanied by a narrative.
- **Satellite model** — a model that projects a risk parameter or financial item as a function of scenario variables.
- **Macro linkage** — the documented transmission channel between a scenario variable and a projected risk parameter or balance sheet item.
- **Reverse stress test** — a stress test starting from a predefined outcome, such as a breach of the total SREP capital requirement or non-viability, and identifying the scenarios that could lead to it.
- **Management action** — an action the management body could credibly take in response to a stress, such as reducing dividends or deleveraging.
- **Stress horizon** — the projection period of a scenario, three years for the ICAAP normative perspective unless otherwise stated.

## 4 Stress testing programme and governance

4.1 The Bank shall maintain an annual stress testing programme, approved by the Management Board, describing the stress tests to be executed, their purpose, scope, frequency, methodologies, responsibilities and use of results.

4.2 The Stress Testing Steering Committee, chaired by the CRO, shall oversee the execution of the programme, approve scenario narratives before quantification and challenge results before submission to the Management Board.

4.3 The Management Board shall be involved in the definition of the ICAAP adverse scenario and the reverse stress test outcome and shall document how results are used in strategic, capital and risk appetite decisions.

4.4 Stress test results shall be used in setting risk appetite limits, capital planning and the calibration of the management buffer, recovery plan indicators and, for the baseline scenario, IFRS 9 forward-looking information.

## 5 Scenario design

5.1 Scenarios shall be severe but plausible and shall address the Bank's material risks and vulnerabilities as identified in the annual risk identification process, including concentrations in Dutch residential real estate, interest rate risk in the banking book and funding risk.

5.2 Each scenario shall have a written narrative that explains the triggering events and the economic transmission, and the quantified variable paths shall be internally consistent with that narrative.

5.3 The severity of adverse scenarios shall be calibrated against historical episodes and hypothetical events. The calibration shall be documented, including the percentile or historical analogue that each key variable represents.

5.4 The scenario generation model shall ensure consistency between variables, for example through a vector autoregression or structural macroeconomic model. Expert adjustments to model-generated paths shall be documented and approved in accordance with MRM-STD-023.

5.5 The scenario set shall cover at minimum GDP, unemployment, house prices, commercial real estate prices, the interest rate term structure, credit spreads, equity prices, exchange rates and inflation for the Bank's main markets.

5.6 Scenarios shall be reviewed at least annually and, in addition, when material changes in the economic environment or in the Bank's risk profile occur.

5.7 Scenarios shall combine market-wide and idiosyncratic stress where relevant to the purpose, and shall consider the interaction between solvency and liquidity stress.

## 6 Satellite models

6.1 Each satellite model shall document its macro linkage: the economic rationale for each explanatory variable, the expected sign of the relationship and the lag structure.

6.2 Explanatory variables shall be statistically significant with the expected sign. Variables with counter-intuitive signs shall not be retained, even where they improve in-sample fit.

6.3 Development data shall cover at least one full economic cycle including a downturn period. Where the Bank's own data do not contain a downturn, external or proxy data shall be used and their representativeness justified.

6.4 Satellite models shall be tested for their behaviour under scenario values outside the historical range of the development data. Where extrapolation produces implausible results, the treatment (such as caps, non-linear specifications or expert overlays) shall be documented.

6.5 Model performance shall be assessed on out-of-sample and out-of-time data, including a back-test of projections under historical realised macroeconomic paths.

6.6 For every Tier 1 satellite model a benchmark or challenger model shall be maintained, and the difference between the champion and challenger projections under the adverse scenario shall be reported as a measure of model uncertainty.

6.7 Where the same risk parameter is projected for stress testing, IFRS 9 and ICAAP, the same satellite model shall be used. Differences required by the purpose (such as PIT versus downturn calibration) shall be documented.

## 7 Macro linkages and projection

7.1 Projection of profit and loss, risk-weighted assets and capital shall use the balance sheet assumption defined for the exercise (static or dynamic). Under a dynamic balance sheet, new business assumptions shall be consistent with the scenario narrative.

7.2 Second-round and feedback effects, such as rating migration increasing RWA and interest rate paths affecting prepayment and deposit behaviour, shall be captured or their omission justified.

7.3 Management actions shall be credible, feasible under the scenario and documented with their expected impact and time to implementation. Results shall be reported both before and after management actions.

7.4 The aggregation of projections across risk types shall be reconciled to the Bank's financial and regulatory reporting at the starting point of the exercise.

## 8 Reverse stress testing

8.1 A reverse stress test shall be performed at least annually at Group level.

8.2 The reverse stress test shall identify the scenarios that would cause a breach of the total SREP capital requirement, and separately of the point of non-viability as defined in the recovery plan.

8.3 The plausibility of the identified scenarios shall be assessed, and the results shall be used to challenge the business model, the recovery plan indicators and the severity of the regular adverse scenarios.

## 9 Use in the ICAAP

9.1 The normative perspective of the ICAAP shall include at least a baseline and an adverse scenario over a three-year horizon, projecting all material risks, own funds and capital ratios against applicable requirements and buffers.

9.2 The economic perspective shall be tested using stress scenarios consistent with those of the normative perspective, applied to the Bank's internal capital and economic value measures.

9.3 Stress test models used in the ICAAP shall be subject to the same model risk management requirements as other Tier 1 models, and their limitations shall be reflected in the ICAAP through documented adjustments or capital add-ons.

## 10 Climate scenarios

10.1 The programme shall include climate and environmental scenario analysis covering transition and physical risk, in accordance with the Climate and Environmental Risk Policy (CER-POL-001) and EBA/GL/2025/04.

10.2 Climate scenarios shall be based on recognised reference pathways (such as the scenarios published by the Network for Greening the Financial System), including at least an orderly transition, a disorderly transition and a hot-house-world scenario, adapted to the Bank's portfolios.

10.3 Climate scenario analysis shall cover a short-term horizon consistent with the ICAAP and a long-term horizon of at least ten years, and shall explicitly identify its transmission channels, such as energy-label-driven collateral value changes, carbon-price-driven counterparty profitability and flood-related collateral damage.

10.4 The results of the short-term climate stress test shall be incorporated into the ICAAP adverse scenario where climate risk has been assessed as material under CER-POL-001.

## 11 Documentation, validation and data

11.1 Scenario design, satellite models and projection tools shall be documented in accordance with MRM-STD-021. For each exercise, a results document shall record scenarios, model versions, overlays, management actions and approvals.

11.2 Satellite models and the scenario generation model shall be validated in accordance with MV-STD-001 before first use and periodically according to their tier. Validation shall include the plausibility of results under the adverse scenario.

11.3 Data used in stress testing shall comply with MRM-STD-022 and shall be reconciled to the starting-point financial data.

11.4 After each ICAAP cycle, projections under the baseline scenario shall be compared with realised outcomes for the first projection year, and material deviations shall be analysed and reported to the Stress Testing Steering Committee.

## 12 Roles and responsibilities

12.1 **Enterprise Stress Testing (1LoD for stress test models)** designs scenarios, owns the scenario and satellite models, and coordinates the exercise.
12.2 **Risk-type modelling teams** (credit, market, ALM, climate) own risk-type satellite models and provide projections.
12.3 **Finance** projects P&L and capital and reconciles the starting point.
12.4 **Model Validation (2LoD)** validates in-scope models and reviews results plausibility.
12.5 **Stress Testing Steering Committee** approves scenario narratives and challenges results; the **Management Board** approves the programme and the ICAAP scenarios.
12.6 **Internal Audit (3LoD)** assesses the effectiveness of the stress testing programme.

## 13 Exceptions and dispensations

13.1 Deviations from this Standard require a dispensation approved by the Enterprise Risk Committee and, where a model provision is concerned, the Model Risk Committee. Dispensations are time-bound (maximum 12 months) and recorded in the MRM dispensation register.

## 14 Related documents

- EBA/GL/2018/04 — Guidelines on institutions' stress testing
- ECB Guide to the internal capital adequacy assessment process (ICAAP)
- EBA/GL/2025/01 — Guidelines on the management of ESG risks; EBA/GL/2025/04 — Guidelines on environmental scenario analysis
- ECB Guide on climate-related and environmental risks
- MRM-POL-001; MRM-STD-020; MRM-STD-021; MRM-STD-022; MRM-STD-023; MV-STD-001
- FIN-STD-200 IFRS 9 ECL Methodology Standard; CER-POL-001 Climate and Environmental Risk Policy; ALM-STD-400 IRRBB Behavioural Modelling Standard

## 15 Document history

| Version | Date | Change |
|---|---|---|
| 2.0 | 2023-05 | Alignment with ECB ICAAP Guide; reverse stress testing requirements. |
| 2.1 | 2024-11 | Challenger model requirement for Tier 1 satellite models. |
| 2.2 | 2026-01 | Climate scenario chapter aligned with EBA/GL/2025/01 and EBA/GL/2025/04; ex-post comparison of baseline projections. |
