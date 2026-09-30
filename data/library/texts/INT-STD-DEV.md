# Model Development Standard

| | |
|---|---|
| **Title** | Model Development Standard |
| **Reference** | MRM-STD-020 |
| **Version and date** | v4.1 (2026-05) |
| **Owner** | Model Risk Management (2LoD) |
| **Approval body** | Model Risk Committee |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose

1.1 This Standard sets the minimum requirements for the development of new models and the redevelopment of existing models, from development planning to the handover to implementation. It implements section 5.3(b) and gate G1 of the Model Risk Management Policy (MRM-POL-001).

1.2 The Standard is consistent with CRR Art. 174 (use of models) and Art. 179 (requirements on estimation) for IRB models, the EBA Guidelines on PD and LGD estimation (EBA/GL/2017/16) and the ECB guide to internal models. SR 11-7 (model development, implementation and use) and PRA SS1/23 Principle 3 are used as reference good practice.

## 2 Scope and applicability

2.1 This Standard applies to all models within the scope of MRM-POL-001 that are developed or redeveloped by or for the Bank, including vendor models to the extent that the Bank calibrates, configures or adapts them.

2.2 Requirements apply proportionately to the model tier where this is stated. Model-type specific standards (in particular CRM-STD-100 for IRB, FIN-STD-200 for IFRS 9, AI-STD-700 for ML) add to this Standard.

## 3 Definitions

Terms defined in MRM-POL-001 apply. In addition:
- **Reference data set (RDS)**: the data set used to develop, estimate and calibrate the model, as documented in accordance with MRM-STD-021.
- **Model development document (MDD)**: the document describing the model design, methodology, calibration, performance and limitations, following the MDD template of MRM-STD-021.
- **Challenger model**: an alternative model developed on the same data to test whether the selected model is appropriate.
- **Benchmark**: an external or internal reference (external ratings, industry models, supervisory benchmarks, previous model version) against which model outcomes are compared.
- **Limitations log**: the register of model assumptions and limitations maintained for each model.

## 4 Development planning

4.1 Before development starts, the model developer prepares a development plan that states the model purpose and intended use, the scope of application, the applicable regulatory and internal requirements, the planned data sources, the candidate methodologies, the planned tests, the timeline and the roles involved. The model owner approves the plan.

4.2 For Tier 1 models the development plan is shared with Model Validation before development starts, to allow early identification of methodological concerns. Early engagement does not compromise the independence of the later validation.

4.3 The model developer derives the applicable requirement set from the Bank's requirement library at the start of development and uses it to plan evidence and documentation.

## 5 Data

5.1 The RDS is constructed in accordance with the Data Quality Standard for Models (MRM-STD-022) and the Data Management and Governance Policy (DATA-POL-001), and is documented using the RDS documentation template of MRM-STD-021.

5.2 The RDS is approved by the model owner before model estimation starts (RDS sign-off). Material changes to the RDS after sign-off require a renewed sign-off.

5.3 The model developer defines development, out-of-sample and out-of-time samples before estimation and records the sampling approach. The out-of-time sample is not used for variable selection or parameter estimation.

5.4 Candidate variables are assessed for economic rationale, data availability at the point of use, stability over time and, for models processing personal data, compliance with data minimisation and fair treatment requirements (PRIV-POL-001, CR-POL-001).

## 6 Methodology selection and alternatives

6.1 The model developer assesses at least two alternative methodologies for every Tier 1 and Tier 2 model and documents the criteria used, including regulatory requirements, data availability, predictive performance, stability, interpretability, implementation constraints and industry practice.

6.2 The selected methodology is justified against the alternatives. Where a less transparent methodology is selected over a more transparent one of comparable performance, the gain in performance and the additional controls are demonstrated.

6.3 The model developer documents the variable selection process, including univariate and multivariate analysis, the treatment of correlated variables, and a check that the sign and magnitude of each final driver are consistent with economic intuition.

6.4 For IRB models the methodology meets the requirements of CRR Art. 179 and CRM-STD-100, and the risk differentiation and risk quantification steps are documented separately.

## 7 Assumptions and limitations

7.1 The model developer identifies all material assumptions of the model, including assumptions on data, on the relationship between drivers and target, on the stability of that relationship and on the intended use, and assesses their plausibility.

7.2 Every model has a limitations log. Each entry contains an identifier, a description, the source (data, methodology, implementation or use), the estimated impact, the mitigating measure (such as margin of conservatism, post-model adjustment, restricted use or monitoring), and the owner.

7.3 The limitations log is part of the MDD and is kept up to date throughout the model's life. Material limitations are reported to the approval authority at gate G3 and recorded in the model inventory.

