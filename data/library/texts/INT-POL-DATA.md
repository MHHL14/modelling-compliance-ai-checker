# Data Management and Governance Policy

| | |
|---|---|
| **Reference** | DATA-POL-001 |
| **Version and date** | v3.2 (2025-11) |
| **Owner** | Chief Data Office |
| **Approval body** | Management Board, upon recommendation of the Group Data Governance Committee; model-related provisions endorsed by the Model Risk Committee |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose

1.1 This Policy sets the minimum requirements for the management and governance of data across the Bank. It establishes clear accountability for data, requires that data used for decision-making, risk measurement and regulatory reporting can be traced to its origin, and ensures that the quality of that data is known, measured and controlled.

1.2 The Policy implements the Bank's commitments under the BCBS *Principles for effective risk data aggregation and risk reporting* (BCBS 239) and supports compliance with the data requirements of Regulation (EU) No 575/2013 (CRR), in particular Articles 174, 176 and 179, and with EBA/GL/2017/16 on PD estimation, LGD estimation and the treatment of defaulted exposures.

1.3 For models, this Policy is the parent document of the Data Quality Standard for Models (MRM-STD-022) and is applied together with the Model Risk Management Policy (MRM-POL-001), the Model Development Standard (MRM-STD-020) and the Model Documentation Standard (MRM-STD-021).

## 2 Scope and applicability

2.1 The Policy applies to all entities, branches and business lines of the Bank and to all data that is created, acquired, stored, transformed or used by them, irrespective of the technology in which it is held.

2.2 The provisions in sections 5, 6 and 8 apply with particular force to data used in models registered in the Model Inventory under MRM-STD-010, including the reference data set (RDS) of each model, the data used for model monitoring and the input data used when the model is run in production.

2.3 Data provided by third parties (external data vendors, credit bureaus, pooled data providers, outsourced service providers) is in scope. Contractual arrangements with such parties shall enable the Bank to meet this Policy; see TPR-POL-001.

2.4 Personal data remains subject in addition to the Privacy and Data Protection Policy (PRIV-POL-001). Where the two documents conflict, the stricter requirement applies.

## 3 Definitions

**Critical data element (CDE):** a data attribute whose inaccuracy, incompleteness or late availability would have a material impact on a model output, a risk measure, a regulatory report or a key management decision.

**Data domain:** a logically coherent group of data (for example counterparty, facility, collateral, default events, recoveries, market data) for which a single Data Owner is accountable.

**Data Owner:** the senior manager accountable for a data domain, including its definition, quality and permitted use.

**Data Steward:** the person designated by the Data Owner to manage the data domain on a day-to-day basis, including metadata, data quality rules and issue resolution.

**Data lineage:** the documented path of a data element from its source system(s) through every extraction, transformation, aggregation and storage step up to its point of use.

**Metadata:** data describing data, including business definition, technical definition, format, permitted values, owner, source, update frequency and classification.

**Model data:** any data used to develop, calibrate, validate, monitor or run a model, including the RDS as defined in MRM-STD-021.

**Reference data set (RDS):** the data set, and its documentation, from which a model is developed and calibrated, as defined in MRM-STD-021.

**Source system:** the system in which a data element is first captured or created within, or received into, the Bank (the "golden source").

## 4 Data ownership and accountability

4.1 Every data domain shall have exactly one Data Owner, recorded in the Group Data Catalogue. The Data Owner is accountable for the definition, quality, protection and fitness for use of the data in the domain.

4.2 The Data Owner shall appoint at least one Data Steward for the domain and shall ensure that the steward has the authority, time and tools to perform the role.

4.3 Every model shall have its model data mapped to the data domains from which it is sourced. The Model Owner (as defined in MRM-POL-001) is accountable for the fitness for use of the data in the model, and shall agree with the relevant Data Owners the data quality expectations for the CDEs used by the model.

