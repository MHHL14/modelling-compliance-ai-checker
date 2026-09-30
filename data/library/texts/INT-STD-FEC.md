# Financial Crime Model Standard

| | |
|---|---|
| **Reference** | FEC-STD-600 |
| **Version** | 1.8 |
| **Date** | March 2026 |
| **Owner** | Financial Crime Compliance / Model Risk Management |
| **Approval body** | Model Risk Committee, with the concurrence of the Financial Economic Crime Committee |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose

1.1 This standard sets the minimum requirements for the design, calibration, testing, tuning, documentation and monitoring of models used to detect and prevent financial economic crime (FEC models): transaction monitoring scenarios and rules, alert prioritisation models, customer risk rating (CRR) methodologies, sanctions screening configurations and fraud detection models.

1.2 It implements the Financial Economic Crime Policy (FEC-POL-001) for FEC models and applies the Model Risk Management Policy (MRM-POL-001), the Model Development Standard (MRM-STD-020) and the Model Documentation Standard (MRM-STD-021) to them. FEC models using machine learning are also subject to the Machine Learning Model Standard (AI-STD-700).

1.3 The standard supports compliance with the Wwft, Regulation (EU) 2024/1624 (AMLR) from its date of application, the DNB guidance on the Wwft and the Sanctions Act, and, for payment fraud, Commission Delegated Regulation (EU) 2018/389 (PSD2 RTS).

## 2 Scope and applicability

2.1 This standard applies to every FEC model recorded in the Model Inventory, whether developed in-house or provided by a vendor, including rules-based scenarios configured in vendor platforms.

2.2 Rules-based transaction monitoring scenarios and expert-based CRR methodologies are models for the purpose of this standard and MRM-POL-001, irrespective of whether they involve statistical estimation.

2.3 Sections 5 to 8 apply to transaction monitoring; section 9 to CRR; section 10 to fraud detection; all other sections apply to all FEC models.

## 3 Definitions

| Term | Definition |
|---|---|
| Scenario | A detection rule or combination of rules designed to identify a specific money laundering, terrorist financing or fraud typology. |
| Threshold | A parameter value in a scenario above which an alert is generated. |
| Segment | A group of customers or accounts with homogeneous expected behaviour to which common thresholds apply. |
| Productive alert | An alert that is escalated to a case investigation or results in a report to FIU-Nederland. |
| Above-the-line (ATL) testing | Review of alerts generated at current thresholds to assess alert quality and productivity. |
| Below-the-line (BTL) testing | Review of events just below current thresholds to assess whether relevant activity is missed. |
| Alert prioritisation model | A model that scores alerts to determine their order of handling or eligibility for auto-closure. |
| Coverage matrix | The documented mapping of SIRA risks and typologies to detection scenarios and models. |
| False-positive ratio | For fraud models, the number of genuine transactions flagged per confirmed fraudulent transaction flagged, at the operating threshold. |

## 4 General requirements

4.1 Every FEC model shall be registered in the Model Inventory, tiered under MRM-STD-010 and assigned a model owner in FEC Analytics or Fraud Analytics.

4.2 Every FEC model shall be registered in the AI Inventory with an assessment against the AI system definition under AI-POL-001 §5.2. Where the model is concluded not to be an AI system, the reasoning shall be documented.

4.3 The coverage of FEC models shall be demonstrated through the coverage matrix maintained with the SIRA (FEC-POL-001 §4.4). Every material SIRA risk shall be covered by at least one scenario or model, or the gap shall be recorded with a remediation plan approved by Financial Crime Compliance.

4.4 Expert judgement used in scenario design, segmentation, threshold setting or risk-factor weighting shall be documented and approved in accordance with the Expert Judgement Standard (MRM-STD-023).

## 5 Scenario and rule design

5.1 Each scenario shall have a documented objective that identifies the typology it addresses, the SIRA risk to which it is mapped and the customer, product and channel population to which it applies.

5.2 The scenario logic, parameters, look-back periods, aggregation rules and exclusions shall be specified in a scenario specification that is sufficiently precise to allow independent re-implementation.

