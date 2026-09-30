# Model Change and Regulatory Notification Standard

| | |
|---|---|
| **Title** | Model Change and Regulatory Notification Standard |
| **Reference** | MRM-STD-050 |
| **Version and date** | v2.4 (2026-06) |
| **Owner** | Model Risk Management (2LoD) |
| **Approval body** | Model Risk Committee |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose

1.1 This Standard sets the requirements for identifying, classifying, validating, approving and implementing changes to models, and for notifying changes to, or applying for permission from, the competent authority. It implements sections 6, 8.3 and 9.1 of the Model Risk Management Policy (MRM-POL-001).

1.2 For internal models used to calculate own funds requirements, the Standard implements CRR Art. 143(3) and (4) and Commission Delegated Regulation (EU) No 529/2014 on assessing the materiality of extensions and changes of the IRB approach, as extended to the internal model approach for market risk by Commission Delegated Regulation (EU) 2015/942, and is aligned with the ECB guide to internal models. The ECB is the competent authority for the Bank as a significant institution under the Single Supervisory Mechanism.

1.3 CRR Art. 143(5), as amended by Regulation (EU) 2024/1623 (CRR3), mandates the EBA to update the regulatory technical standards on the materiality of changes. Until a successor regulation applies, the criteria of Delegated Regulation (EU) No 529/2014 remain applicable. MRM updates section 5 of this Standard within three months of the entry into force of a successor regulation.

## 2 Scope and applicability

2.1 This Standard applies to every change to a model within the scope of MRM-POL-001, including changes to methodology, parameters, data, default or target definition, range of application, implementation, intended use and the processes in which the model is embedded, and to extensions of the range of application of internal models.

2.2 Sections 5.3, 5.4, 8 and 9 apply only to models that require supervisory permission (IRB rating systems and the internal model approach for market risk). All other sections apply to all models.

## 3 Definitions

Terms defined in MRM-POL-001 apply. In addition:
- **Change**: any modification of a model or its use after approval at gate G3.
- **Material change (internal)**: a change classified as material under section 5.2; it passes the lifecycle gates G1 to G4 again.
- **Class A change**: a change to an internal model that requires prior permission of the competent authority.
- **Class B change**: a change to an internal model that requires notification to the competent authority before implementation (ex ante notification).
- **Class C change**: a change to an internal model that requires notification to the competent authority after implementation (ex post notification).
- **Change memorandum**: the document that describes, classifies and justifies a change.
- **Range of application**: the exposures, portfolios or positions to which a rating system or internal model is applied.

## 4 Change identification and recording

4.1 The model owner records every planned change in the change log of the model in the model inventory before implementation. Changes are not implemented in production without a change log entry.

4.2 For every change, the model developer prepares a change memorandum that describes the change and its rationale, the affected model components and documents, the internal and regulatory classification with supporting analysis, the quantitative impact, the validation required and the implementation plan.

4.3 Related changes that are planned together or that address the same deficiency are recorded and assessed as a single change.

## 5 Change classification

5.1 Every change is classified along two dimensions: internal materiality (material or non-material), for all models; and regulatory classification (Class A, B or C), for models that require supervisory permission.

5.2 A change is internally material if at least one of the following applies:
(a) the change modifies the methodology, model structure, segmentation or set of risk drivers;
(b) the change modifies the default definition or the target variable;
(c) the change extends or reduces the range of application or modifies the intended use;
(d) the change introduces a new source for a material input;
(e) the change alters the aggregate model output at the most recent reference date by more than 5% (for example risk-weighted exposure amounts, expected credit loss, economic value sensitivity or alert volume), or changes the grade or class assignment of more than 10% of the exposures or cases;
(f) the change is classified as Class A or Class B.

5.3 For internal models, the regulatory classification follows the qualitative and quantitative criteria of Delegated Regulation (EU) No 529/2014. A change is Class A if it meets any qualitative criterion for material changes in Annex I, Part II, Section 1, or if it results in a decrease of at least 1.5% of the Bank's overall risk-weighted exposure amounts for credit risk or of at least 15% of the risk-weighted exposure amounts associated with the range of application of the rating system. A change is Class B if it is not Class A and meets any criterion for ex ante notification of the Regulation. All other changes to internal models are Class C.

5.4 The quantitative impact for the regulatory classification is calculated on the same, most recent reference date for the model before and after the change, both at the level of the Bank's overall risk-weighted exposure amounts and at the level of the range of application of the rating system, and is documented in the change memorandum.

5.5 Changes are not split, sequenced or combined in order to avoid a higher classification. The model owner assesses the cumulative impact of all changes implemented since the last permission or full validation, and MRM monitors it.

5.6 The model developer proposes the classification; MRM reviews and approves it. Disagreements between the model owner and MRM are escalated to the MRC.

5.7 Where the classification is uncertain, the higher internal materiality or regulatory class applies.

## 6 Re-validation triggers

6.1 Every internally material change is independently validated by Model Validation before implementation, in accordance with MV-STD-001.

6.2 Every Class A or Class B change is validated before the application or the ex ante notification is submitted to the competent authority. The validation report is part of the submission.

6.3 For non-material changes to Tier 1 models, Model Validation decides within ten business days of receiving the change memorandum whether a review before implementation is required. Other non-material changes are reviewed at the next periodic validation.

6.4 In addition to changes, the following events trigger a re-validation, whose scope Model Validation determines: a red monitoring outcome under MRM-STD-040 that is not resolved within one monitoring cycle; a material change in the composition of the portfolio or in the external environment; a change in regulation that affects the model requirements; and a change in the intended use.