4.4 Changes to the definition, source or transformation logic of a data element shall be approved by the Data Owner and communicated in advance to the owners of all models and reports that use the element, as identified through the lineage required by section 5.

4.5 Data Owners shall confirm annually, through the data ownership attestation, that the ownership records, CDE designations and data quality rules of their domain are complete and current.

## 5 Data lineage

5.1 Lineage from source systems to the RDS, and to the production input data of the model, shall be documented for every variable used in a model, including variables considered during development but not retained where they were used to construct retained variables.

5.2 The lineage documentation shall identify, for each variable: the source system and source field(s); each intermediate system, data store or staging area; every transformation, derivation, filter, join and aggregation applied, with a reference to the code or ETL job that performs it; and the frequency and timing of each extraction.

5.3 Manual interventions in the data flow (manual uploads, end-user computing tools, manual corrections) shall be identified explicitly in the lineage, together with the control applied to each intervention.

5.4 Where a variable is sourced from a third party or from external data, the lineage shall start at the point of receipt within the Bank and shall record the provider, the data product and the version or delivery date.

5.5 Lineage shall be recorded in the Group Data Catalogue or in a lineage tool approved by the Chief Data Office. For model data, the RDS documentation required by MRM-STD-021 shall contain or reference the lineage for every variable.

5.6 Lineage documentation shall be kept up to date. Any change in source system, transformation logic or data flow affecting model data shall be reflected in the lineage before the changed data is used in development, monitoring or production.

5.7 The lineage of a model's development data and of its production input data shall be compared at implementation, and any difference in source or transformation shall be documented and assessed for its impact on the model, in accordance with MRM-STD-030.

## 6 Critical data elements

6.1 Data Owners, in consultation with Model Owners and Risk Reporting, shall designate CDEs within their domain. As a minimum, every model input variable and every data element used to construct a model's target variable (including default flags, loss and recovery amounts and exposure at default) shall be designated as a CDE of that model.

6.2 Each CDE shall have a documented business definition, a technical definition and at least one data quality rule for each applicable data quality dimension defined in MRM-STD-022 §3.

6.3 CDEs shall be subject to reconciliation against the source system or against accounting data at a frequency proportionate to their use, and at least annually. Unexplained differences shall be recorded as data quality issues.

6.4 The CDE register shall indicate, for each CDE, the models, risk reports and regulatory reports in which it is used.

## 7 Metadata

7.1 Metadata for every data element used in a model shall be recorded in the Group Data Catalogue, comprising at least the business definition, technical definition, data type and format, permitted values or ranges, unit and currency, source system, Data Owner, update frequency and information security classification.

7.2 Definitions of the same concept shall be consistent across data domains. Where different definitions are used for legitimate reasons (for example an accounting and a prudential definition of default), each shall be labelled distinctly and the difference documented.

7.3 Changes to metadata shall be versioned so that the definition applicable to any historical data point can be retrieved.

## 8 Data quality management

8.1 Data quality shall be managed through a framework of defined dimensions, rules, thresholds, measurement, issue management and reporting. For model data this framework is specified in the Data Quality Standard for Models (MRM-STD-022), which is binding on all Model Owners and model developers.

8.2 Data quality shall be controlled as close to the source as possible. Deficiencies identified downstream shall be remediated at source where feasible, rather than corrected only in the model data.

8.3 Every identified data quality issue affecting a CDE shall be recorded in the Bank data issue register with its impact, owner, remediation plan and target date. Issues affecting model data shall also be recorded in the model's data deficiency log required by MRM-STD-022.

8.4 Data quality issues rated high or critical shall be escalated to the Group Data Governance Committee and, where they affect a model, to the Model Risk Committee.

## 9 Alignment with BCBS 239

9.1 Risk data aggregation capabilities shall meet the BCBS 239 principles on governance, data architecture and IT infrastructure, accuracy and integrity, completeness, timeliness and adaptability. The Chief Data Office shall maintain a mapping of this Policy and its standards to the BCBS 239 principles.

