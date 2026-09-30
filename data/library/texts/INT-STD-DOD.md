# Definition of Default Standard

| | |
|---|---|
| **Reference** | CR-STD-110 |
| **Version and date** | v3.0 (2025-09) |
| **Owner** | Credit Risk Management |
| **Approval body** | Group Risk Committee, after endorsement by the Model Risk Committee |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose

1.1 This Standard defines when an obligor is in default, how default is identified, and when an obligor returns to non-default status. It implements CRR Article 178, Commission Delegated Regulation (EU) 2018/171 on the materiality threshold for credit obligations past due (RTS 2018/171), the materiality thresholds set by the competent authority, and EBA/GL/2016/07 on the application of the definition of default.

1.2 A single definition of default is essential for the consistency of credit risk management, own funds requirements, accounting impairment and reporting. This Standard is therefore binding for all these purposes.

## 2 Scope and applicability

2.1 The Standard applies to all credit obligations of the Bank, in all exposure classes, and to all processes and models that use default status, including IRB rating systems (CRM-STD-100), IFRS 9 expected credit loss models (FIN-STD-200), non-performing exposure reporting and credit monitoring (CR-POL-001).

2.2 The Standard governs the default flag in production systems and the construction of the default flag in reference data sets (RDS) used for model development, calibration and validation.

## 3 Definitions

- **Credit obligation** — any amount of principal, interest and fees owed by the obligor to the Bank.
- **Past due amount** — the sum of all amounts of principal, interest and fees that are due and have not been paid.
- **Materiality threshold** — the combined absolute and relative limits a past due amount must exceed for days past due to be counted.
- **Days past due (dpd)** — the number of consecutive days during which the materiality threshold is exceeded.
- **Unlikeliness to pay (UTP)** — the situation in which the Bank considers that the obligor is unlikely to pay its credit obligations in full without recourse to actions such as realising collateral.
- **Distressed restructuring** — a forbearance measure that is likely to result in a diminished financial obligation.
- **Diminished financial obligation (DFO)** — the reduction in the net present value of expected cash flows caused by a restructuring, calculated in accordance with 6.4.
- **Probation period** — the minimum period during which no default trigger applies before an obligor may return to non-default status.
- **Default event** — an episode from the date of default to the date of return to non-default status.

## 4 General principles

4.1 The definition of default shall be applied consistently across the IRB approach, IFRS 9 (Stage 3 and credit-impaired status), regulatory reporting of non-performing exposures and credit risk management, in all Group entities and for all exposure classes.

4.2 Default shall be identified at obligor level for all exposure classes. When an obligor is in default, all its credit obligations to the Bank shall be flagged as defaulted. The option in CRR Article 178(1) to apply the definition at facility level for retail exposures is not used.

4.3 Joint credit obligations and contagion between connected obligors shall be treated in accordance with section 8 of EBA/GL/2016/07. The default of a joint obligation shall be propagated to the individual exposures of the obligors unless the Bank demonstrates that recognising the individual exposures as defaulted is not justified.

4.4 An obligor is in default when either or both of the following occur: (a) the obligor is more than 90 days past due on a material credit obligation (section 5); (b) the obligor is considered unlikely to pay (section 6).

4.5 The date of default shall be the first day on which any default criterion is met, and shall be recorded for every default event.

## 5 Past-due criterion

5.1 Days past due shall be counted from the first day on which both the absolute and the relative component of the materiality threshold are exceeded. Counting shall be reset to zero when either component is no longer exceeded.

5.2 For retail exposures, the materiality threshold is EUR 100 (absolute component) and 1% (relative component). For non-retail exposures, it is EUR 500 (absolute component) and 1% (relative component). These values are those set by the competent authority under RTS 2018/171.

5.3 The absolute component shall be compared with the sum of all past due amounts of the obligor. The relative component shall be the ratio of that sum to the total on-balance-sheet exposure of the obligor.

5.4 An obligor shall be in default when the number of days past due exceeds 90.

5.5 Where the repayment schedule is changed (suspension, deferral or extension), days past due shall be counted on the basis of the modified schedule. Where the change is a forbearance measure, the assessment of distressed restructuring under 6.4 shall be performed.

5.6 A situation shall be treated as technical past due, and not counted, only in the situations recognised as technical past due in EBA/GL/2016/07, such as an error of a data or payment system. Each technical past due case shall be documented and corrected within 30 days, and the cases shall be reviewed quarterly by Credit Risk Management.

5.7 Days past due shall be counted daily in the source systems for all obligors.

## 6 Unlikeliness to pay

6.1 The following UTP triggers shall lead to default without further assessment:
(a) the credit obligation is placed in non-accrued status;
(b) a specific credit risk adjustment is recognised resulting from a significant perceived decline in credit quality, including all Stage 3 loss allowances under FIN-STD-200;
(c) a credit obligation is sold at a credit-related economic loss exceeding 5% of the amount sold;
(d) a distressed restructuring with a diminished financial obligation exceeding 1%;
(e) the Bank files for the obligor's bankruptcy or similar protection, or the obligor has sought or been placed in bankruptcy or similar protection;
(f) the forced sale of collateral, or the calling of a guarantee, initiated by the Bank because of the obligor's inability to pay.

