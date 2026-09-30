# Model Risk Management Policy

| | |
|---|---|
| **Title** | Model Risk Management Policy |
| **Reference** | MRM-POL-001 |
| **Version and date** | v5.0 (2026-03) |
| **Owner** | Model Risk Management (2LoD) |
| **Approval body** | Model Risk Committee (model risk appetite approved by the Management Board) |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose

1.1 This Policy sets out the principles, roles and minimum requirements through which the Bank identifies, assesses, controls, monitors and reports model risk across the full model lifecycle.

1.2 The Policy implements the requirements on model risk in Directive 2013/36/EU (CRD), in particular Art. 3(1)(11), Art. 74 and Art. 85(1), the governance, validation and internal audit requirements for internal models in Regulation (EU) No 575/2013 (CRR), in particular Art. 185, 189, 190 and 191, and the expectations of the ECB guide to internal models. The US Federal Reserve/OCC guidance SR 11-7 and the PRA supervisory statement SS1/23 are used as reference good practice.

1.3 Detailed requirements are laid down in the Model Risk Management standards listed in section 14. Where this Policy and a standard conflict, this Policy prevails; where a standard is stricter, the standard applies.

## 2 Scope and applicability

2.1 This Policy applies to the Bank and all its subsidiaries and branches, to all business lines and to every model as defined in section 3, irrespective of whether the model is developed internally, acquired from a vendor, provided by another group entity or operated as a service by a third party.

2.2 The Policy applies irrespective of the modelling technique. Statistical, mathematical, simulation-based, expert-based, machine learning (ML) and generative AI (GenAI) models are all in scope. Section 12 sets additional principles for AI and ML models.

2.3 Quantitative tools that do not meet the model definition (deterministic calculators, reporting aggregations, end-user computing applications without estimation logic) are outside the scope of the model lifecycle but are recorded in the tools register in accordance with MRM-STD-010.

## 3 Definitions

- **Model**: a quantitative method, system or approach that applies statistical, economic, financial, mathematical or machine-learning theories, techniques and assumptions, or structured expert judgement, to process input data into quantitative estimates, scores, classifications or generated content that are used for decision-making, risk measurement, valuation or reporting. A model consists of an input component, a processing component and an output component.
- **Model risk**: the potential loss the Bank may incur, as a consequence of decisions that could be principally based on the output of models, due to errors in the development, implementation or use of such models (CRD Art. 3(1)(11)). It includes the risk of using a model outside its intended scope.
- **Model owner**: the 1LoD senior manager accountable for a model, its use and its compliance with this Policy.
- **Model developer**: the 1LoD unit that designs, builds, documents and maintains a model.
- **Model user**: any unit or person that relies on model output for decisions or reporting.
- **Model validator**: a member of the independent Model Validation function (2LoD).
- **Model tier**: the classification (Tier 1, 2 or 3) of a model based on materiality and complexity in accordance with MRM-STD-010.
- **Lifecycle gate**: a control point in the model lifecycle at which defined evidence must be approved before the model proceeds.
- **Validation opinion**: the overall conclusion of Model Validation: *Fit for purpose*, *Fit for purpose with conditions* or *Not fit for purpose* (MV-STD-001).
- **Finding**: a deficiency identified by Model Validation, Internal Audit or a supervisor, rated high, medium or low in accordance with MV-STD-002.
- **Post-model adjustment (PMA)**: any adjustment applied to model output outside the approved model to compensate for a known deficiency.
- **Dispensation**: a time-bound, approved deviation from a requirement of this Policy or an MRM standard.

## 4 Model risk appetite

4.1 Model risk is a material risk type in the Bank's risk taxonomy and is included in the annual risk identification and in the internal capital adequacy assessment process (ICAAP).

4.2 Model Risk Management (MRM) proposes a model risk appetite statement annually. The Model Risk Committee (MRC) endorses it and the Management Board approves it as part of the Bank's risk appetite framework.

4.3 The model risk appetite statement contains at least the following metrics, each with green, amber and red thresholds:
(a) number of models in use without a valid validation opinion (zero tolerance);
(b) number of models in use with a *Not fit for purpose* opinion outside an MRC-approved temporary use;
(c) share of Tier 1 validations completed within the planned period (target at least 95%);
(d) number of high-severity findings past their remediation deadline;
(e) aggregate impact of post-model adjustments relative to the modelled outcome, per model family.

4.4 MRM reports every amber or red breach to the MRC at its next meeting. A red breach is reported to the Management Board within ten business days, together with a remediation plan approved by the responsible model owner.

4.5 Model risk is quantified for ICAAP purposes in accordance with the ERM methodology, taking into account open findings, known limitations, post-model adjustments and the outcomes of sensitivity analyses.

## 5 Roles and responsibilities

5.1 The Management Board bears ultimate responsibility for model risk. It approves the model risk appetite and, for rating systems used under the IRB approach, all material aspects of the rating and estimation processes as required by CRR Art. 189(1). It delegates the oversight of model risk to the MRC.