5.3 Exclusions from the scenario population (for example specific customer types or transaction codes) shall be justified and their volume quantified.

5.4 New or changed scenarios shall be tested before production on historical data, reporting expected alert volumes, the share of historically productive cases detected and overlap with existing scenarios.

## 6 Segmentation and threshold calibration

6.1 Customers and accounts shall be segmented into groups with homogeneous expected behaviour, at least distinguishing natural persons, small businesses and corporates. The segmentation method and its statistical support shall be documented and reviewed annually.

6.2 Initial thresholds shall be calibrated per segment on the statistical distribution of the relevant parameter (for example percentiles of transaction value or frequency) and documented with the rationale for the selected percentile, including the expected alert volume.

6.3 Where thresholds are set or adjusted by expert judgement or to manage alert volumes, the risk-based rationale shall be documented. Operational capacity alone is not an acceptable rationale for raising a threshold.

## 7 Above-the-line and below-the-line testing

7.1 ATL testing shall be performed for every scenario at least annually. It shall report per scenario and segment: alert volume, the share of productive alerts, the share of alerts resulting in a report to FIU-Nederland, and the quality of alert disposition based on a quality-assurance sample of closed non-productive alerts.

7.2 BTL testing shall be performed for every threshold-based scenario at least annually and after any threshold increase. Events shall be generated in bands below the current threshold, down to at least 20% below it, and reviewed by trained analysts blind to the fact that they are test events.

7.3 The BTL sample size per band shall be determined statistically. As a minimum, 59 events per band shall be reviewed so that the absence of productive events supports, at 95% confidence, a productive rate below 5% in that band.

7.4 Where BTL testing identifies productive events, the threshold shall be lowered to capture them or the decision not to lower it shall be justified with a documented risk assessment and approved by Financial Crime Compliance.

7.5 The ATL and BTL testing methodology, samples, reviewer decisions and conclusions shall be documented in a testing report retained with the model documentation.

## 8 Alert prioritisation and auto-closure models

8.1 Alert prioritisation models shall be developed and documented in accordance with AI-STD-700 where they use machine learning. The target definition (productive alert) and the label source shall be documented.

8.2 The model documentation shall assess the feedback-loop bias arising from labels based on past analyst decisions. To mitigate it, a random sample of at least 2% of low-priority alerts shall be reviewed each month irrespective of their score, and the outcomes used for monitoring and retraining.

8.3 Prioritisation scores shall determine the order of alert handling. They shall not suppress alerts unless an auto-closure band has been approved under FEC-POL-001 §6.5.

8.4 An auto-closure band shall not contain more than 1% of the productive alerts in the out-of-time test sample. The share of productive alerts in the auto-closed band shall be monitored monthly through quality-assurance review of at least 50 auto-closed alerts.

8.5 The discriminatory power of the prioritisation model shall be measured on an out-of-time sample and reported per scenario group, together with the recall of productive alerts in each priority band.

## 9 Customer risk rating methodology

9.1 The CRR methodology shall assess at least customer, product and service, delivery channel and geographic risk factors. The selection of risk factors and their weights shall be justified with reference to the SIRA and the risk factors listed in the applicable AML legislation.

9.2 Mandatory high-risk triggers (including politically exposed persons, customers linked to high-risk third countries and adverse FIU or law-enforcement information) shall override the calculated score and assign at least the High class.

9.3 The class boundaries shall be documented with their rationale, and the resulting distribution of customers over risk classes shall be reported and compared with the SIRA expectation.

9.4 The CRR methodology shall be back-tested at least annually: the incidence of FIU reports, exits for integrity reasons and confirmed financial crime cases shall increase monotonically from Low to High class. Deviations shall be analysed and addressed.

9.5 CRR overrides shall be monitored; where more than 5% of customers in a segment are overridden in a year, the methodology shall be reviewed.

9.6 Risk-factor weights and class boundaries shall be reviewed at least annually and after each SIRA update.

## 10 Fraud detection models

10.1 Fraud labels shall include confirmed fraud reported through customer claims, chargebacks and investigations. The label maturity window (at least 90 days after the transaction for card fraud) shall be documented and taken into account in development and performance measurement.

