# Credit Acceptance and Scorecard Standard

| | |
|---|---|
| **Reference** | CR-STD-120 |
| **Version and date** | v2.5 (2026-02) |
| **Owner** | Retail Credit Risk |
| **Approval body** | Retail Credit Committee; model aspects endorsed by the Model Risk Committee |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose

1.1 This Standard sets the requirements for the development, calibration and use of application scorecards and acceptance models, the setting of cut-offs, the assessment of affordability, the handling of overrides and the monitoring of acceptance decisions for retail credit.

1.2 The Standard implements the requirements on creditworthiness assessment and automated models in EBA/GL/2020/06 (sections 4.3.4 and 5.2), Directive 2014/17/EU (Mortgage Credit Directive, MCD, Articles 18 and 20) and the consumer credit rules applicable in the Bank's markets, and it gives effect to sections 5, 7 and 9 of the Credit Risk Policy (CR-POL-001).

## 2 Scope and applicability

2.1 The Standard applies to all acceptance processes for credit to natural persons (residential mortgages, consumer loans, credit cards and overdrafts) and to small business customers assessed through retail scoring processes.

2.2 It covers application scorecards, policy rules, affordability rules, cut-offs and the decision engine in which they are implemented. Behavioural rating systems used for IRB purposes are governed by CRM-STD-100.

## 3 Definitions

- **Application scorecard** — a model that ranks applicants by expected credit risk using information available at the time of application.
- **Policy rule** — a knock-out rule that leads to decline or referral irrespective of the score (for example an active default or insufficient age of residence).
- **Cut-off** — the score at or above which an application is accepted, subject to policy and affordability rules.
- **Referral band** — a score range below or around the cut-off in which applications are referred for manual underwriting.
- **Through-the-door (TTD) population** — all applications received, including those declined.
- **Reject inference** — techniques to estimate the performance that declined applicants would have shown had they been accepted.
- **Low-side override** — acceptance of an application that the scorecard or rules would decline. **High-side override** — decline of an application that would be accepted.
- **Affordability assessment** — the assessment of whether the applicant can meet the credit obligations from income after fixed commitments and living expenses, under stressed conditions.

## 4 Decision framework

4.1 Every acceptance decision shall combine policy rules, the application score, the affordability assessment and, for secured credit, the collateral assessment. An application shall be accepted only if all four components are passed or an authorised override is applied.

4.2 The creditworthiness assessment shall be based primarily on the applicant's ability to meet the credit obligations, and not predominantly on the value of the collateral, in accordance with MCD Article 18(3) and EBA/GL/2020/06.

4.3 Automated models used in creditworthiness assessment shall meet the requirements of section 4.3.4 of EBA/GL/2020/06: the Bank shall understand the model's methodology, input data, assumptions and limitations, and shall be able to explain its outcomes.

4.4 All parameters of the decision engine (policy rules, scorecard coefficients, cut-offs, affordability parameters) shall be version-controlled and changed only through the approval process of section 7 and the model change process of MRM-STD-050.

## 5 Application scorecard development

5.1 The target variable shall be defined as 90 days past due or default under CR-STD-110 within a performance window of 12 months for consumer credit and 24 months for mortgages, unless a different window is justified by maturity analysis. Indeterminate outcomes and their treatment shall be documented.

5.2 The development sample shall be drawn from the TTD population of the most recent period for which the performance window is complete, and its representativeness for the current applicant population shall be demonstrated with the PSI, applying the amber threshold of 0.10 and the red threshold of 0.25.

5.3 Candidate variables shall be sourced from the application, the credit bureau and internal data. Their lineage shall be documented in accordance with DATA-POL-001, and the use of personal data shall be limited to what is necessary, in accordance with PRIV-POL-001.

5.4 Protected attributes shall not be used, and candidate variables shall be screened for proxy effects, in accordance with CR-POL-001 section 9.

5.5 Discriminatory power shall be measured on an out-of-time sample and assessed against the thresholds of MV-HB-003. Score scaling (base score, odds at base score and points to double the odds) shall be documented.

5.6 Scorecards built with machine learning techniques shall additionally comply with AI-STD-700.

## 6 Reject inference

6.1 Where a scorecard is developed on accepted applications only, reject inference shall be performed, or its omission justified by showing that the effect of selection bias on the ranking of the TTD population is immaterial.

6.2 The reject inference method (for example augmentation, parcelling or use of bureau performance of declined applicants) and its assumptions shall be documented and justified.

6.3 The sensitivity of the scorecard and of the expected bad rates per score band to the choice of reject inference method shall be assessed and reported.

6.4 Where lawfully available, the inferred performance of declined applicants shall be checked against observed external performance (for example bureau outcomes on credit obtained elsewhere).

## 7 Cut-off setting

7.1 Cut-offs shall be set on the basis of the expected bad rate per score band, the target approval rate and the risk-adjusted return, and shall be within the credit risk appetite and portfolio limits of CR-POL-001 section 4.

7.2 Each cut-off proposal shall document the expected approval rate, the expected bad rate and expected loss of the accepted population, and a swap-set analysis showing the applications newly accepted and newly declined compared with the current cut-off.