9.2 Risk data used in models and risk reports shall be aggregated on a largely automated basis. Manual processes shall be documented, justified and controlled, and their number shall be minimised.

9.3 Data used for model outputs that feed regulatory capital or risk reporting shall be reconcilable with the Bank's accounting data and with the data used in the corresponding regulatory reports.

9.4 The Bank shall be able to produce the risk data needed for its models and risk reports under stress or crisis conditions within the timelines set by Group Risk Reporting.

## 10 Retention and archiving

10.1 Data shall be retained for at least the period required by applicable law and regulation and by this Policy, and no longer than necessary for personal data, in accordance with PRIV-POL-001.

10.2 For each model, the RDS (in the exact version used for development and each recalibration), the code used to construct it and its lineage and metadata shall be archived so that the development data can be reproduced. Archived RDS versions shall be retained for the life of the model and at least ten years after its decommissioning.

10.3 Historical data required for the estimation of risk parameters, including internal rating histories, default events, loss and recovery cash flows and exposure histories, shall be retained for at least the observation periods required by CRR Articles 176, 180 and 181 and shall not be deleted while any model uses it.

10.4 Archived data shall be protected against alteration. Any correction of archived model data shall be performed on a new version, with the original retained.

## 11 Roles and responsibilities

11.1 **Management Board:** approves this Policy and sets the Bank's data governance risk appetite.

11.2 **Chief Data Officer:** owns this Policy, maintains the Group Data Catalogue and lineage tooling, monitors compliance and reports at least annually to the Management Board on the state of data governance and BCBS 239 compliance.

11.3 **Data Owners and Data Stewards:** perform the duties in sections 4 to 8 for their domains.

11.4 **Model Owners and model developers (1LoD):** map model data to domains, document lineage and metadata for model data, designate model CDEs with the Data Owners and apply MRM-STD-022.

11.5 **Model Risk Management and Model Validation (2LoD):** review adherence to this Policy for model data as part of model approval and independent validation.

11.6 **Internal Audit (3LoD):** provides independent assurance on the design and operating effectiveness of data governance.

## 12 Exceptions and dispensations

12.1 Deviations from this Policy require a written dispensation approved by the Chief Data Officer. Dispensations affecting model data additionally require the approval of the Head of Model Risk Management in accordance with MRM-POL-001.

12.2 A dispensation shall state the requirement concerned, the reason, the compensating controls, the impact on affected models and reports, and an expiry date not exceeding twelve months. Dispensations are recorded in the Bank dispensation register.

## 13 Related documents

- Regulation (EU) No 575/2013 (CRR), Articles 174, 176, 179, 180 and 181
- EBA/GL/2017/16, Guidelines on PD estimation, LGD estimation and the treatment of defaulted exposures (sections on data requirements)
- BCBS 239, Principles for effective risk data aggregation and risk reporting (2013)
- ECB guide to internal models, General topics (data maintenance)
- MRM-POL-001 Model Risk Management Policy
- MRM-STD-010 Model Inventory and Tiering Standard
- MRM-STD-020 Model Development Standard
- MRM-STD-021 Model Documentation Standard
- MRM-STD-022 Data Quality Standard for Models
- MRM-STD-030 Model Implementation and Testing Standard
- PRIV-POL-001 Privacy and Data Protection Policy
- TPR-POL-001 Third-Party and Outsourcing Risk Policy

## 14 Document history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2016-12 | First issue following the BCBS 239 programme. |
| 2.0 | 2019-06 | Introduction of CDE register and Group Data Catalogue. |
| 3.0 | 2022-03 | Alignment with EBA/GL/2017/16; model data provisions added. |
| 3.1 | 2024-05 | Lineage requirements extended to production input data. |
| 3.2 | 2025-11 | Section 5 made explicit on variable-level lineage to the RDS; retention of RDS versions (10.2) added. |