10.2 Fraud model performance shall be measured at the operating threshold by at least: detection rate by count, detection rate by value, and false-positive ratio, per payment channel. Targets for each metric shall be set in the model documentation.

10.3 The operating threshold shall be set through a documented analysis of fraud losses prevented, customer impact of false positives and operational capacity, approved by the model owner and Fraud Risk Management.

10.4 The false-positive ratio shall be monitored weekly. A sustained breach of the documented target for four consecutive weeks shall trigger a root-cause analysis and, where necessary, recalibration.

10.5 Real-time fraud models shall meet documented latency requirements, and fallback behaviour when the model is unavailable shall be defined and tested.

10.6 Where fraud models support the transaction-risk-analysis exemption under Art. 18 of Delegated Regulation (EU) 2018/389, the model documentation shall show how the real-time risk analysis meets that article and how fraud rates are calculated under Art. 19.

10.7 Fraud models shall be monitored for adaptation by fraudsters, including emerging typologies not represented in the training data, through analysis of undetected fraud at least monthly.

## 11 Periodic tuning and performance monitoring

11.1 Every transaction monitoring scenario shall be tuned at least annually and after material changes in products, customer base, typologies or data. Tuning shall use the results of ATL and BTL testing.

11.2 Scenarios with no productive alerts over twelve months shall be reviewed for redesign; retirement of a scenario requires evidence that the underlying SIRA risk remains covered and approval by the Financial Economic Crime Committee.

11.3 Monitoring of FEC models shall be performed under MRM-STD-040 and shall include at least monthly reporting of alert volumes, productive rates and data-feed completeness per scenario or model.

## 12 Data and implementation

12.1 Data feeds into FEC models shall be reconciled monthly against source systems on transaction counts and values; unexplained differences above 0.1% shall be investigated and reported to Financial Crime Compliance.

12.2 The implementation of each scenario and model in the production platform shall be tested against its specification before release, including reconciliation of alerts generated by an independent re-implementation on a test data set, in accordance with MRM-STD-030.

## 13 Documentation

13.1 Every FEC model shall be documented in accordance with MRM-STD-021. For transaction monitoring, the documentation shall include a scenario library containing, per scenario: objective, SIRA mapping, specification, segments, thresholds and their rationale, exclusions, test results and tuning history.

13.2 Tuning decisions, including decisions not to change thresholds, shall be documented with supporting analysis and approval.

## 14 Roles and responsibilities

| Role | Responsibilities |
|---|---|
| Model owner (FEC Analytics / Fraud Analytics, 1LoD) | Develops, tunes, documents and monitors FEC models. |
| Financial Crime Compliance (2LoD) | Co-owns this standard; approves coverage gaps, thresholds rationale and BTL outcomes. |
| Financial Economic Crime Committee | Approves auto-closure bands and scenario retirement. |
| Model Risk Management (2LoD) | Co-owns this standard; oversees FEC models within the model lifecycle. |
| Model Validation – Financial Crime (2LoD) | Independently validates FEC models. |

## 15 Exceptions and dispensations

15.1 Deviations require a dispensation approved jointly by Financial Crime Compliance and the Model Risk Committee, limited to six months and recorded in the Model Inventory with compensating controls.

## 16 Related documents

- FEC-POL-001 Financial Economic Crime Policy; AI-POL-001; AI-STD-700
- MRM-POL-001; MRM-STD-010; MRM-STD-020; MRM-STD-021; MRM-STD-023; MRM-STD-030; MRM-STD-040
- Wwft; DNB Guidance on the Wwft and the Sanctions Act; Regulation (EU) 2024/1624 (AMLR)
- Delegated Regulation (EU) 2018/389 (PSD2 RTS on SCA)

## 17 Document history

| Version | Date | Change |
|---|---|---|
| 1.5 | 2024-09 | BTL sampling methodology. |
| 1.8 | 2026-03 | Alignment with FEC-POL-001 v6.0; auto-closure bands; feedback-loop bias; fraud false-positive monitoring; AI Inventory registration. |
