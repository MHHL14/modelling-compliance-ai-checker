# Model Documentation Standard (incl. MDD and RDS templates)

| | |
|---|---|
| **Title** | Model Documentation Standard (incl. MDD and RDS templates) |
| **Reference** | MRM-STD-021 |
| **Version and date** | v3.0 (2026-02) |
| **Owner** | Model Risk Management (2LoD) |
| **Approval body** | Model Risk Committee |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose, scope and applicability

1.1 This Standard sets the mandatory content, structure, version control and approval of model documentation. It prescribes the templates for the documentation of the reference data set (RDS documentation, Annex A) and for the model development document (MDD, Annex B).

1.2 The Standard implements the documentation requirements of the Model Risk Management Policy (MRM-POL-001), CRR Art. 175 (documentation of rating systems) for IRB models, the documentation expectations of the ECB guide to internal models (general topics) and of Commission Delegated Regulation (EU) 2022/439, and takes the documentation principles of SR 11-7 and PRA SS1/23 as reference good practice: documentation must be sufficiently detailed for a knowledgeable party unfamiliar with the model to understand how it works, reproduce its construction and identify its limitations and key assumptions.

1.3 The Standard applies to all models within the scope of MRM-POL-001, irrespective of tier, family and whether the model is developed internally or acquired. The depth of documentation is proportionate to the tier; the structure is not.

## 2 Documentation template, version control and approval

2.1 Every model has at least the following documentation: (a) RDS documentation following Annex A; (b) an MDD following Annex B; (c) an implementation specification in accordance with MRM-STD-030; and (d) a monitoring plan in accordance with MRM-STD-040, which may form chapter 10 of the MDD. For models without a development data set (for example vendor GenAI components), MRM may agree that the data description is included in chapter 3 of the MDD instead of separate RDS documentation.

2.2 The RDS documentation and the MDD follow the chapter structure, numbering and headings of Annex A and Annex B respectively. Sections marked *M* are mandatory. Sections marked *C* are conditional; where a mandatory or conditional section does not apply, the heading is retained with the statement "Not applicable" and a justification. Additional sections may be added only after the last template section of the relevant chapter, so that template numbering is preserved.

2.3 Every document carries a cover block stating the document title, the model identifier and model version from the model inventory, the document version, the status (*Draft*, *For validation*, *Approved* or *Superseded*), the author, the reviewer, the approver and the approval date.

2.4 Documents are stored in the controlled document repository linked to the model inventory. Versions are numbered *major.minor*. A new major version is issued for every version approved at gate G1 and after every material change. Every document contains a document history table with version, date, summary of changes, author and approver.

2.5 Every document is reviewed, before approval, by a qualified reviewer from the modelling unit who is not its author (four-eyes review). The reviewer records the review in the document history.

2.6 The RDS documentation is approved by the model owner after the data quality sign-off under MRM-STD-022. The MDD is approved by the model owner and the head of the modelling unit.

2.7 Only approved versions are submitted to Model Validation, to the approval authority and to supervisors. Draft versions shared for early engagement are marked *Draft*.

2.8 An approved version is never overwritten. Any change after approval results in a new version that is reviewed and approved in accordance with sections 2.5 and 2.6.

2.9 Documentation is written in English. Documentation of decommissioned models is retained for at least ten years.

## 3 Definitions

Terms defined in MRM-POL-001 and MRM-STD-020 apply. In addition:
- **RDS documentation**: the document describing the construction, content, representativeness and data quality of the RDS.
- **Build code**: the code that extracts, transforms, filters and combines source data into the RDS, including the construction of the default flag or other target variable.
- **Tag**: an immutable identifier of a code version in the version control system.
- **Frozen RDS**: the approved, read-only version of the RDS used for estimation and calibration.
- **Template**: the prescribed chapter structure in Annex A or Annex B.

## 4 Reference data set documentation

4.1 The RDS documentation describes the construction of the RDS and its data quality in sufficient detail for Model Validation to understand every step and to rebuild the RDS independently from source data.

4.2 The RDS build is reproducible from versioned code. All extraction, transformation, exclusion, default flag construction and variable derivation steps are performed by build code held in the Bank's version control system. Manual data manipulation is not permitted; where a manual input is unavoidable (for example an expert mapping table), the input file is itself version-controlled and the step is documented as an expert judgement under MRM-STD-023.

4.3 Chapter 8 of the RDS documentation records the repository, the tag of the build code, the reference dates of the source data snapshots and the result of a full rebuild compared with the frozen RDS, at least as row count and count of defaults or target events.

4.4 The frozen RDS is stored read-only with a version identifier that is referenced in the RDS documentation and in the MDD. It is retained for as long as the model is in use and thereafter in accordance with section 2.9.

