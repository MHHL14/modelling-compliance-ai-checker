# Responsible AI Policy

| | |
|---|---|
| **Reference** | AI-POL-001 |
| **Version** | 2.0 |
| **Date** | May 2026 |
| **Owner** | AI Governance Office |
| **Approval body** | Management Board, on the recommendation of the AI Governance Committee |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose

1.1 This policy sets the principles and minimum governance requirements for the responsible development, procurement, deployment and use of artificial intelligence (AI) within the Bank. It ensures that AI systems are fair, transparent, accountable, subject to effective human oversight, robust and respectful of privacy.

1.2 The policy implements the Bank's obligations under Regulation (EU) 2024/1689 (the AI Act), as amended by Regulation (EU) 2026/1744, and aligns AI governance with the Model Risk Management Policy (MRM-POL-001). Where an AI system is also a model, both this policy and MRM-POL-001 apply; this policy adds AI-specific requirements and does not replace model risk controls.

## 2 Scope and applicability

2.1 This policy applies to all entities, branches and business lines of the Bank and to all employees, contractors and third parties acting on its behalf.

2.2 It covers every AI system that the Bank develops, procures, deploys or uses, including machine learning models, generative AI applications, AI components embedded in vendor software and general-purpose AI (GPAI) models accessed via an interface, irrespective of whether the system is classified as a model under MRM-POL-001.

2.3 Detailed requirements for machine learning models are set in the Machine Learning Model Standard (AI-STD-700) and for generative AI in the Generative AI Use Standard (AI-STD-710). Validation requirements are set in the AI and ML Validation Standard (MV-STD-020).

## 3 Definitions

| Term | Definition |
|---|---|
| AI system | A machine-based system as defined in Art. 3(1) AI Act: designed to operate with varying levels of autonomy, that may exhibit adaptiveness after deployment and that infers from the input it receives how to generate outputs such as predictions, content, recommendations or decisions. |
| AI use case | A specific business application of one or more AI systems, with a defined purpose, users and affected persons. |
| AI Inventory | The Bank's register of AI use cases and AI systems, maintained by the AI Governance Office and linked to the Model Inventory (MRM-STD-010). |
| High-risk AI system | An AI system classified as high-risk under Art. 6 AI Act, including the use cases in Annex III, such as creditworthiness assessment or credit scoring of natural persons (Annex III point 5(b)). |
| Provider / deployer | The roles defined in Art. 3(3) and 3(4) AI Act. The Bank is a provider when it develops an AI system and places it into service under its own name, and a deployer when it uses an AI system under its authority. |
| AI Risk Class | The Bank's internal classification: Prohibited, High, Elevated, Standard. |
| Human oversight | Measures that enable competent natural persons to understand, monitor, intervene in and override the outputs of an AI system. |
| Use Case Owner | The senior business manager accountable for an AI use case and its outcomes. |

## 4 Principles

4.1 **Fairness.** AI systems shall not produce unjustified differential outcomes for individuals or groups on the basis of protected characteristics, including sex, ethnic origin, religion, disability, age and sexual orientation. Fairness shall be assessed before deployment and monitored during use for every AI system that affects natural persons, using the metrics and thresholds of AI-STD-700.

4.2 **Transparency.** The purpose, logic, main inputs, limitations and intended use of every AI system shall be documented in terms understandable to its users, validators and supervisors. Natural persons shall be informed when they interact directly with an AI system, unless this is obvious from the context (Art. 50(1) AI Act).

4.3 **Explainability.** The Bank shall be able to explain, at global and individual level, how an AI system reaches its outputs to a degree proportionate to the impact of the use case. Where an AI system supports decisions on individual customers, individual explanations shall be available to the staff who act on its outputs.

4.4 **Accountability.** Every AI use case shall have a named Use Case Owner and a named technical owner recorded in the AI Inventory. Accountability for decisions taken with the support of an AI system remains with the Bank and its staff; it cannot be delegated to the system or its vendor.

4.5 **Human oversight.** Every AI system shall be subject to human oversight proportionate to its AI Risk Class. The oversight design shall specify who oversees the system, which outputs are reviewed, the criteria for intervention and the means to override or stop the system (Art. 14 AI Act for high-risk systems).