## 8 Performance testing

8.1 The model developer tests model performance on the development, out-of-sample and out-of-time samples, covering at least discriminatory power, calibration accuracy and stability, using metrics and thresholds consistent with the Validation Testing Handbook (MV-HB-003).

8.2 Performance is tested at the level of the whole model and of each material segment, grade or pool.

8.3 Where a performance metric falls outside the threshold, the model developer analyses the cause, records the outcome in the limitations log and proposes a mitigating measure.

## 9 Benchmarking and challenger models

9.1 For every Tier 1 model the model developer builds at least one challenger model or, where a challenger model is not feasible, compares the model with at least one external or internal benchmark.

9.2 For every Tier 2 model the model developer compares the model with at least one benchmark, which may be the previous model version.

9.3 Differences between the model and the challenger or benchmark are explained. Where the challenger outperforms the selected model on a material metric, the choice of the selected model is justified.

## 10 Sensitivity analysis

10.1 The model developer performs sensitivity analyses on the key assumptions, parameters and input data of every Tier 1 and Tier 2 model, including the effect of plausible alternative choices on data exclusions, default or target definitions, calibration window and expert judgements.

10.2 The results of sensitivity analyses are documented with their impact on model output and, for IRB models, are used to support the quantification of the margin of conservatism in accordance with CRM-STD-101.

## 11 Expert judgement

11.1 Expert judgement applied in data treatment, variable selection, segmentation, calibration or overrides is identified, documented, justified and approved in accordance with the Expert Judgement Standard (MRM-STD-023).

11.2 The impact of material expert judgements is quantified through sensitivity analysis under section 10.

## 12 Code and reproducibility

12.1 All code used to build the RDS and to estimate and calibrate the model is held in the Bank's version control system. Development results are produced from a tagged code version.

12.2 Code is reviewed by a second developer who did not write it (four-eyes review) before the development results are submitted to Model Validation.

12.3 The software environment, including package versions and random seeds, is recorded so that development results can be reproduced by Model Validation.

## 13 AI and machine learning models

13.1 For ML models the model developer additionally documents hyperparameter tuning, measures against overfitting, explainability at global and individual level, and fairness testing, in accordance with AI-STD-700.

## 14 Sign-offs

14.1 The following sign-offs are obtained and recorded in the model inventory: development plan (model owner); RDS (model owner); methodology and final model (model owner and head of the modelling unit).

14.2 Gate G1 is passed when the RDS documentation and the MDD have been approved in accordance with MRM-STD-021 and the 1LoD self-assessment against the applicable requirement set has been completed.

14.3 The model developer does not submit a model to Model Validation before gate G1 has been passed.

## 15 Handover to implementation

15.1 On approval of the model, the model developer hands over to the implementation team an implementation specification, the final coefficients or trained model artefacts, test cases and reference outputs computed in the development environment.

15.2 The implementation is tested against the reference outputs in accordance with the Model Implementation and Testing Standard (MRM-STD-030). The model developer confirms that differences are within the tolerances set in MRM-STD-030 before go-live (gate G4).

## 16 Roles and responsibilities

16.1 The model developer is responsible for compliance with this Standard. The model owner approves the development plan, the RDS and the final model. MRM monitors adherence and may challenge any development choice. Model Validation assesses compliance with this Standard as part of the validation.

## 17 Exceptions

17.1 Exceptions are handled as dispensations under MRM-POL-001 §13. For Tier 3 models, sections 6.1, 9 and 10 may be applied in simplified form with the agreement of MRM.

## 18 Related documents

External: CRR Art. 174, 179 and 180; EBA/GL/2017/16; ECB guide to internal models; SR 11-7; PRA SS1/23 Principle 3 (reference only).

Internal: MRM-POL-001 Model Risk Management Policy; MRM-STD-021 Model Documentation Standard; MRM-STD-022 Data Quality Standard for Models; MRM-STD-023 Expert Judgement Standard; MRM-STD-030 Model Implementation and Testing Standard; CRM-STD-100 IRB Rating System Standard; CRM-STD-101 Margin of Conservatism Standard; AI-STD-700 Machine Learning Model Standard; MV-HB-003 Validation Testing Handbook; DATA-POL-001; PRIV-POL-001; CR-POL-001.

## 19 Document history

| Version | Date | Change | Approved by |
|---|---|---|---|
| 3.0 | June 2022 | Challenger requirement for Tier 1; limitations log | MRC |
| 4.0 | September 2024 | Alignment with CRR3; out-of-time sample; code review | MRC |
| 4.1 | May 2026 | Requirement set from the requirement library at development start (4.3); gate G1 self-assessment; ML section aligned with AI-STD-700 | MRC |
