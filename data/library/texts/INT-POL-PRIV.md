# Privacy and Data Protection Policy

| | |
|---|---|
| **Reference** | PRIV-POL-001 |
| **Version** | 4.0 |
| **Date** | September 2025 |
| **Owner** | Privacy Office |
| **Approval body** | Management Board, after consultation of the Data Protection Officer |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose

1.1 This policy sets the principles and minimum requirements for the processing of personal data by the Bank. It ensures compliance with the General Data Protection Regulation (Regulation (EU) 2016/679, GDPR), the Dutch GDPR Implementation Act (Uitvoeringswet AVG) and other applicable data protection law, and protects the fundamental rights of customers, employees and other data subjects.

1.2 The policy gives particular attention to the use of personal data in models, analytics and AI systems, and is aligned with the Model Risk Management Policy (MRM-POL-001), the Responsible AI Policy (AI-POL-001) and the Data Management and Governance Policy (DATA-POL-001).

## 2 Scope and applicability

2.1 This policy applies to all processing of personal data by or on behalf of the Bank, in all entities, branches and business lines, whether automated or manual, and whether in production, development, test or analytics environments.

2.2 It applies to every model, reference data set and AI system that uses personal data in development, calibration, validation, monitoring or production scoring.

## 3 Definitions

| Term | Definition |
|---|---|
| Personal data | Any information relating to an identified or identifiable natural person (Art. 4(1) GDPR), including sole proprietors and self-employed persons. |
| Special categories | Personal data listed in Art. 9(1) GDPR, such as data revealing racial or ethnic origin, religious beliefs, health data and biometric data used for identification. |
| Pseudonymisation | Processing such that personal data can no longer be attributed to a specific data subject without additional information kept separately and protected (Art. 4(5) GDPR). |
| Anonymisation | Irreversible processing after which data subjects can no longer be identified by any means reasonably likely to be used. |
| Profiling | Automated processing to evaluate personal aspects of a natural person, in particular to analyse or predict economic situation, reliability or behaviour (Art. 4(4) GDPR). |
| Automated individual decision | A decision based solely on automated processing, including profiling, that produces legal effects concerning the data subject or similarly significantly affects them (Art. 22 GDPR). |
| DPIA | Data protection impact assessment under Art. 35 GDPR. |
| Record of Processing | The Bank's record of processing activities under Art. 30 GDPR. |

## 4 Principles of processing

4.1 **Lawfulness, fairness and transparency.** Personal data shall be processed lawfully, fairly and in a transparent manner (Art. 5(1)(a) GDPR).

4.2 **Purpose limitation.** Personal data shall be collected for specified, explicit and legitimate purposes, recorded in the Record of Processing. Further processing for another purpose, including the development of a new model, shall be permitted only if it is compatible with the original purpose following a documented compatibility assessment under Art. 6(4) GDPR, or if a separate lawful basis applies.

4.3 **Data minimisation.** Personal data shall be adequate, relevant and limited to what is necessary for the purpose (Art. 5(1)(c) GDPR). For models, every personal data attribute used shall be justified by its relevance for the model purpose.

4.4 **Accuracy.** Personal data shall be accurate and, where necessary, kept up to date; inaccurate data shall be rectified or erased without delay.

4.5 **Storage limitation.** Personal data shall be kept in identifiable form no longer than necessary for the purpose, in accordance with section 10.

4.6 **Integrity and confidentiality.** Personal data shall be protected by appropriate technical and organisational measures (Art. 32 GDPR).

4.7 **Accountability.** Every business owner of a processing activity shall be able to demonstrate compliance with these principles (Art. 5(2) GDPR).

## 5 Lawful basis

5.1 Every processing activity shall have a documented lawful basis under Art. 6(1) GDPR, recorded in the Record of Processing before processing starts.

5.2 Where the Bank relies on legitimate interests (Art. 6(1)(f) GDPR), including for model development, a documented legitimate interest assessment shall demonstrate the purpose, the necessity of the processing and the balancing against the interests and rights of data subjects.

5.3 Special categories of personal data shall not be processed for model development or scoring unless an exception under Art. 9(2) GDPR applies and the Privacy Office has approved the processing. Processing of special categories strictly necessary for bias detection and correction in high-risk AI systems is permitted only under the conditions of Art. 10(5) AI Act.

5.4 Personal data relating to criminal convictions and offences shall be processed only where authorised by Union or Member State law (Art. 10 GDPR), including for the Bank's obligations under the Wwft.

## 6 Records of processing

6.1 The Privacy Office shall maintain the Record of Processing containing the information required by Art. 30 GDPR.

6.2 Every model and AI system that processes personal data shall be linked to one or more processing activities in the Record of Processing. The Model Inventory and AI Inventory shall record the reference to the processing activity.

## 7 Data protection impact assessment

7.1 A DPIA shall be performed before processing that is likely to result in a high risk to the rights and freedoms of natural persons (Art. 35 GDPR). A DPIA is always required for: systematic and extensive evaluation of personal aspects based on automated processing, including profiling, on which decisions with legal or similarly significant effects are based; large-scale processing of special categories or criminal data; and processing appearing on the list of the Dutch supervisory authority (Autoriteit Persoonsgegevens).

7.2 Within the scope of 7.1, a DPIA is mandatory for every model or AI system that processes personal data and (a) produces scores or classifications of natural persons used in decisions, (b) uses machine learning or generative AI on personal data, or (c) is a Tier 1 model under MRM-STD-010.

7.3 The DPIA shall contain at least a systematic description of the processing and its purposes, an assessment of necessity and proportionality, an assessment of the risks to data subjects, and the measures to address those risks (Art. 35(7) GDPR).