4.6 **Robustness and security.** AI systems shall achieve an appropriate level of accuracy, robustness and cybersecurity throughout their lifecycle, including resilience against errors, data drift and adversarial manipulation (Art. 15 AI Act for high-risk systems).

4.7 **Privacy.** AI systems that process personal data shall comply with the Privacy and Data Protection Policy (PRIV-POL-001), including data protection by design, data minimisation and the safeguards for automated individual decision-making under Art. 22 GDPR.

## 5 AI inventory and risk classification

5.1 Every AI use case shall be registered in the AI Inventory before development or procurement starts. The registration shall record at least: purpose, business owner, technical owner, AI system(s) used, provider or deployer role, affected persons, data categories, AI Risk Class, AI Act classification and, where applicable, the Model Inventory identifier.

5.2 Every system that is a candidate AI system shall be assessed against the AI system definition of Art. 3(1) AI Act. Where a system is assessed as not being an AI system (for example a deterministic scoring rule with fixed weights), the reasoning shall be documented in the AI Inventory.

5.3 Every AI use case shall be classified under the AI Act as prohibited (Art. 5), high-risk (Art. 6 and Annex III), subject to transparency obligations (Art. 50) or minimal risk. The classification shall be documented with its rationale and reviewed by the AI Governance Office.

5.4 Where a use case falls within an Annex III area but the Use Case Owner concludes that it does not pose a significant risk under Art. 6(3) AI Act, the assessment shall be documented before the system is placed into service (Art. 6(4)) and approved by the AI Governance Office. The derogation shall not be applied to systems that perform profiling of natural persons.

5.5 Creditworthiness assessment and credit scoring of natural persons, including self-employed persons and sole proprietors, shall be treated as high-risk under Annex III point 5(b), unless the system is used solely for the purpose of detecting financial fraud. Risk assessment and pricing for life and health insurance shall be treated as high-risk under Annex III point 5(c).

5.6 Every AI use case shall be assigned an internal AI Risk Class (High, Elevated or Standard) based on the AI Act classification, the impact on customers, the degree of autonomy, the materiality of the decisions supported and the model tier under MRM-STD-010. AI Act high-risk systems are always AI Risk Class High.

5.7 The AI Act classification and AI Risk Class shall be reassessed on every material change to the purpose, scope, data or autonomy of the use case and at least annually.

## 6 Prohibited and restricted uses

6.1 The Bank shall not develop, procure or use AI systems for any practice prohibited under Art. 5 AI Act, including subliminal or manipulative techniques that materially distort behaviour, exploitation of vulnerabilities due to age, disability or social or economic situation, social scoring, emotion recognition in the workplace, and biometric categorisation inferring sensitive characteristics.

6.2 In addition, the Bank prohibits the use of AI systems to take fully automated decisions to reject a credit application, terminate a customer relationship or refuse a financial product to a natural person without a documented human review path under PRIV-POL-001.

6.3 The use of public generative AI tools that are not approved by the AI Governance Office for processing confidential or personal data of the Bank is prohibited.

## 7 Governance and approval

7.1 The AI Governance Office is the second-line function responsible for this policy. It maintains the AI Inventory, reviews AI Act classifications, and issues or refuses AI use-case approvals.

7.2 No AI system shall be put into production use without a documented use-case approval. Approval authority depends on the AI Risk Class: High requires the AI Governance Committee; Elevated requires the Head of the AI Governance Office; Standard may be approved by a delegated AI Governance Office officer.

7.3 Where the AI system is also a model under MRM-POL-001, use-case approval does not replace model approval. Model approval by the competent authority under MRM-POL-001, following independent validation under MV-STD-001 and MV-STD-020, is a precondition for production use.

7.4 For AI systems classified as high-risk where the Bank acts as provider, the Bank shall implement a risk management system (Art. 9), data governance (Art. 10), technical documentation (Art. 11), automatic record-keeping (Art. 12), transparency to deployers (Art. 13), human oversight (Art. 14) and accuracy, robustness and cybersecurity measures (Art. 15), integrated into the model lifecycle of MRM-POL-001 and MRM-STD-020.

7.5 For AI systems classified as high-risk where the Bank acts as deployer, the Bank shall use the system in accordance with the instructions for use, assign human oversight to competent persons, ensure input data are relevant and representative, monitor operation, and retain automatically generated logs for at least six months (Art. 26 AI Act).

