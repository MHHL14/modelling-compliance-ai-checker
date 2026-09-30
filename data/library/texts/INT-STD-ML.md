# Machine Learning Model Standard

| | |
|---|---|
| **Reference** | AI-STD-700 |
| **Version** | 1.3 |
| **Date** | June 2026 |
| **Owner** | AI Governance Office / Model Risk Management |
| **Approval body** | Model Risk Committee, with the concurrence of the AI Governance Committee |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose

1.1 This standard sets the minimum requirements for the development, documentation, testing, retraining and monitoring of machine learning (ML) models at the Bank. It operationalises the principles of the Responsible AI Policy (AI-POL-001) and supplements the Model Development Standard (MRM-STD-020) and the Model Documentation Standard (MRM-STD-021) for the risks specific to ML techniques: opacity, overfitting, data leakage, instability, bias and drift.

1.2 The standard is consistent with the Model Risk Management Policy (MRM-POL-001), the AI Act (Regulation (EU) 2024/1689) for systems classified as high-risk, and supervisory expectations on the use of ML in internal models, including the EBA follow-up report on machine learning for IRB models (2023) and the ECB guide to internal models.

## 2 Scope and applicability

2.1 This standard applies to every model in the Model Inventory whose methodology includes an ML technique, including gradient boosting, random forests, neural networks, support vector machines, clustering and ML layers combined with rules-based or statistical components (for example an ML alert-prioritisation layer on top of rules-based transaction monitoring scenarios).

2.2 Linear and logistic regression models estimated with classical statistical methods are out of scope unless they use automated feature generation, penalised selection over more than 100 candidate features, or other ML techniques named in 2.1.

2.3 Requirements apply in proportion to model tier (MRM-STD-010). Provisions marked "Tier 1" apply to Tier 1 models only; all other provisions apply to all ML models. Generative AI systems are governed by AI-STD-710; this standard applies to them only where they include a trained predictive component.

## 3 Definitions

| Term | Definition |
|---|---|
| Development sample | Data used to fit model parameters (training) and to select hyperparameters (validation folds). |
| Test sample | Hold-out data never used for fitting or tuning, comprising an out-of-sample and, where outcomes permit, an out-of-time portion. |
| Data leakage | Use of information during development that would not be available at the moment of prediction in production, including target leakage and look-ahead bias. |
| Feature | An input variable to the model, whether raw or engineered. |
| Feature Register | The controlled list of model features with their definitions, sources, lineage, owners and rationale. |
| Protected attribute | A characteristic protected under EU and national equal-treatment law, including sex, age, ethnic origin, religion, disability and sexual orientation. |
| SHAP | SHapley Additive exPlanations, the attribution method used by the Bank for global and local explanations of ML models. |
| Reason code | A standardised, business-readable statement of a main driver of an individual model output. |
| Benchmark model | A simpler, interpretable model developed on the same data and target for comparison with the ML model. |
| PSI | Population Stability Index. |

## 4 Model design and justification

4.1 The model development document (MDD) shall justify the use of an ML technique for the stated purpose, describing the expected benefit over conventional techniques and the additional risks introduced.

4.2 The target variable, prediction horizon, unit of observation and intended use of the output shall be defined before data preparation starts and documented in the MDD. Any later change shall be documented with its rationale.

4.3 The full development pipeline — data extraction, feature generation, training, tuning, calibration and evaluation — shall be executable from version-controlled code with fixed random seeds and a recorded software environment, such that results can be reproduced by Model Validation (MRM-STD-021).

## 5 Data

5.1 **Representativeness.** The development data shall be representative of the population to which the model will be applied. Representativeness shall be demonstrated by comparing the distributions of the target and of the main features between the development sample and the current application portfolio; a PSI above 0.25 on the score or on any of the ten most important features shall be explained and its impact assessed.

5.2 **Sample splitting.** Data shall be split into development and test samples before any feature selection or tuning. The test sample shall include an out-of-time portion covering at least the most recent twelve months of available outcomes, unless the MDD demonstrates that the outcome window does not permit this.

5.3 **Leakage prevention.** Every feature shall be constructed point-in-time, using only information that would have been available at the prediction date in production. Features derived from the target, from post-event information or from processes triggered by the outcome (for example collection or case-management status) are prohibited.