5.2 The MRC exercises the authorities set out in its Terms of Reference (MRM-GOV-001), including the approval of Tier 1 models, material model changes, dispensations and MRM standards.

5.3 First line of defence (1LoD):
(a) the model owner is accountable for the use of the model within its approved scope, the accuracy of its inventory record, ongoing monitoring, the remediation of findings and the fulfilment of approval conditions;
(b) the model developer develops the model in accordance with MRM-STD-020, documents it in accordance with MRM-STD-021 and completes the 1LoD self-assessment against the applicable requirements;
(c) model users use model output only within the approved scope and report suspected model errors or misuse to the model owner without delay.

5.4 Second line of defence (2LoD):
(a) MRM owns this Policy and the MRM standards, maintains the model inventory, approves model tiers, challenges the 1LoD, monitors model risk appetite and reports on model risk in aggregate;
(b) Model Validation performs independent validation of all models in accordance with MV-STD-001 and issues validation opinions and findings.

5.5 Model Validation is independent of model development and model use. It reports to the Chief Risk Officer, its remuneration is not linked to the approval of models, and no person may validate a model that he or she developed, or contributed to, within the preceding two years.

5.6 Third line of defence (3LoD): Internal Audit reviews the MRM framework and its application in accordance with its risk-based audit plan, and reviews the rating systems and their operations at least annually as required by CRR Art. 191.

## 6 Model lifecycle and lifecycle gates

6.1 Every model follows the lifecycle: identification and registration; development; independent validation; approval for use; implementation; use and ongoing monitoring; periodic validation; change; decommissioning.

6.2 The following lifecycle gates apply to every new model and to every material model change:

| Gate | Evidence required | Approver |
|---|---|---|
| G0 Registration | Inventory record, provisional tier | MRM |
| G1 Development sign-off | Approved RDS documentation and MDD, completed 1LoD self-assessment | Model owner |
| G2 Validation | Validation report and validation opinion | Model Validation (sign-off per MV-STD-001) |
| G3 Approval for use | Approval memorandum including open findings and conditions | Approval authority (section 8) |
| G4 Go-live | Implementation test evidence per MRM-STD-030, inventory updated | Model owner, confirmed by MRM |

6.3 A model may not pass a gate before all preceding gates have been completed. Gate decisions and the supporting evidence are recorded in the model inventory.

6.4 Before submission to Model Validation (G1), the model developer completes a self-assessment against the requirement set that applies to the model, derived from the Bank's requirement library, with a reference to the supporting evidence for each requirement.

6.5 A model is decommissioned only with the approval of the approval authority for its tier. The inventory record and the model documentation of a decommissioned model are retained for at least ten years.

## 7 Model identification, inventory and tiering

7.1 Every model is registered in the model inventory before its development starts, and in any case before its output is used. Model identification and registration follow MRM-STD-010.

7.2 Every model is assigned a tier (Tier 1, 2 or 3) on the basis of its materiality and complexity, subject to the minimum tiers for regulatory use set in MRM-STD-010. The tier determines the approval authority, the depth of documentation, and the intensity and frequency of validation.

7.3 The model inventory is the single authoritative record of the Bank's models. Model owners attest the completeness and accuracy of the inventory records of their models at least quarterly.

## 8 Approval authorities

8.1 Models and material model changes are approved for use by the following authorities:

| Tier | Approval authority |
|---|---|
| Tier 1 | Model Risk Committee |
| Tier 2 | Model Approval Panel under authority delegated by the MRC |
| Tier 3 | Head of Model Risk Management |

8.2 The approval decision is based on the validation opinion, the 1LoD self-assessment, open findings, known limitations and any proposed post-model adjustments. The decision and any conditions are recorded in the approval memorandum and in the model inventory.

8.3 For models that require supervisory permission, in particular IRB rating systems and the internal model approach for market risk, internal approval (G3) precedes the submission of the application to the ECB, and the model is used for the calculation of own funds requirements only after the permission has been granted. MRM-STD-050 governs changes and notifications.

8.4 No approval authority may approve for use a model that has received a *Not fit for purpose* opinion. Temporary use of such a model is subject exclusively to section 10.1.

## 9 Independent validation

9.1 Every model is independently validated before first use and after every material change, in accordance with MV-STD-001.

9.2 Every model is validated periodically at the frequency set for its tier in MRM-STD-010: Tier 1 at least annually, Tier 2 at least every two years and Tier 3 at least every three years. Internal models used for the calculation of own funds requirements are validated at least annually irrespective of their tier.

9.3 Validation covers at least conceptual soundness, data, implementation, model performance, the use of the model and the outcomes of ongoing monitoring. The scope and depth of validation are proportionate to the tier.

9.4 Validation of vendor and third-party models is not waived for lack of transparency. The model owner obtains documentation sufficient for validation; where this is not possible, compensating controls are defined and approved by MRM.

