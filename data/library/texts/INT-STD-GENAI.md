# Generative AI Use Standard

| | |
|---|---|
| **Reference** | AI-STD-710 |
| **Version** | 1.0 |
| **Date** | July 2026 |
| **Owner** | AI Governance Office |
| **Approval body** | AI Governance Committee, with the concurrence of the Model Risk Committee |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose

1.1 This standard sets the minimum requirements for the approval, design, evaluation, deployment and monitoring of generative AI (GenAI) applications at the Bank. It implements the Responsible AI Policy (AI-POL-001) for GenAI and addresses risks specific to large language models (LLMs): hallucination, lack of grounding, prompt injection, leakage of confidential or personal data, non-determinism, dependency on third-party model providers and automation bias of users.

1.2 GenAI applications that meet the model definition of the Model Risk Management Policy (MRM-POL-001) are also subject to the model lifecycle, documentation and validation requirements of MRM-STD-020, MRM-STD-021 and MV-STD-020. This standard specifies how those requirements apply to GenAI.

## 2 Scope and applicability

2.1 This standard applies to every application in which a generative model produces text, code, images, audio or structured content for use in the Bank's business processes, whether the model is developed in-house, accessed via an application programming interface of a third-party provider, or embedded in vendor software.

2.2 Personal productivity use of approved enterprise GenAI assistants without integration into a business process is governed by the Acceptable Use Rules for GenAI and only by sections 7.3, 11 and 12 of this standard.

2.3 Requirements are proportionate to the internal AI Risk Class (AI-POL-001 §5.6). Provisions specifying thresholds by class apply as stated; all other provisions apply to all in-scope applications.

## 3 Definitions

| Term | Definition |
|---|---|
| Foundation model | A general-purpose AI model, including an LLM, that can be adapted to a wide range of tasks. |
| Application | The complete GenAI solution: foundation model, system prompt, prompt templates, retrieval components, guardrails, user interface and integration. |
| Retrieval-augmented generation (RAG) | A design in which the model's output is conditioned on documents retrieved from a controlled knowledge source at inference time. |
| Grounding | The degree to which generated content is supported by the retrieved or supplied source material. |
| Hallucination | Generated content that is factually wrong or not supported by the source material presented as factual. |
| Guardrail | An automated control applied to inputs or outputs of the application to prevent or detect unwanted behaviour. |
| Golden set | A versioned, representative evaluation data set of inputs with reference answers or labelled expectations. |
| Red-teaming | Structured adversarial testing aimed at inducing failures, policy violations or security breaches. |

## 4 Use-case approval

4.1 Every GenAI use case shall be registered in the AI Inventory and approved in accordance with AI-POL-001 §7.2 before any production use, including pilots involving real customer or employee data.

4.2 The use-case approval form shall describe the business purpose, users, affected persons, input data and data classifications, foundation model and provider, application design, the decisions or outputs supported, the human-in-the-loop design, the AI Act classification, the AI Risk Class and the evaluation plan.

4.3 The use-case approval shall define the boundaries of intended use, including the tasks the application shall not perform. For applications supporting credit processes, the application shall not produce a credit decision, a rating or a recommendation to approve or decline.

4.4 A new use-case approval is required when the purpose, user group, affected persons, data classifications or degree of automation changes.

## 5 Model, prompt and configuration versioning

5.1 The foundation model shall be identified by provider, model name and pinned version. The use of provider aliases that change the underlying model without notice ("latest") is not permitted in production.

5.2 System prompts, prompt templates, retrieval configurations, guardrail configurations and generation parameters (for example temperature and maximum output length) shall be version-controlled and released through the Bank's change management process.

5.3 A change of the foundation model version, of the system prompt or of the retrieval configuration shall be preceded by a regression evaluation on the golden set (section 8) with results meeting the thresholds of §8.3 before release.

## 6 Prompt and retrieval design

6.1 System prompts shall state the role and task of the model, the permitted sources, the required output format, the instruction to answer only from supplied sources and to state when information is not available, and the prohibited content.

6.2 Where RAG is used, the knowledge sources shall be listed, owned and subject to data quality and access controls. Retrieval shall respect the access entitlements of the requesting user; the application shall not retrieve documents the user is not authorised to see.

6.3 The chunking, embedding and ranking approach and the number of retrieved passages shall be documented. Retrieval quality shall be tested: recall of the relevant passages within the retrieved set shall be at least 90% on the retrieval test set.

6.4 Outputs presenting facts from source documents shall include references to the source passages used, so that a reviewer can verify each statement.

6.5 Personal data shall not be included in prompts unless necessary for the approved purpose and covered by the DPIA under PRIV-POL-001.

## 7 Guardrails

7.1 **Grounding check.** Applications presenting factual content shall apply an automated grounding check that flags statements not supported by the source material before the output is shown to the user or reviewer.

7.2 **Numeric-claims check.** Every numeric value in an output (amounts, ratios, percentages, dates) shall be automatically compared with the source material. Numbers that cannot be matched to a source value, or to a documented calculation from source values, shall be flagged to the reviewer.

7.3 **PII filtering.** Inputs and outputs shall be screened for personal data and confidential identifiers that are not permitted for the use case. Detected items shall be masked or blocked, and detections logged.

7.4 **Prompt-injection and content controls.** Inputs, including retrieved documents, shall be screened for prompt-injection patterns, and outputs for harmful, discriminatory or out-of-scope content.

7.5 Guardrail thresholds and actions (warn, mask, block) shall be documented and their effectiveness tested as part of the evaluation.