6.2 The following indicators shall lead to a case-by-case UTP assessment, completed within 30 days of detection: fraud by the obligor; a significant decline in income or cash flow; breach of material covenants; multiple forbearance measures; default of a connected obligor; the obligor's own default at another institution where known; and a loss of a major customer or source of income.

6.3 The UTP triggers and indicators shall be documented, mapped to source-system fields and applied consistently across portfolios and over time. The outcome of each case-by-case assessment shall be recorded with its rationale.

6.4 The diminished financial obligation shall be calculated as the difference between the net present value of expected cash flows before and after the restructuring, divided by the net present value before the restructuring, both discounted at the original effective interest rate.

## 7 Return to non-default status

7.1 An obligor shall return to non-default status only when none of the default triggers has applied for at least three months, and the assessment of the obligor's behaviour and financial situation during that period shows that the improvement of credit quality is factual and permanent.

7.2 For defaults caused by a distressed restructuring, the probation period shall be at least 12 months, starting from the latest of the restructuring date, the end of any grace period and the date of the default. Return additionally requires that a material payment has been made, no amount is past due and there are no concerns about full repayment.

7.3 Probation periods shall be monitored in the production systems, and the probation start date and status shall be recorded for every default event.

7.4 Credit Risk Management shall analyse at least annually the re-default rates of obligors that returned to non-default status, by default trigger, and shall propose longer probation periods where re-default rates indicate that cure is not permanent.

## 8 Multiple defaults

8.1 Where an obligor returns to non-default status and is classified as defaulted again within 12 months, the two default events shall be treated as a single default event for the purposes of risk parameter estimation, starting on the first date of default.

8.2 The RDS shall identify multiple default events and link them so that the treatment in 8.1 can be applied to default counts, realised LGD and realised CCF. The number of merged default events shall be reported in the RDS documentation.

## 9 Default flag in models and historical data

9.1 The default flag in each RDS shall be constructed in accordance with this Standard, including the materiality thresholds, UTP triggers, probation periods and the treatment of multiple defaults.

9.2 The default flag construction in the RDS code shall be reconciled with the production default flag for the periods in which both are available; differences shall be explained.

9.3 The components of this definition (dpd counters with materiality thresholds, UTP flags and probation status) have been captured in the Bank's source systems since 1 January 2016. For earlier periods the default flag shall be approximated from the available arrears and restructuring data. Each approximation shall be documented, its effect on default rates quantified, and the resulting deficiency linked to a margin of conservatism category in accordance with CRM-STD-101 section 3.

9.4 Where the default flag for a period cannot be reconstructed with probation periods, the RDS documentation shall state the periods concerned and the treatment applied.

9.5 External data used in models shall be assessed for differences from this definition of default in accordance with CRM-STD-100.

## 10 Governance and monitoring

10.1 Credit Risk Management shall report quarterly to the Group Risk Committee on the number of defaults by trigger, cures, re-defaults, technical past due cases and case-by-case UTP assessments.

10.2 The default flags used for IRB and IFRS 9 purposes shall be reconciled quarterly between the risk and finance systems.

10.3 Any change to this Standard is a change to all IRB rating systems and shall be assessed under MRM-STD-050 and Commission Delegated Regulation (EU) No 529/2014.

10.4 Internal Audit shall review the application of the definition of default regularly, and at least every two years.

## 11 Roles and responsibilities

11.1 **Credit Risk Management** owns this Standard and the default register, and performs case-by-case UTP assessments above the business-line authority.
11.2 **Business lines and Arrears Management** identify UTP indicators and apply automatic triggers.
11.3 **Finance** ensures consistency between Stage 3 and default status under FIN-STD-200.
11.4 **Credit Risk Modelling** constructs RDS default flags in accordance with section 9.
11.5 **Model Validation** verifies that the implemented default flag matches this Standard (MV-STD-010).

## 12 Exceptions and dispensations

12.1 No dispensation may be granted from sections 4 to 8. Dispensations from other provisions require approval by the Group Risk Committee, are time-bound to a maximum of 12 months and are recorded in the policy dispensation register.

## 13 Related documents

- Regulation (EU) No 575/2013 (CRR), Article 178; Commission Delegated Regulation (EU) 2018/171
- EBA/GL/2016/07 Guidelines on the application of the definition of default; EBA/GL/2017/16
- CR-POL-001 Credit Risk Policy; CRM-STD-100 IRB Rating System Standard; CRM-STD-101 Margin of Conservatism Standard; FIN-STD-200 IFRS 9 ECL Methodology Standard
- MRM-STD-022 Data Quality Standard for Models; MRM-STD-050 Model Change and Regulatory Notification Standard; MV-STD-010 IRB Validation Standard

## 14 Document history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2016-01 | Capture of default components in source systems. |
| 2.0 | 2020-12 | Full implementation of EBA/GL/2016/07 and RTS 2018/171. |
| 3.0 | 2025-09 | Multiple default treatment (section 8); forced sale of collateral as automatic trigger; historical approximation and MoC link (9.3). |