7.4 The DPIA shall be reviewed by the Data Protection Officer, whose advice shall be documented. Where the DPIA indicates a residual high risk that the Bank cannot mitigate, the Autoriteit Persoonsgegevens shall be consulted before processing starts (Art. 36 GDPR).

7.5 The DPIA shall be reviewed on every material change to the processing, including a new model version with new personal data attributes, and at least every three years.

## 8 Automated decision-making and profiling

8.1 The Bank shall not take decisions based solely on automated processing that produce legal or similarly significant effects on a natural person unless the decision is necessary for entering into or performing a contract, is authorised by law, or is based on explicit consent (Art. 22(2) GDPR).

8.2 Where such a decision is taken, the Bank shall implement suitable safeguards, including at least the right of the data subject to obtain human intervention on the part of the Bank, to express their point of view and to contest the decision (Art. 22(3) GDPR). The process for human intervention shall be documented, staffed by competent persons with authority to change the decision, and able to handle requests within the time limits of Art. 12(3) GDPR.

8.3 A score or probability produced by a model shall be treated as an automated individual decision where it plays a determining role in a decision with legal or similarly significant effects, including where the decision is formally taken by a third party (CJEU, Case C-634/21, SCHUFA Holding, 7 December 2023).

8.4 Data subjects shall be informed of the existence of automated decision-making, including profiling, and receive meaningful information about the logic involved and the significance and envisaged consequences of the processing (Art. 13(2)(f), 14(2)(g) and 15(1)(h) GDPR).

8.5 Human review within a decision process shall be meaningful: reviewers shall have access to the relevant information, including the main drivers of the model output, and the authority and competence to deviate from the model output. Override rates shall be monitored.

## 9 Personal data in model development and analytics

9.1 Model development, validation and analytics shall be performed on pseudonymised data unless the use of directly identifying data is necessary and approved by the Privacy Office. Direct identifiers shall be replaced by keyed tokens; the keys shall be held by a data custodian separate from the model development team.

9.2 Re-identification of pseudonymised data shall be permitted only for a documented purpose approved by the Privacy Office, such as data quality investigation, and shall be logged.

9.3 Development data sets containing personal data shall be held only in approved secure analytics environments with role-based access. Copying personal data to local devices or unapproved environments is prohibited.

9.4 Production personal data shall not be used in test environments unless masked, pseudonymised or replaced by synthetic data; exceptions require Privacy Office approval.

9.5 The documentation of the reference data set shall list the personal data attributes used, their purpose in the model, the lawful basis, the pseudonymisation applied and the applicable retention period.

## 10 Retention and deletion

10.1 Every category of personal data shall have a retention period recorded in the Bank's retention schedule, based on the purpose, legal obligations and limitation periods.

10.2 Reference data sets and model development snapshots containing personal data may be retained for as long as the model is in use and for five years after its decommissioning, where retention is necessary to comply with prudential requirements on data history, reproducibility and supervisory review. Retention beyond this period requires Privacy Office approval.

10.3 Customer due diligence records and transaction records shall be retained for five years after the end of the business relationship or the date of the occasional transaction, in accordance with the Wwft and, from its date of application, Regulation (EU) 2024/1624 (AMLR).

10.4 At the end of the retention period, personal data shall be deleted or irreversibly anonymised. Deletion shall be evidenced.

## 11 Data subject rights

11.1 The Bank shall facilitate the exercise of data subject rights under Art. 15–22 GDPR and respond within one month of receipt, extendable by two further months where necessary (Art. 12(3) GDPR).

## 12 Processors and international transfers

12.1 Processors shall be engaged only under a written agreement meeting Art. 28 GDPR and following due diligence under TPR-POL-001.

12.2 Transfers of personal data outside the EEA require an adequacy decision or appropriate safeguards under Chapter V GDPR and a documented transfer impact assessment, including for third-party AI services.

## 13 Security and personal data breaches

13.1 Personal data breaches shall be reported to the Privacy Office immediately upon detection. The Privacy Office notifies the Autoriteit Persoonsgegevens within 72 hours where required (Art. 33 GDPR) and data subjects where the breach is likely to result in a high risk (Art. 34 GDPR).

## 14 Roles and responsibilities

| Role | Responsibilities |
|---|---|
| Management Board | Approves this policy; accountable for compliance. |
| Data Protection Officer | Informs and advises, monitors compliance, advises on DPIAs, acts as contact point for the supervisory authority (Art. 38–39 GDPR). |
| Privacy Office (2LoD) | Owns this policy, the Record of Processing and the retention schedule; approves exceptions. |
| Processing owner / model owner (1LoD) | Ensures lawful basis, DPIA, minimisation, pseudonymisation and retention for the processing or model. |
| Data custodians | Manage pseudonymisation keys and re-identification requests. |

## 15 Exceptions and dispensations

15.1 Deviations from internal requirements of this policy require approval by the Privacy Office after advice of the DPO. No dispensation may be granted from obligations under the GDPR.

## 16 Related documents

- Regulation (EU) 2016/679 (GDPR); Uitvoeringswet AVG
- Regulation (EU) 2024/1689 (AI Act), Art. 10(5); Regulation (EU) 2024/1624 (AMLR); Wwft
- MRM-POL-001; MRM-STD-010; MRM-STD-021; MRM-STD-022
- AI-POL-001; AI-STD-700; DATA-POL-001; TPR-POL-001; FEC-POL-001

## 17 Document history

| Version | Date | Change |
|---|---|---|
| 3.0 | 2022-05 | Pseudonymisation requirements for analytics. |
| 4.0 | 2025-09 | Model-specific DPIA triggers; treatment of scores as automated decisions following CJEU C-634/21; alignment with AI-POL-001 and AI Act Art. 10(5); retention of reference data sets. |