4.5 Every count, share and rate reported in the RDS documentation is produced by versioned code from the frozen RDS version referenced in the document.

4.6 The RDS documentation contains, as its Annex A, a data dictionary that states for every RDS variable its business definition, source system and field, transformation and lineage, in accordance with DATA-POL-001.

4.7 Every data deficiency reported in section 6.2 of the RDS documentation carries an identifier and is cross-referenced to the limitations log of the MDD and, for IRB models, to the margin of conservatism category assigned under CRM-STD-101.

## 5 Model development documentation

5.1 The MDD describes the model design, methodology, calibration, performance and limitations in sufficient detail for Model Validation to understand the model, to reproduce its estimation and calibration and to assess its limitations without recourse to the developers.

5.2 The MDD documents the methodological alternatives considered, the selection criteria and the justification of the selected approach (MRM-STD-020 §6).

5.3 The MDD contains the complete limitations log of the model in chapter 8 (MRM-STD-020 §7).

5.4 The MDD describes every expert judgement applied in the development with a reference to its entry in the expert judgement log maintained under MRM-STD-023.

5.5 For IRB models the MDD states the range of application of the rating system and documents the design and operational details of the rating system, the rationale for and analysis supporting the choice of rating criteria, and all major changes in the risk rating process, as required by CRR Art. 175.

5.6 Estimation and calibration results reported in the MDD are produced from tagged estimation code; the tag and the frozen RDS version are recorded in chapter 12 of the MDD.

5.7 For vendor models the MDD documents the Bank's understanding of the vendor methodology, the vendor documentation reviewed, and all configuration, calibration and adaptation performed by the Bank.

5.8 For ML models the MDD contains the explainability, fairness and robustness analyses required by AI-STD-700 in a dedicated section of chapter 7.

## 6 Other documentation

6.1 The implementation specification is prepared in accordance with MRM-STD-030 and is consistent with the MDD.

6.2 The monitoring plan, including KPIs, thresholds and frequency, is prepared in accordance with MRM-STD-040 and documented in chapter 10 of the MDD or in a separate document referenced there.

6.3 For models used outside the modelling unit, the model owner provides a user guide that states the intended use, known limitations relevant to users and the rules for overrides.

6.4 Every model change is documented in a change memorandum in accordance with MRM-STD-050, and the affected documents are updated in accordance with section 2.8.

## 7 Documentation quality

7.1 The RDS documentation, the MDD, the implementation specification and the production code are consistent with each other. Inconsistencies identified by the developer, Model Validation or Internal Audit are corrected by a new document version.

7.2 Documentation does not rely on undocumented knowledge. References to other documents specify the document and version and point to documents accessible to Model Validation.

7.3 In the 1LoD self-assessment, every evidence reference points to a section number of an approved document version.

## 8 Roles and responsibilities

8.1 The model developer prepares and maintains the documentation. The reviewer performs the four-eyes review. The model owner approves the documentation and is accountable for its completeness. MRM maintains the templates and the document repository, and monitors adherence. Model Validation assesses the documentation as part of every validation.

## 9 Exceptions and dispensations

9.1 Deviations from the templates are handled as dispensations under MRM-POL-001 §13. The use of a template other than Annex A or Annex B for a new model is not permitted. Documentation of models approved before v3.0 of this Standard is migrated to the templates at the next major version.

## 10 Related documents

External: CRR Art. 175 and 179; Commission Delegated Regulation (EU) 2022/439; EBA/GL/2017/16; ECB guide to internal models; Regulation (EU) 2016/679 (GDPR); SR 11-7; PRA SS1/23 (reference only).

Internal: MRM-POL-001 Model Risk Management Policy; MRM-STD-020 Model Development Standard; MRM-STD-022 Data Quality Standard for Models; MRM-STD-023 Expert Judgement Standard; MRM-STD-030 Model Implementation and Testing Standard; MRM-STD-040 Model Monitoring Standard; MRM-STD-050 Model Change and Regulatory Notification Standard; CR-STD-110 Definition of Default Standard; CRM-STD-101 Margin of Conservatism Standard; DATA-POL-001; PRIV-POL-001; CR-POL-001; AI-STD-700.

## 11 Document history

| Version | Date | Change | Approved by |
|---|---|---|---|
| 2.0 | April 2022 | MDD template harmonised across model families | MRC |
| 2.1 | November 2024 | Reproducibility requirements for estimation code | MRC |
| 3.0 | February 2026 | Separate RDS documentation template (Annex A) introduced; reproducibility of the RDS build from versioned code (section 4.2); cover block and status model; self-assessment evidence references | MRC |

## Annex A – RDS documentation template

The RDS documentation uses the following chapters and sections. *M* = mandatory; *C* = conditional (the condition is stated).