## 10 Use of models with open findings and limitations

10.1 A model with a *Not fit for purpose* opinion may not be used. In exceptional cases the MRC may approve temporary use for a maximum of six months, subject to compensating measures (such as a conservative post-model adjustment or restricted scope of use) and an approved remediation plan.

10.2 A model with a *Fit for purpose with conditions* opinion may be used subject to the conditions set by the approval authority. Each condition is recorded in the conditions register maintained under MRM-GOV-001 with an owner and a deadline.

10.3 For every open high- or medium-severity finding, the model owner submits a remediation plan within 20 business days of the final validation report, and remediates the finding within the deadline set in MV-STD-002. MRM assesses whether compensating measures are required pending remediation of high-severity findings.

10.4 Post-model adjustments are documented, quantified, approved by the approval authority for the model's tier and reported quarterly to the MRC. A post-model adjustment does not replace remediation of the underlying deficiency.

10.5 Known model limitations are recorded in the limitations log of the model documentation and in the model inventory, and are communicated to model users.

## 11 Monitoring and reporting

11.1 Every model in use is subject to ongoing performance monitoring with defined thresholds in accordance with MRM-STD-040. A red monitoring outcome triggers a review by the model owner and notification of MRM and Model Validation.

11.2 MRM reports to the MRC at least quarterly on: inventory status and tier distribution; adherence to the validation plan; findings by severity and overdue findings; approval conditions; model risk appetite metrics; post-model adjustments; dispensations; and open supervisory obligations and findings.

11.3 MRM submits an annual model risk report to the Management Board and to the Risk Committee of the Supervisory Board.

## 12 AI and machine learning models

12.1 AI and ML models are models within the meaning of this Policy and follow the full lifecycle. In addition they meet the requirements on explainability, fairness, robustness and human oversight in AI-STD-700 and the Responsible AI Policy (AI-POL-001).

12.2 For every model, the model owner records in the model inventory, before gate G1, whether the model is or is part of an AI system and, if so, its risk classification under Regulation (EU) 2024/1689 (AI Act). High-risk AI systems additionally meet the obligations of the AI Act.

12.3 Generative AI use cases and third-party AI components are approved and controlled in accordance with AI-STD-710 and TPR-POL-001 before use.

12.4 The complexity of an ML or GenAI model is assessed as at least medium for tiering purposes.

## 13 Exceptions and dispensations

13.1 Deviations from this Policy or an MRM standard are permitted only by dispensation. The model owner requests the dispensation with a rationale, a risk assessment, compensating measures and an end date.

13.2 Dispensations for Tier 1 models, and any dispensation from validation before first use, are approved by the MRC. Other dispensations are approved by the Head of MRM. A dispensation is valid for at most twelve months and may be renewed once.

13.3 MRM maintains a register of dispensations and reports it to the MRC quarterly. No dispensation may be granted from a requirement of law or regulation.

## 14 Related documents

External: CRD Art. 3(1)(11), 74 and 85; CRR Art. 143, 174, 179, 185, 189, 190 and 191; Commission Delegated Regulation (EU) 2022/439 (IRB assessment methodology); Commission Delegated Regulation (EU) No 529/2014 (materiality of model changes); ECB guide to internal models; EBA Guidelines on internal governance (EBA/GL/2021/05); Regulation (EU) 2024/1689 (AI Act); SR 11-7; PRA SS1/23 (reference only).

Internal: MRM-GOV-001 Model Risk Committee – Terms of Reference; MRM-STD-010 Model Inventory and Tiering Standard; MRM-STD-020 Model Development Standard; MRM-STD-021 Model Documentation Standard; MRM-STD-022 Data Quality Standard for Models; MRM-STD-023 Expert Judgement Standard; MRM-STD-030 Model Implementation and Testing Standard; MRM-STD-040 Model Monitoring Standard; MRM-STD-050 Model Change and Regulatory Notification Standard; MV-STD-001 Model Validation Standard; MV-STD-002 Validation Findings and Rating Standard; AI-POL-001 Responsible AI Policy; AI-STD-700 Machine Learning Model Standard; AI-STD-710 Generative AI Use Standard; DATA-POL-001 Data Management and Governance Policy; TPR-POL-001 Third-Party and Outsourcing Risk Policy.

## 15 Document history

| Version | Date | Change | Approved by |
|---|---|---|---|
| 3.0 | June 2021 | Alignment with the ECB guide to internal models; lifecycle gates introduced | MRC |
| 4.0 | May 2023 | Model risk appetite metrics; three-tier approach; SS1/23 benchmarking | MRC |
| 4.1 | February 2025 | Post-model adjustments; 1LoD self-assessment at G1 | MRC |
| 5.0 | March 2026 | AI, ML and GenAI models explicitly in scope (section 12); AI Act classification in inventory; approval authorities for Tier 2 delegated to the Model Approval Panel; alignment with CRR3 | MRC; model risk appetite approved by the Management Board |