7.3 Cut-offs and referral bands shall be approved by the Retail Credit Committee before implementation.

7.4 Cut-offs shall be reviewed at least annually and after any material change in the applicant population, the scorecard or the credit risk appetite.

## 8 Affordability rules

8.1 An affordability assessment shall be performed for every application. It shall take into account verified income, existing credit commitments, other fixed expenses and living expenses based on reference budgets that reflect household composition.

8.2 Income and relevant financial information shall be verified using independent sources, in accordance with MCD Article 20 and EBA/GL/2020/06.

8.3 For mortgages, the affordability assessment shall apply the loan-to-value, loan-to-income and debt-service-to-income limits set by national law and macroprudential measures and by the credit risk appetite. Where the interest rate is fixed for less than ten years, debt service shall be calculated at a stressed interest rate.

8.4 Affordability limits set by law shall not be overridden. Any use of a statutory exception shall be documented with the justification required by law.

8.5 Affordability parameters, including living expense reference budgets and stress rates, shall be reviewed and updated at least annually.

## 9 Overrides

9.1 Low-side and high-side overrides may be applied only by underwriters with the delegated authority set by the Retail Credit Committee, using a reason code from a closed list and a written rationale.

9.2 Policy rules marked as non-overridable (including active default, fraud indicators and statutory affordability limits) shall not be overridden.

9.3 The override rate shall be monitored monthly per product. An override rate above 5% of decisions shall trigger an analysis by the Model Owner and reporting to the Retail Credit Committee, consistent with CR-POL-001 section 7.

9.4 The performance of low-side overrides shall be tracked and compared with the expected bad rate of the scorecard at least annually.

9.5 Override reasons shall not relate to protected attributes. Override decisions shall be included in the outcome testing of CR-POL-001 9.5.

## 10 Monitoring

10.1 Front-end monitoring shall be performed monthly and cover application volumes, approval rates, score distribution stability (PSI), characteristic stability, policy rule hit rates and override rates.

10.2 Back-end monitoring shall be performed at least quarterly once outcomes are available and cover discriminatory power, observed versus expected bad rates per score band, vintage curves and early delinquency.

10.3 Monitoring results shall be assessed against the thresholds of MRM-STD-040 and MV-HB-003; red outcomes require a remediation plan approved by the Retail Credit Committee within three months.

10.4 Outcome testing for disparate impact under CR-POL-001 section 9 shall be performed at least annually on acceptance decisions.

## 11 Customer information and automated decisions

11.1 Where an application is declined, the applicant shall be informed without delay and, where applicable, that the decision is based on automated processing of data or on the consultation of a database, in accordance with MCD Article 18(5)(c).

11.2 Applicants subject to a decision based solely on automated processing shall be able to obtain human intervention, express their point of view and contest the decision (GDPR Article 22).

11.3 Acceptance models that qualify as AI systems are high-risk AI systems under Annex III of the AI Act and shall comply with the Responsible AI Policy (AI-POL-001).

## 12 Roles and responsibilities

12.1 **Retail Credit Risk** owns this Standard, the policy rules and the affordability parameters, and proposes cut-offs.
12.2 **Retail Credit Risk Modelling** develops and monitors scorecards as delegate of the Model Owner.
12.3 **Retail Credit Committee** approves cut-offs, referral bands, override authorities and the automated decision process.
12.4 **Model Risk Management and Model Validation** approve and validate acceptance models in accordance with MRM-POL-001 and MV-STD-001.
12.5 **Privacy Office** advises on lawful processing, DPIAs and automated decision-making.

## 13 Exceptions and dispensations

13.1 Deviations require a dispensation approved by the Retail Credit Committee, time-bound to a maximum of 12 months and recorded in the policy dispensation register. No dispensation may be granted from 5.4, 8.4 or 9.2.

## 14 Related documents

- EBA/GL/2020/06 Guidelines on loan origination and monitoring
- Directive 2014/17/EU (MCD), Articles 18–20; Regulation (EU) 2016/679 (GDPR), Article 22; Regulation (EU) 2024/1689 (AI Act)
- CR-POL-001 Credit Risk Policy; CR-STD-110 Definition of Default Standard; CRM-STD-100 IRB Rating System Standard
- MRM-POL-001; MRM-STD-040 Model Monitoring Standard; MRM-STD-050 Model Change and Regulatory Notification Standard; MV-HB-003 Validation Testing Handbook
- AI-POL-001 Responsible AI Policy; AI-STD-700 Machine Learning Model Standard; PRIV-POL-001 Privacy and Data Protection Policy; DATA-POL-001 Data Management and Governance Policy

## 15 Document history

| Version | Date | Change |
|---|---|---|
| 2.0 | 2021-06 | Alignment with EBA/GL/2020/06 (creditworthiness assessment, automated models). |
| 2.4 | 2024-10 | Swap-set analysis for cut-offs; non-overridable policy rules. |
| 2.5 | 2026-02 | Reject inference sensitivity (6.3); AI Act high-risk classification (11.3); annual outcome testing (10.4). |