5.4 **Leakage testing.** Any feature with a univariate AUC above 0.90 against the target, or whose removal reduces model AUC by more than five percentage points, shall be subject to a documented leakage review.

5.5 **Bias in data.** The RDS documentation shall analyse sources of bias in the data, including historical decision bias (for example accepted-only populations), label bias, under-representation of population segments and measurement bias. Mitigation measures, such as reject inference or reweighting, shall be documented with their effect.

5.6 **Data quality.** Data quality shall be assessed in accordance with the Data Quality Standard for Models (MRM-STD-022). Treatment of missing values by the algorithm (for example default split directions in tree-based models) shall be documented and its effect on explanations assessed.

## 6 Feature engineering and feature governance

6.1 Every feature used by the model shall be recorded in the Feature Register with its definition, source system, lineage, transformation logic, business rationale, owner and availability at the time of prediction.

6.2 Protected attributes shall not be used as model features. Features shall be screened for proxy effects: a feature for which the protected attribute can be predicted with an AUC above 0.65, or with an association (Cramér's V) above 0.30, shall be reviewed and either removed or retained with a documented justification approved by the AI Governance Office.

6.3 Engineered features shall have an economic or behavioural interpretation. Automatically generated features without an interpretable definition are not permitted for Tier 1 models.

6.4 Feature selection shall be performed on the development sample only and shall favour parsimony. Features with negligible contribution to performance (mean absolute SHAP value below 1% of the total) shall be removed unless retained for a documented business reason.

## 7 Training, hyperparameter tuning and overfitting controls

7.1 The hyperparameter search space, search method, objective function and selection criterion shall be documented in the MDD. Tuning shall use cross-validation or a validation split within the development sample; the test sample shall not be used for any tuning decision.

7.2 Overfitting shall be controlled through regularisation, early stopping, constraints on model complexity or equivalent techniques, and the controls applied shall be documented.

7.3 The difference in discriminatory power between development and test samples shall be reported. For classification models, an absolute Gini gap above five percentage points requires a documented justification; a gap above ten percentage points is not acceptable for production use.

7.4 Where the risk logic establishes the direction of the relationship between a feature and the target (for example days past due, loan-to-value or debt-service ratio in credit risk models), monotonic constraints shall be imposed in the algorithm. Features without an established direction may be left unconstrained, with the choice documented.

7.5 Compliance with monotonic constraints and the plausibility of the learned relationships shall be verified with partial dependence or individual conditional expectation analysis on the test sample.

7.6 Where the model output is used as a probability (for example a PD), a separate calibration step shall be applied and tested. Calibration requirements of the applicable standard (for IRB models CRM-STD-100) apply to the calibrated output.

## 8 Explainability

8.1 Global explainability shall be provided by SHAP feature importance computed on the test sample, supplemented by SHAP dependence plots for at least the ten most important features. The analysis shall confirm that the main drivers are consistent with business expectations.

8.2 Local explanations shall be available for every individual prediction used in a decision. For Tier 1 models and for models that drive decisions on individual customers or alerts, the local SHAP values of each production prediction shall be stored with the prediction.

8.3 Where model outputs lead to a decision communicated to a customer or reviewed by an analyst, the model shall produce reason codes: the main contributing features, ranked by contribution and mapped to standardised business-readable statements. The mapping shall be documented and reviewed by the business for comprehensibility.

8.4 The fidelity of the explanation method shall be tested: SHAP values shall add up to the model output within numerical tolerance, and the stability of explanations for similar inputs shall be assessed.

## 9 Fairness testing

9.1 Every ML model whose outputs affect natural persons shall be tested for fairness before approval and at every periodic review. The test shall cover at least sex and age group, and other protected attributes where the data are lawfully available under PRIV-POL-001.

9.2 Fairness shall be measured with at least: (a) the ratio of favourable-outcome rates between the least and most favoured group, which shall be at least 0.80; and (b) the difference in true-positive rates between groups, which shall not exceed five percentage points. Calibration by group shall be reported for probability models.

9.3 A breach of a fairness threshold shall be analysed for root cause and either mitigated or justified by a legitimate, documented risk rationale. Retention of a model with a threshold breach requires approval of the AI Governance Office.

9.4 Protected attributes collected solely for fairness testing shall be kept separate from the modelling data, access-restricted and not used for any other purpose.

## 10 Performance, stability and benchmarking

10.1 Model performance shall be measured on the test sample with metrics appropriate to the use (discrimination, calibration, precision and recall at the operating threshold), and reported with confidence intervals for Tier 1 models.

10.2 Stability shall be demonstrated across time periods (at least quarterly cohorts), relevant segments and repeated training with different random seeds; for Tier 1 models the Gini standard deviation across five seeds shall not exceed one percentage point.

10.3 Every ML model shall be benchmarked against a simpler, interpretable model developed on the same data and target. The MDD shall report the performance uplift. Where the uplift in Gini is below two percentage points, the simpler model shall be preferred unless the use of the ML model is justified on other documented grounds.

10.4 Robustness shall be tested through sensitivity analysis on the main features, including the effect of plausible data errors and, for fraud and financial crime models, of adversarial behaviour.

## 11 Retraining governance

11.1 The MDD shall define the retraining approach: trigger events, frequency, data window, the parts of the pipeline that may change (parameters, hyperparameters, features) and the acceptance tests that a retrained model must pass.

11.2 Every retraining shall be classified under the Model Change and Regulatory Notification Standard (MRM-STD-050). Retraining that changes the feature set, the target or the algorithm is a model change requiring validation and approval.

11.3 Continuous or online learning in production is prohibited for Tier 1 and Tier 2 models. For Tier 3 models it requires approval by the Model Risk Committee with automated guardrails and monitoring.

11.4 Each retrained version shall be registered with its training data snapshot, code version, hyperparameters and acceptance-test results before deployment.

## 12 Monitoring of drift

12.1 ML models shall be monitored in accordance with the Model Monitoring Standard (MRM-STD-040) and this section. The monitoring plan shall be part of the MDD.

12.2 Input drift shall be monitored with the PSI on the score and on the ten most important features: at least monthly for real-time models and at least quarterly for other models. A PSI above 0.10 is amber and above 0.25 is red.

12.3 Performance shall be monitored as soon as outcomes become available, against thresholds defined in the monitoring plan. Explanation drift (change in the ranking of global SHAP importance) and fairness metrics shall be monitored at least semi-annually.

12.4 Red monitoring results shall be escalated to the model owner and Model Risk Management within ten business days, with an action plan that may include recalibration, retraining or model restriction.

## 13 Roles and responsibilities

| Role | Responsibilities |
|---|---|
| Model owner (1LoD) | Accountable for compliance with this standard and for the Feature Register of the model. |
| Model developers (1LoD) | Develop, test and document the model in accordance with this standard. |
| AI Governance Office (2LoD) | Maintains this standard, approves proxy and fairness justifications. |
| Model Risk Management (2LoD) | Oversees application of this standard within the model lifecycle. |
| Model Validation (2LoD) | Validates ML models against this standard under MV-STD-020. |

## 14 Exceptions and dispensations

14.1 Deviations from this standard require a dispensation approved by the Model Risk Committee, recorded in the Model Inventory with compensating controls and an expiry date of no more than twelve months.

## 15 Related documents

- AI-POL-001 Responsible AI Policy; AI-STD-710 Generative AI Use Standard
- MRM-POL-001 Model Risk Management Policy; MRM-STD-010, MRM-STD-020, MRM-STD-021, MRM-STD-022, MRM-STD-040, MRM-STD-050
- MV-STD-020 AI and ML Validation Standard; CRM-STD-100 IRB Rating System Standard
- PRIV-POL-001 Privacy and Data Protection Policy
- Regulation (EU) 2024/1689 (AI Act), Art. 10, 13, 14 and 15; Regulation (EU) 2016/679 (GDPR), Art. 22
- EBA follow-up report on machine learning for IRB models (2023); ECB guide to internal models

## 16 Document history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2023-11 | First issue. |
| 1.2 | 2025-04 | Fairness thresholds, reason codes, benchmark requirement. |
| 1.3 | 2026-06 | Alignment with AI-POL-001 v2.0; leakage testing; retraining governance; explanation drift monitoring. |
