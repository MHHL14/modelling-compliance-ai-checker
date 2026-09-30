# Model Inventory and Tiering Standard

| | |
|---|---|
| **Title** | Model Inventory and Tiering Standard |
| **Reference** | MRM-STD-010 |
| **Version and date** | v2.3 (2026-04) |
| **Owner** | Model Risk Management (2LoD) |
| **Approval body** | Model Risk Committee |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose

1.1 This Standard sets the requirements for identifying models, registering them in the model inventory, assigning a model tier and determining the validation frequency and ownership of each model. It implements sections 7 and 9.2 of the Model Risk Management Policy (MRM-POL-001).

1.2 The Standard is consistent with the expectations on model inventories and model risk management in the ECB guide to internal models (general topics) and takes SR 11-7 and PRA SS1/23 Principle 1 (model identification and model risk classification) as reference good practice.

## 2 Scope and applicability

2.1 This Standard applies to all models within the scope of MRM-POL-001, to all quantitative tools that are assessed against the model definition, and to all units that develop, own, use or validate models.

## 3 Definitions

Terms defined in MRM-POL-001 apply. In addition:
- **Model inventory**: the Bank's single authoritative system of record for all models and model versions.
- **Tools register**: the register of quantitative tools assessed as not meeting the model definition.
- **Model identification questionnaire (MIQ)**: the standard questionnaire used to determine whether a tool is a model.
- **Materiality**: the potential financial, regulatory, customer and reputational impact of a model error or misuse.
- **Complexity**: the degree of uncertainty inherent in the model's methodology, data and implementation.

## 4 Model identification

4.1 Any unit that develops, acquires or starts to use a quantitative method whose output is used for decision-making, risk measurement, valuation or reporting completes the model identification questionnaire and submits it to MRM before development or acquisition starts.

4.2 MRM determines within 20 business days of receipt of a complete questionnaire whether the tool is a model. The determination and its rationale are recorded; tools assessed as non-models are entered in the tools register.

4.3 Business line heads attest annually that all models and tools in their area are recorded in the model inventory or the tools register. MRM performs an annual identification sweep, including end-user computing applications and third-party services, to detect unregistered models.

4.4 A model detected in use without registration is registered immediately, reported to the MRC as a breach of MRM-POL-001 and assigned a provisional tier at least one tier higher than its assessed tier until validated.

## 5 Model inventory

5.1 Every model is registered in the model inventory before its development starts (gate G0) and in any case before its output is used. Each model receives a unique model identifier; each version receives a version number.

5.2 The inventory record of every model contains at least the following mandatory attributes:
(a) model identifier, name and version;
(b) purpose and description, intended use and any secondary uses;
(c) business line, portfolio or scope of application, and risk type;
(d) regulatory use (for example IRB PD, LGD or EAD, market risk IMA, IFRS 9, ICAAP, stress testing, IRRBB, AML/CFT, credit origination, valuation);
(e) model family (statistical, expert-based, ML, GenAI) and a short methodology description;
(f) model owner, model developer, main model users and assigned validation team;
(g) model tier, the materiality and complexity scores, the tier rationale and the date of the last tier review;
(h) lifecycle stage and the status of each lifecycle gate;
(i) latest validation opinion and date, and the date of the next scheduled validation;
(j) open findings by severity, and open approval conditions;
(k) known limitations and post-model adjustments in force;
(l) upstream and downstream model dependencies and main data sources;
(m) implementation platform and, for vendor models, the vendor and the contract reference;
(n) AI Act classification (MRM-POL-001 §12.2), personal data indicator and DPIA reference;
(o) supervisory permission status, and open supervisory findings and obligations;
(p) active dispensations.

5.3 The model owner updates the inventory record within ten business days of any change to a mandatory attribute, and in any case at each lifecycle gate.

5.4 Model owners attest the completeness and accuracy of their inventory records quarterly. MRM reconciles the inventory quarterly with the validation plan, the findings database and the list of models used for regulatory reporting, and reports discrepancies to the MRC.

5.5 Mandatory attributes are 100% complete for all Tier 1 and Tier 2 models; for Tier 3 models attributes (l), (m) and (o) may remain empty where not applicable.

5.6 Decommissioned models remain in the inventory with the status *Retired*, together with the date and approval of decommissioning, for at least ten years.

## 6 Tiering

6.1 Every model is assigned a tier at registration. The model owner proposes the tier using the tiering template; MRM reviews and approves it. The tier is provisional until the first validation confirms it.

