# Validation Findings and Rating Standard

| | |
|---|---|
| **Title** | Validation Findings and Rating Standard |
| **Reference** | MV-STD-002 |
| **Version and date** | v2.1 (2026-04) |
| **Owner** | Model Validation (2LoD) – Head of Model Validation |
| **Approval body** | Model Risk Committee |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose

1.1 This Standard sets out how the Model Validation function (MV) formulates, rates and follows up validation findings, and how findings determine the validation opinion. It implements the findings and remediation provisions of the Model Risk Management Policy (MRM-POL-001) and supports the requirement of CRR Art. 185 that deviations identified by validation are analysed and acted upon.

1.2 The Standard ensures that findings are comparable across models and validators, that remediation is timely and that the Model Risk Committee and senior management receive reliable information on unresolved model deficiencies, as expected by the ECB guide to internal models (general topics, internal validation) and the EBA supervisory handbook on the validation of rating systems under the IRB approach.

## 2 Scope and applicability

2.1 This Standard applies to all findings raised by MV in initial, periodic and change validations and in targeted reviews under MV-STD-001, for all models in the model inventory.

2.2 Findings raised by Internal Audit or by supervisors are tracked in the same findings register but rated under their own methodologies; MV reports them alongside its own findings where they concern a validated model.

## 3 Definitions

- **Finding** – a documented deficiency in a model, its data, its documentation, its implementation or its use, identified by MV against a requirement of the requirement library or an internal standard.
- **Findings register** – the central register of findings maintained in the model inventory system.
- **Remediation deadline** – the date by which the model owner must have submitted complete closure evidence.
- **Closure evidence** – the documentation and test results by which the model owner demonstrates that a finding has been remediated.
- **Overdue finding** – a finding that is not closed and for which no extension has been approved on the day after its remediation deadline.
- **Risk acceptance** – a formal decision not to remediate a finding, or not within the standard deadline, taken by the competent authority under §9.4.

## 4 Required finding content

4.1 Each finding is recorded in the findings register with a unique identifier, a title, a severity under §5, and the identifier of each library requirement or standard provision it relates to.

4.2 **Observation.** The finding states the factual observation with a precise reference to the evidence, such as the document section, the code file and line, or the data query.

4.3 **Impact.** The finding describes the effect of the deficiency on the model outputs, the model's use or regulatory compliance, and quantifies it where MV can reasonably do so.

4.4 **Challenge.** The finding states the question the model owner must answer or the outcome the model owner must demonstrate. MV states the required outcome and does not prescribe the technical solution.

4.5 **Owner.** The finding names the accountable 1LoD unit and the responsible person.

4.6 **Deadline.** The finding carries a remediation deadline set in accordance with §6.

4.7 **Factual accuracy review.** MV discusses draft findings with the model owner before the validation report is finalised. Disagreement of the model owner is recorded in the management response; the final severity is determined by MV.

## 5 Severity rating

5.1 Each finding is rated High, Medium or Low.

5.2 **High.** A finding is rated High when at least one of the following applies:
(a) the deficiency leads, or is likely to lead, to a material misstatement of model outputs, indicatively an impact of 5% or more on the RWA, ECL or other key output within the model's scope, or a change of grade or class for 10% or more of exposures;
(b) the model does not comply with a binding regulatory requirement applicable to its use, such as the CRR or the definition of default;
(c) the implemented model deviates from the approved model in a way that affects outputs;
(d) the methodology has a fundamental flaw that calls the reliability of the model into question.

5.3 **Medium.** A finding is rated Medium when it does not meet the High criteria and at least one of the following applies:
(a) the estimated impact on key outputs is between 1% and 5%;
(b) the model does not comply with an internal standard or with a supervisory expectation, without a material impact on outputs;
(c) a required test or analysis is missing, so that a potential material deficiency cannot be excluded;
(d) a weakness exists that can become material if not addressed.

5.4 **Low.** A finding is rated Low when its impact is below 1% or, if not quantifiable, limited, such as documentation gaps, presentational weaknesses or improvements to good practice.

5.5 Where the impact cannot be quantified, MV rates the finding on the qualitative criteria of §§5.2–5.4 and applies the higher severity where two levels are equally supported.

5.6 Related Medium findings that jointly indicate a systemic weakness in the model or its governance may be aggregated into a single High finding.

5.7 The model owner may appeal a severity rating to the Head of Model Validation within ten business days of the draft report; unresolved appeals on High findings are decided by the Model Risk Committee.

## 6 Remediation deadlines

6.1 The remediation deadline shall not exceed six months for High findings, nine months for Medium findings and twelve months for Low findings, counted from the date of the final validation report, and is set at the last day of a month.