| Section | Heading | Required content | Status |
|---|---|---|---|
| 1 | Purpose and scope | Model(s) and version served by the RDS, scope of application (entity, portfolio, product), intended use, reference to this template, document version and approval | M |
| 2 | Observation period | Chapter heading | M |
| 2.1 | Observation period | Start and end date, snapshot frequency, number of observations, unique facilities or obligors, number of defaults or target events | M |
| 2.2 | Choice of observation window | Rationale for the window; data availability and system migrations; coverage of the economic cycle, including downturn periods and the mix of good and bad years relevant for long-run average calibration | M |
| 3 | Default definition | Chapter heading. For models without a default-based target, chapter 3 documents the target variable in 3.1 and sections 3.3–3.4 are marked "Not applicable" | M |
| 3.1 | Target variable and outcome horizon | Definition of the target and outcome window | C – where the target is not the regulatory default event or the horizon is not 12 months |
| 3.2 | Deviations from the Bank's definition of default | Description, rationale and impact of each deviation from CR-STD-110 | C – where deviations exist |
| 3.3 | Default definition | Days-past-due counting and materiality thresholds, unlikeliness to pay, level of application (obligor or facility), probation periods, multiple defaults, and any historical approximation of the default flag | M |
| 3.4 | Unlikeliness-to-pay triggers | List of UTP triggers, source systems and level of application | M |
| 4 | Data | Chapter heading | M |
| 4.1 | Data sources and lineage | Source systems, extraction reference dates, lineage summary with reference to the data dictionary (RDS Annex A) | M |
| 4.2 | Exclusions | Each exclusion with reason, number of facilities, share of the population and number of defaults, and the conclusion of the impact analysis with a reference to 5.3 | M |
| 4.3 | Missing values and outliers | Treatment per variable and justification (RDS Annex C) | M |
| 5 | Representativeness | Chapter heading | M |
| 5.1 | Representativeness | Comparison of the RDS with the current portfolio or application portfolio, on risk-driver distributions and on default-rate levels, with detailed analyses in RDS Annex B | M |
| 5.2 | Representativeness for other uses | Representativeness for secondary uses or portfolios outside the RDS population | C – where the model is used outside the RDS population |
| 5.3 | Impact of exclusions | Effect of the exclusions on risk-driver distributions and default rates | M |
| 6 | Data quality | Chapter heading | M |
| 6.1 | Data quality assessment | Assessment against the dimensions, rules and thresholds of MRM-STD-022, with results per critical data element | M |
| 6.2 | Data deficiencies | Each deficiency with identifier, affected period and variables, impact, and cross-reference to the limitations log and, for IRB models, the MoC category (section 4.7) | M |
| 7 | Personal data and fair treatment | Legal basis for processing, DPIA reference, excluded protected attributes and proxy screening (PRIV-POL-001, CR-POL-001) | M – "Not applicable" only if no personal data is processed |
| 8 | Reproducibility | Repository, build code tag, source snapshot dates, software environment, result of the full rebuild (section 4.3) | M |
| Annex A | Data dictionary and lineage | Per variable: definition, source, transformation, lineage (section 4.6) | M |
| Annex B | Representativeness analyses | Detailed tables and charts supporting chapter 5 | M |
| Annex C | Missing values and outliers | Justification of treatments per variable | M |

## Annex B – MDD template

| Chapter | Heading | Required content | Status |
|---|---|---|---|
| 1 | Purpose, scope and intended use | Model purpose, range of application, intended and secondary uses, users, regulatory use, tier | M |
| 2 | Model design | Model structure, components, segmentation, dependencies on other models | M |
| 3 | Data | Reference to the approved RDS documentation and frozen RDS version; development, out-of-sample and out-of-time samples | M |
| 4 | Methodology | Alternatives considered and selection rationale; variable selection; estimation technique; economic rationale of drivers | M |
| 5 | Calibration | Calibration target, calibration sample and method, grade or pool assignment | M |
| 6 | Margin of conservatism | MoC categories, quantification and aggregation under CRM-STD-101 | C – IRB models and other models where required |
| 7 | Performance | Discriminatory power, calibration accuracy, stability, benchmarking or challenger comparison, sensitivity analysis; for ML models explainability, fairness and robustness | M |
| 8 | Assumptions and limitations | Material assumptions and the limitations log | M |
| 9 | Implementation | Reference to the implementation specification, handover package and reference outputs (MRM-STD-020 §15) | M |
| 10 | Monitoring | Monitoring plan: KPIs, thresholds, frequency, responsibilities (MRM-STD-040) | M |
| 11 | Expert judgement | Every expert judgement with reference to the EJ log (MRM-STD-023) | M |
| 12 | Approvals and references | Sign-offs (development plan, RDS, final model), estimation code tag, frozen RDS version, self-assessment reference, document history | M |
