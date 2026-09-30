# AI and ML Validation Standard

| | |
|---|---|
| **Title** | AI and ML Validation Standard |
| **Reference** | MV-STD-020 |
| **Version and date** | v1.2 (2026-06) |
| **Owner** | Model Validation (2LoD) – Head of Model Validation |
| **Approval body** | Model Risk Committee |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose

1.1 This Standard sets the additional validation requirements for machine-learning (ML) models and generative AI (GenAI) applications. It supplements MV-STD-001 and the ML-specific tests of MV-HB-003 §11, and implements the validation aspects of the Responsible AI Policy (AI-POL-001), the Machine Learning Model Standard (AI-STD-700) and the Generative AI Use Standard (AI-STD-710).

1.2 The Standard supports compliance with Regulation (EU) 2024/1689 (AI Act), in particular the requirements for high-risk AI systems on risk management (Art. 9), data and data governance (Art. 10), transparency (Art. 13), human oversight (Art. 14) and accuracy, robustness and cybersecurity (Art. 15). Where an ML model is used in an IRB rating system, the ECB guide to internal models and MV-STD-010 apply in addition.

## 2 Scope and applicability

2.1 The Standard applies to all models in the model inventory tagged as ML or GenAI under MRM-STD-010, including models and AI components supplied by third parties.

2.2 Sections 5 to 8 apply to ML models; section 9 applies to GenAI applications; section 10 applies to third-party models; sections 4 and 11 apply to all models in scope.

## 3 Definitions

- **ML model** – a model whose functional form is learned from data by an algorithm with limited ex-ante specification, such as gradient boosting, random forests and neural networks.
- **GenAI application** – an application that uses a foundation model, such as a large language model (LLM), to generate text, code or other content.
- **Feature** – an input variable of an ML model, including engineered transformations of source data.
- **Protected characteristic** – a characteristic on which unjustified differentiation is prohibited under AI-POL-001, such as sex, age, nationality, ethnic origin and disability.
- **Groundedness** – the share of generated answers whose material claims are supported by the sources provided to the model.
- **Hallucination rate** – the share of generated answers that contain at least one material claim that is incorrect or not supported by the sources.
- **Guardrail** – a technical control that prevents or filters undesired inputs or outputs of a GenAI application.

## 4 Validation approach

4.1 **AI Act classification.** MV verifies that the AI Act classification of the model recorded under AI-POL-001 is correct and documented, including the assessment against Annex III point 5(b) (creditworthiness assessment and credit scoring of natural persons). For high-risk AI systems MV verifies that the validation covers the requirements of Articles 10, 14 and 15 of the AI Act relevant to the model.

4.2 **Complexity justification.** MV assesses whether the use of an ML technique is justified against an interpretable alternative, taking into account the performance uplift measured under MV-HB-003 §11.3, the explainability achieved and the intended use.

4.3 **Tiering.** An ML model used in a high-risk AI system under the AI Act is validated at least at the scope of a Tier 2 model under MV-STD-001 §4.5, irrespective of its inventory tier.

## 5 Data and features

5.1 **Leakage.** MV tests for target leakage (features containing information not available at the prediction date) and for leakage between training, test and out-of-time samples, including the same obligor or customer appearing in more than one sample.

5.2 **Feature review.** MV verifies that each feature has a documented definition, data lineage and business rationale, and independently reproduces from source data at least the 20 most important features.