6.2 A High finding on a model that has not yet been approved for use must be remediated before approval, or be covered by a condition under MV-STD-001 §10.4 whose compensating measure is approved by the approval authority.

6.3 The model owner submits a remediation plan with milestones for every High and Medium finding within 20 business days of the final validation report.

6.4 **Extensions.** A request to extend a deadline is submitted before the deadline, with a justification and an interim mitigant. A single extension of at most three months for High findings and six months for Medium and Low findings may be approved by the Head of Model Validation for Medium and Low findings and by the Model Risk Committee for High findings. Any further extension requires approval by the Model Risk Committee.

## 7 Follow-up and closure

7.1 The model owner submits a closure evidence package containing a description of the remediation, the updated documentation with version number, references to code changes, the results of re-performed tests and the sign-off of the model owner.

7.2 MV verifies closure evidence before closing a finding. For High findings MV re-performs the relevant test or check; for Medium findings MV re-performs quantitative tests and reviews all other evidence; for Low findings MV reviews the documentation.

7.3 MV decides on closure within 30 business days of receiving a complete package. Only MV can set a finding to "closed". A partially remediated finding remains open; a new deficiency identified during closure review is raised as a new finding.

7.4 Where remediation constitutes a material model change, it follows MRM-STD-050 and the finding is closed only after the related change validation.

7.5 The findings register records the status of each finding (open, in remediation, submitted for closure, closed, risk accepted) and is updated at least monthly.

## 8 Escalation of overdue findings

8.1 A finding becomes overdue on the day after its remediation deadline if it is not closed and no extension has been approved.

8.2 Overdue High findings are reported to the Chief Risk Officer without delay and to the Model Risk Committee at its next meeting. Medium findings that are overdue by more than three months are reported to the Model Risk Committee. All overdue findings are included in the quarterly model risk report.

8.3 Where a High finding is overdue by more than three months, MV reassesses the validation opinion and may downgrade it, or require a usage restriction or a conservative adjustment until remediation.

8.4 For IRB models, open and overdue High findings are included in the annual validation reporting under MV-STD-010 §7.

## 9 Link between findings and validation opinion

9.1 The validation opinion under MV-STD-001 §10.2 reflects the findings open at the report date:
(a) *Fit for purpose* only if no High finding is open and the open Medium findings do not require conditions on the model's use;
(b) *Fit for purpose with conditions* if one or more High findings, or Medium findings requiring conditions, are open and their impact is contained by the conditions stated;
(c) *Not fit for purpose* if one or more High findings are open whose impact cannot be adequately contained by conditions.

9.2 Where a condition compensates a High finding with a quantitative adjustment, such as a margin of conservatism or a post-model adjustment, the adjustment covers at least MV's estimate of the impact of the finding.

9.3 Closure of the findings on which conditions were based leads to a review of the opinion by MV, documented in the findings register.

9.4 **Risk acceptance.** The model owner may request risk acceptance instead of remediation. Risk acceptance of Low and Medium findings is decided by the Head of Model Risk Management; of High findings by the Chief Risk Officer after consultation of the Model Risk Committee. Risk acceptance is time-limited and is not available for findings of non-compliance with binding regulation.

## 10 Roles and responsibilities

- **Validators** – formulate findings under §4 and propose severities.
- **Head of Model Validation** – approves severities, decides on appeals and on extensions within the authority of §6.4.
- **Model owner (1LoD)** – remediates findings, submits remediation plans and closure evidence, and requests extensions in good time.
- **Model Risk Management** – maintains the findings register and prepares escalation reporting.
- **Model Risk Committee** – decides on escalated severities, extensions of High findings and overdue findings.

## 11 Exceptions and dispensations

11.1 Deviations from this Standard, other than extensions and risk acceptances governed by §§6.4 and 9.4, require a dispensation approved by the Head of Model Validation and reported to the Model Risk Committee.

## 12 Related documents

- Regulation (EU) No 575/2013 (CRR), Article 185
- EBA supervisory handbook on the validation of rating systems under the IRB approach
- ECB guide to internal models (general topics chapter)
- MRM-POL-001 Model Risk Management Policy
- MRM-STD-050 Model Change and Regulatory Notification Standard
- MV-STD-001 Model Validation Standard; MV-HB-003 Validation Testing Handbook; MV-STD-010 IRB Validation Standard; MV-STD-020 AI and ML Validation Standard
- MRM-GOV-001 Model Risk Committee – Terms of Reference

## 13 Document history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2022-01 | First issue. |
| 2.0 | 2024-03 | Quantitative severity indicators introduced; closure re-performance for High findings. |
| 2.1 | 2026-04 | Mandatory link of findings to library requirements (§4.1); risk acceptance authorities aligned with MRM-POL-001 v5.0. |