6.2 Materiality is scored High, Medium or Low. The highest score resulting from the following criteria applies:
(a) exposure or portfolio covered: High above EUR 10 billion, Medium from EUR 1 billion to EUR 10 billion, Low below EUR 1 billion;
(b) impact on own funds requirements: High if the model drives risk-weighted exposure amounts above EUR 1 billion;
(c) impact on the income statement, provisions or valuation: High above EUR 50 million, Medium from EUR 5 million to EUR 50 million;
(d) customer impact: at least Medium if model output is used in decisions on individual customers, and High if such decisions concern natural persons at scale;
(e) regulatory and reputational impact: at least Medium if model output is disclosed or reported to supervisors.

6.3 Complexity is scored High, Medium or Low, taking into account: methodology (non-linear, simulation-based and ML methods score High); number and nature of inputs; data limitations; the extent of expert judgement; dependencies on other models; uncertainty of outputs; and the transparency of vendor components. ML and GenAI models score at least Medium (MRM-POL-001 §12.4).

6.4 The tier results from the following matrix:

| Materiality \ Complexity | High | Medium | Low |
|---|---|---|---|
| High | Tier 1 | Tier 1 | Tier 2 |
| Medium | Tier 2 | Tier 2 | Tier 3 |
| Low | Tier 2 | Tier 3 | Tier 3 |

6.5 A model used for the calculation of own funds requirements, for financial reporting (including IFRS 9 expected credit loss), for ICAAP or stress testing, for IRRBB measurement, or to meet AML/CFT obligations is at least Tier 2, irrespective of the matrix outcome.

6.6 MRM may assign a higher tier than the matrix outcome on the basis of expert assessment, with a documented rationale. A tier lower than the matrix outcome is not permitted.

6.7 The tier of every model is reviewed at least annually and at every material change. A downgrade of a Tier 1 model requires MRC approval; other tier changes are approved by MRM.

## 7 Validation frequency per tier

7.1 Every model is validated periodically at least at the following frequency, counted from the date of the previous validation opinion:

| Tier | Periodic validation |
|---|---|
| Tier 1 | Annual |
| Tier 2 | Every two years |
| Tier 3 | Every three years |

7.2 Irrespective of its tier, a model used for the calculation of own funds requirements under the IRB approach or the internal model approach for market risk is validated at least annually, in line with CRR Art. 185 and the ECB guide to internal models.

7.3 A full-scope validation is performed at initial validation, after every material change and at least every three years for Tier 1 models; in the intervening years the annual validation may be a targeted validation that covers at least performance, monitoring outcomes, the status of findings and changes in the portfolio.

7.4 MRM and Model Validation prepare an annual validation plan based on the inventory. Validations overdue by more than three months are reported to the MRC and counted in the model risk appetite metrics.

## 8 Ownership

8.1 Every model has exactly one model owner, who is a 1LoD senior manager with the authority and competence to be accountable for the model's use and performance. The model owner is recorded in the inventory.

8.2 The model owner may delegate tasks but not accountability. Delegated tasks are recorded in the inventory.

8.3 A change of model owner is recorded in the inventory within ten business days, supported by a handover note that lists open findings, conditions, limitations and dispensations, signed by the outgoing and incoming owner.

8.4 A model without an owner for more than 30 days is reported to the MRC, which designates an interim owner.

## 9 Roles and responsibilities

9.1 Model owners register models, propose tiers, maintain inventory records and attest them quarterly.

9.2 MRM administers the model inventory and the tools register, determines model status, approves tiers, performs the identification sweep and reconciliations, and reports on the inventory to the MRC.

9.3 Model Validation confirms the tier at each validation and reports disagreements to MRM.

## 10 Exceptions

10.1 Exceptions to this Standard are handled as dispensations under MRM-POL-001 §13. No dispensation may be granted from registration before use (section 5.1) or from the annual validation of internal models under section 7.2.

## 11 Related documents

External: CRR Art. 185; ECB guide to internal models (general topics); Regulation (EU) 2024/1689 (AI Act); SR 11-7; PRA SS1/23 Principle 1 (reference only).

Internal: MRM-POL-001 Model Risk Management Policy; MRM-GOV-001 Model Risk Committee – Terms of Reference; MRM-STD-050 Model Change and Regulatory Notification Standard; MV-STD-001 Model Validation Standard; AI-STD-700 Machine Learning Model Standard; TPR-POL-001 Third-Party and Outsourcing Risk Policy.

## 12 Document history

| Version | Date | Change | Approved by |
|---|---|---|---|
| 2.0 | May 2023 | Materiality × complexity matrix; three tiers | MRC |
| 2.2 | March 2025 | Minimum Tier 2 for regulatory use; quarterly attestation | MRC |
| 2.3 | April 2026 | AI Act classification and DPIA reference added as mandatory attributes; ML and GenAI complexity floor; ownership handover rules | MRC |