6.5 Where the cumulative impact of non-material changes since the last full validation would, taken together, meet the criteria of section 5.2, the next validation is a full-scope validation.

## 7 Internal approval

7.1 Internally material changes pass the lifecycle gates G1 to G4 of MRM-POL-001 and are approved by the approval authority for the model's tier. Class A changes and every change requiring supervisory permission are approved by the MRC before submission, and by the Management Board where CRR Art. 189(1) applies.

7.2 Non-material changes are approved by the model owner after MRM has confirmed the classification, and are recorded in the model inventory with the new model version.

## 8 Regulatory notification and application

8.1 A Class A change is implemented for the calculation of own funds requirements only after the ECB has granted permission. Until then, the approved model continues to be used.

8.2 A Class B change is notified to the ECB at least two months before its intended implementation. The change is not implemented before the end of that period, nor if the ECB indicates within that period that it considers the change to require permission.

8.3 A Class C change is notified to the ECB after implementation, at the latest in the quarterly aggregated ex post notification following the implementation date.

8.4 Applications and notifications are submitted by the Supervisory Relations function through the ECB's designated submission channel, after MRM has confirmed completeness. Copies of all submissions and correspondence are stored in the model inventory.

8.5 ECB decisions, including obligations, limitations and recommendations attached to a permission, are recorded in the model inventory with an owner and a deadline and are tracked and reported in the same way as MRC conditions under MRM-GOV-001 §7.

8.6 Changes to models that do not require supervisory permission are notified to supervisors only where a specific legal or supervisory obligation requires this, as determined by the Supervisory Relations function.

## 9 ECB application readiness

9.1 For every Class A change and every extension of the range of application that requires permission, the model owner prepares an application package that contains at least: the cover letter and the application documents required by the ECB; a description of the change and its rationale; the classification and quantitative impact analysis under sections 5.3 and 5.4; a self-assessment against the applicable requirements of the CRR, Delegated Regulation (EU) 2022/439, the relevant EBA guidelines and the ECB guide to internal models, derived from the Bank's requirement library; the approved MDD and RDS documentation; the validation report on the change; the implementation plan; the list of known deficiencies with their remediation plans and margin of conservatism treatment; and the internal approval decisions.

9.2 MRM performs an application readiness review at least six weeks before the planned submission date. The review confirms the completeness of the package, the consistency of the figures across the change memorandum, the MDD, the RDS documentation and the validation report, and that all documents are approved versions under MRM-STD-021.

9.3 An application is not submitted while a high-severity finding on the changed model is open, unless the finding, its impact and the remediation plan are disclosed in the application and the MRC has approved the submission.

9.4 For Class A changes to Tier 1 models, Internal Audit is informed of the planned submission at the start of the readiness review and decides whether to perform an audit review of the change before submission.

9.5 The model owner ensures that the data, code and documentation supporting the application remain available for supervisory review, and that the RDS and the model estimation can be reproduced in accordance with MRM-STD-021 §4.2, for the duration of the assessment by the ECB.

9.6 Requests for additional information from the ECB are answered within the deadline set, with answers approved by the model owner and MRM.

## 10 Implementation of changes

10.1 Changes are implemented in accordance with MRM-STD-030 after internal approval and, where applicable, after permission has been granted or the notification period has ended.

10.2 For every internally material change, the model owner performs a post-implementation review within six months of implementation, comparing the realised impact with the impact estimated in the change memorandum, and reports it to MRM.

## 11 Roles and responsibilities

11.1 The model owner is accountable for recording, classifying and implementing changes and for the application package. The model developer prepares the change memorandum. MRM approves classifications, performs the readiness review and maintains the change log and the register of notifications. Model Validation validates changes. The Supervisory Relations function manages submissions to and correspondence with the ECB. The MRC approves Class A changes and applications.

## 12 Exceptions

12.1 Exceptions are handled as dispensations under MRM-POL-001 §13. No dispensation may be granted from sections 8.1 to 8.3.

## 13 Related documents

External: CRR Art. 143, 189 and Part Three, Title IV, Chapter 1b; Commission Delegated Regulation (EU) No 529/2014 and Commission Delegated Regulation (EU) 2015/942; Commission Delegated Regulation (EU) 2022/439; ECB guide to internal models; SR 11-7 and PRA SS1/23 (reference only).

Internal: MRM-POL-001 Model Risk Management Policy; MRM-GOV-001 Model Risk Committee – Terms of Reference; MRM-STD-010 Model Inventory and Tiering Standard; MRM-STD-021 Model Documentation Standard; MRM-STD-030 Model Implementation and Testing Standard; MRM-STD-040 Model Monitoring Standard; MV-STD-001 Model Validation Standard; MV-STD-002 Validation Findings and Rating Standard; CRM-STD-100 IRB Rating System Standard; CRM-STD-101 Margin of Conservatism Standard.

## 14 Document history

| Version | Date | Change | Approved by |
|---|---|---|---|
| 2.0 | March 2022 | Two-dimensional classification (internal materiality and regulatory class) | MRC |
| 2.3 | October 2024 | Application readiness review; cumulative-change monitoring | MRC |
| 2.4 | June 2026 | CRR3 transitional clause (section 1.3); quantitative internal materiality thresholds; ECB obligations tracked as conditions; re-validation triggers aligned with MRM-STD-040 | MRC |