## 8 Hallucination and groundedness evaluation

8.1 Every application shall be evaluated before production use on a golden set of at least 200 representative cases, including edge cases and cases in which the correct answer is that information is not available. The golden set shall be versioned and labelled by subject-matter experts.

8.2 The evaluation shall measure at least: groundedness (the share of factual statements supported by the sources), hallucination rate (the share of outputs containing at least one unsupported or incorrect material statement), numeric accuracy, completeness against the reference, and the rate of correct abstention.

8.3 Minimum thresholds for production use are:

| Metric | AI Risk Class High / Elevated | AI Risk Class Standard |
|---|---|---|
| Groundedness | ≥ 95% | ≥ 90% |
| Hallucination rate | ≤ 2% | ≤ 5% |
| Numeric accuracy | 100% of numeric values correct or flagged by the guardrail | ≥ 98% |

8.4 Automated evaluation using a model as judge is permitted only where the judge has been calibrated against human labels on at least 100 cases with an agreement of at least 85%. Calibration results shall be documented.

8.5 Because outputs are non-deterministic, each evaluation shall run at the production generation parameters and report variability across at least three repeated runs on a subset of the golden set.

## 9 Red-teaming

9.1 Every application of AI Risk Class Elevated or High shall be red-teamed before production use, at least annually thereafter and after each change of foundation model version.

9.2 Red-teaming shall cover at least direct and indirect prompt injection, jailbreaking, extraction of system prompts or confidential data, leakage of personal data, generation of biased or harmful content and use outside the approved boundaries.

9.3 Findings shall be rated, remediated or accepted by the Use Case Owner, and re-tested. Critical findings shall be remediated before go-live.

## 10 Human-in-the-loop

10.1 Outputs used in business decisions or sent to customers shall be reviewed and approved by a competent person before use, unless the use-case approval explicitly permits automated release with compensating guardrails.

10.2 Reviewers shall be trained on the limitations of the application and on the risk of automation bias (AI-POL-001 §9.2). The user interface shall display source references and guardrail flags, and shall record the reviewer's approval and edits.

10.3 The effectiveness of human review shall be tested through a monthly second-line quality review of a sample of at least 5% of approved outputs, or 30 outputs, whichever is higher.

## 11 Output labelling and transparency

11.1 Content produced by a GenAI application shall be labelled as AI-generated in the document or interface in which it is used, including the application name and generation date, until a human reviewer has approved it.

11.2 Users interacting with a GenAI application shall be informed that they interact with an AI system (Art. 50(1) AI Act). AI-generated text published to inform the public on matters of public interest shall be disclosed as such unless it has undergone human review and editorial responsibility is held by the Bank (Art. 50(4) AI Act).

## 12 Logging

12.1 The application shall log, for each interaction: user identifier, timestamp, application and component versions (foundation model, system prompt, retrieval and guardrail configuration), input, retrieved source identifiers, output, guardrail results and reviewer decision.

12.2 Logs shall be retained for at least twelve months, or longer where required by the retention schedule of PRIV-POL-001, and shall be access-restricted in accordance with their data classification.

## 13 Third-party model due diligence

13.1 Foundation models and GenAI services from third parties shall be procured under TPR-POL-001. Due diligence shall cover at least: provider documentation on capabilities, limitations and evaluation (including documentation made available under Art. 53 AI Act), terms on use of the Bank's data for training, data location, security certifications, sub-processors, incident notification and advance notice of model deprecation or change.

13.2 The contract shall prohibit the use of the Bank's inputs and outputs for training the provider's models without the Bank's consent and shall provide for notification of material model changes.

13.3 The Bank shall evaluate the third-party model on its own use case in accordance with section 8; provider benchmarks alone are not sufficient.

## 14 Monitoring

14.1 Each application shall have a monitoring plan covering at least: groundedness and hallucination on a sample of production outputs (at least monthly), guardrail trigger rates, reviewer edit and rejection rates, user feedback, latency and availability, and incidents.

14.2 Breaches of the §8.3 thresholds in production monitoring shall be escalated to the Use Case Owner and the AI Governance Office within five business days, with a remediation plan that may include restriction or suspension of the application.

## 15 Roles and responsibilities

| Role | Responsibilities |
|---|---|
| Use Case Owner (1LoD) | Accountable for the use case, its approval, human-in-the-loop design and monitoring. |
| GenAI engineering team (1LoD) | Designs, builds, evaluates and versions the application. |
| AI Governance Office (2LoD) | Owns this standard; approves use cases; performs quality reviews under §10.3. |
| Model Validation (2LoD) | Validates GenAI applications that are models under MV-STD-020. |
| Information Security | Conducts or oversees red-teaming. |
| Privacy Office | Advises on DPIA and PII controls. |

## 16 Exceptions and dispensations

16.1 Deviations require approval by the AI Governance Committee, time-bound to at most six months, with compensating controls recorded in the AI Inventory.

## 17 Related documents

- AI-POL-001 Responsible AI Policy; AI-STD-700 Machine Learning Model Standard
- MRM-POL-001; MRM-STD-020; MRM-STD-021; MV-STD-020
- PRIV-POL-001 Privacy and Data Protection Policy; TPR-POL-001 Third-Party and Outsourcing Risk Policy
- Regulation (EU) 2024/1689 (AI Act), Art. 4, 26, 50 and 53; Regulation (EU) 2016/679 (GDPR); Regulation (EU) 2022/2554 (DORA)

## 18 Document history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-07 | First issue, replacing the interim GenAI guidance note of 2024. |