5.3 **Labels.** MV assesses the definition and quality of the target variable. Where labels are assigned by humans, MV verifies that labelling quality is measured, with an inter-annotator agreement (Cohen's kappa) of at least 0.8 or a documented justification.

5.4 **Protected characteristics and proxies.** MV verifies that protected characteristics are not used as features unless permitted under AI-POL-001, and screens features for proxies of protected characteristics.

5.5 **Representativeness.** MV assesses whether training, validation and testing data are relevant and sufficiently representative for the intended use, as required by AI Act Art. 10(3), using the tests of MV-HB-003 §6.

## 6 Explainability review

6.1 MV independently computes global feature importance, using at least one model-agnostic method such as SHAP values or permutation importance, and compares it with the developer's results.

6.2 MV assesses the direction and shape of the effect of the main features using partial dependence or accumulated local effects plots. Where business logic implies a monotonic relationship, violations are justified or constrained.

6.3 For models whose outputs affect individual customers, MV verifies that local explanations and reason codes are stable, faithful to the model and meaningful to the user, in support of AI Act Art. 13 and the information obligations of AI-POL-001.

6.4 Where a surrogate model is used for explanation, MV verifies its fidelity to the ML model; fidelity below 90% agreement or R² below 0.9 is a finding.

## 7 Fairness testing

7.1 For models whose outputs affect natural persons, MV performs fairness testing across protected characteristics for which data is lawfully available, in line with AI-POL-001 and PRIV-POL-001.

7.2 MV computes at least: the adverse-impact ratio of favourable outcomes between groups, which is amber below 0.80; the difference in true positive rates between groups, which is amber above 5 percentage points; and calibration within groups using the tests of MV-HB-003 §7.

7.3 A disparity beyond the thresholds of §7.2 is accepted only if it is explained by a documented, legitimate risk factor and no less discriminatory alternative with comparable performance is available. An unexplained disparity is a finding of at least Medium severity.

7.4 The processing of special categories of personal data for fairness testing is limited to what is permitted by AI Act Art. 10(5) and PRIV-POL-001.

## 8 Robustness and adversarial tests

8.1 MV performs perturbation tests by applying small changes to continuous inputs (at least ±5%) and reports the share of changed grades or decisions; a share above 5% is amber.

8.2 MV tests the model behaviour for missing, out-of-range and extreme input values and verifies that the implemented handling matches the documentation.

8.3 For models exposed to adversarial behaviour, such as fraud detection, AML transaction monitoring and customer-facing applications, MV performs adversarial tests that simulate evasion or manipulation and reports the resulting degradation of detection or performance.

8.4 MV verifies that risks of data poisoning, model extraction and model inversion have been assessed with Information Security, in support of AI Act Art. 15(5).

## 9 GenAI evaluation

9.1 **Evaluation set.** MV verifies, or builds, a use-case-specific evaluation set of at least 300 prompts that covers typical, edge-case and adversarial inputs, with reference answers prepared or reviewed by subject-matter experts.

9.2 **Groundedness.** MV measures groundedness on the evaluation set. Groundedness below 95% is amber and below 90% is red.

9.3 **Hallucination rate.** MV measures the hallucination rate on the evaluation set. A rate above 2% is amber and above 5% is red; for customer-facing applications the red threshold is 2%.

9.4 **Guardrail tests.** MV tests the guardrails against prompt injection, jailbreak attempts, toxic or discriminatory content, leakage of personal or confidential data and out-of-scope requests. A block rate below 98% on red-team prompts is red; any leakage of personal data is red.

9.5 **Automated evaluators.** Where an LLM is used as an automated evaluator, MV verifies its agreement with human evaluation on at least 100 samples; agreement below 85% invalidates the automated results.

9.6 **Non-determinism.** MV repeats the evaluation at least three times with the production configuration and reports the variability of the metrics of §§9.2–9.3.

9.7 **Version changes.** A change of the foundation model or its version, of the system prompt or of the retrieval configuration is a model change under MRM-STD-050 and requires re-execution of §§9.2–9.4 before deployment.

## 10 Third-party model validation

10.1 MV verifies that the vendor documentation is sufficient to assess the methodology, training data, performance and limitations of the model. Where transparency is insufficient, MV performs compensating outcome-based testing and raises a finding.

10.2 MV performs outcome testing of a third-party model on the bank's own data before first use.

10.3 MV verifies that the contract under TPR-POL-001 provides for access to validation-relevant information and for notification of model changes, and that notified changes trigger a change validation.

10.4 The use of a third-party model does not transfer the responsibility for validation; the validation opinion is issued by MV under MV-STD-001.

## 11 Monitoring expectations

11.1 MV verifies that the monitoring plan under MRM-STD-040 contains AI-specific metrics with thresholds consistent with this Standard: data drift per feature, performance, fairness metrics and, for GenAI applications, sampled hallucination rate, guardrail triggers and user feedback.

11.2 Monitoring of Tier 1 ML models and customer-facing GenAI applications takes place at least monthly.

11.3 MV verifies that human oversight under AI Act Art. 14 is effective, by reviewing override logs and a sample of human reviews of model outputs.

11.4 Where a model is retrained automatically, MV verifies that the retraining protocol defines the permitted changes and performance boundaries and has been validated; retrained versions outside these boundaries are subject to change validation.

## 12 Roles and responsibilities

- **Head of Model Validation** – owns this Standard and signs off validation reports on AI and ML models.
- **Validators (AI and Advanced Analytics)** – perform the tests of this Standard.
- **Model owner (1LoD)** – provides data, code, vendor documentation and evaluation infrastructure.
- **Responsible AI Office** – maintains the AI Act classification under AI-POL-001.
- **Information Security** – supports the security assessments under §8.4.

## 13 Exceptions and dispensations

13.1 Deviations from this Standard require a dispensation approved by the Head of Model Validation and reported to the Model Risk Committee. Thresholds of §§7 and 9 may be set more strictly per use case in the validation scoping memo.

## 14 Related documents

- Regulation (EU) 2024/1689 (AI Act), Articles 9, 10, 13, 14, 15 and Annex III
- Regulation (EU) No 575/2013 (CRR), Article 185; ECB guide to internal models; EBA supervisory handbook on the validation of rating systems under the IRB approach
- MRM-POL-001; AI-POL-001 Responsible AI Policy; PRIV-POL-001; TPR-POL-001
- AI-STD-700 Machine Learning Model Standard; AI-STD-710 Generative AI Use Standard; MRM-STD-040; MRM-STD-050
- MV-STD-001; MV-STD-002; MV-HB-003

## 15 Document history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2024-10 | First issue. |
| 1.1 | 2025-06 | GenAI evaluation chapter added. |
| 1.2 | 2026-06 | Alignment with AI Act obligations for high-risk AI systems; automated-evaluator calibration and non-determinism tests added. |