7.6 Before first use of a high-risk AI system under Annex III point 5(b) or 5(c), the Bank shall perform a fundamental rights impact assessment (Art. 27 AI Act) and shall coordinate it with the data protection impact assessment required under PRIV-POL-001.

7.7 Serious incidents and malfunctions of AI systems shall be reported to the AI Governance Office within one business day of detection. The AI Governance Office decides on regulatory notification under Art. 73 AI Act.

7.8 Where an AI system or GPAI model is sourced from a third party, the procurement shall follow the Third-Party and Outsourcing Risk Policy (TPR-POL-001), including AI-specific due diligence on training data provenance, documentation, evaluation results and contractual rights to information and audit.

## 8 Transparency towards customers and users

8.1 Customers who are subject to a decision based on the output of a high-risk AI system shall, on request, receive a clear and meaningful explanation of the role of the AI system in the decision and the main elements of the decision (Art. 86 AI Act), in addition to their rights under Art. 13–15 and 22 GDPR.

8.2 AI-generated or AI-manipulated content published to customers or the public shall be labelled as such in accordance with Art. 50 AI Act and AI-STD-710.

8.3 Internal users of AI systems shall be provided with instructions for use that describe the intended purpose, known limitations, performance levels and the oversight tasks they are expected to perform.

## 9 AI literacy

9.1 The Bank shall ensure a sufficient level of AI literacy of staff and other persons dealing with the operation and use of AI systems on its behalf, taking into account their technical knowledge, experience, education and the context of use (Art. 4 AI Act).

9.2 All staff shall complete the Bank's baseline AI awareness training. Developers, validators, Use Case Owners and staff assigned to human oversight shall complete role-specific training before being assigned to an AI use case, and refresher training at least every two years.

9.3 Completion of AI literacy training shall be recorded and reported quarterly to the AI Governance Committee.

## 10 Roles and responsibilities

| Role | Responsibilities |
|---|---|
| Management Board | Approves this policy and the AI risk appetite; receives annual AI risk reporting. |
| AI Governance Committee | Approves High-class use cases, oversees the AI Inventory and AI Act compliance. |
| AI Governance Office (2LoD) | Owns this policy and the AI Inventory; reviews classifications; approves Elevated and Standard use cases; coordinates AI incident handling. |
| Use Case Owner (1LoD) | Accountable for the use case, its registration, classification, human oversight design and outcomes. |
| Model developers (1LoD) | Develop AI systems in line with AI-STD-700, AI-STD-710 and MRM-STD-020. |
| Model Validation (2LoD) | Independently validates AI systems that are models under MV-STD-020. |
| Privacy Office and DPO | Advise on DPIAs, lawful basis and automated decision-making. |
| Internal Audit (3LoD) | Assesses the effectiveness of AI governance. |

## 11 Exceptions and dispensations

11.1 Exceptions to this policy require prior written approval by the AI Governance Committee, are time-bound to a maximum of twelve months and are recorded in the AI Inventory with compensating controls. No exception may be granted to the prohibitions in section 6.1 or to any requirement of the AI Act.

## 12 Related documents

- Regulation (EU) 2024/1689 (AI Act), as amended by Regulation (EU) 2026/1744
- Regulation (EU) 2016/679 (GDPR)
- MRM-POL-001 Model Risk Management Policy
- MRM-STD-010 Model Inventory and Tiering Standard
- MRM-STD-020 Model Development Standard; MRM-STD-021 Model Documentation Standard
- AI-STD-700 Machine Learning Model Standard; AI-STD-710 Generative AI Use Standard
- MV-STD-001 Model Validation Standard; MV-STD-020 AI and ML Validation Standard
- PRIV-POL-001 Privacy and Data Protection Policy; TPR-POL-001 Third-Party and Outsourcing Risk Policy

## 13 Document history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2024-09 | First issue following entry into force of the AI Act. |
| 1.1 | 2025-02 | Prohibited practices and AI literacy provisions applicable from 2 February 2025. |
| 2.0 | 2026-05 | Alignment with the Digital Omnibus amendment (Regulation (EU) 2026/1744) and Annex III application date of 2 December 2027; internal AI Risk Classes; fundamental rights impact assessment; alignment with MRM-POL-001 v5.0. |
