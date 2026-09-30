# Expert Judgement Standard

| | |
|---|---|
| **Reference** | MRM-STD-023 |
| **Version and date** | v1.4 (2025-06) |
| **Owner** | Model Risk Management (2LoD) |
| **Approval body** | Model Risk Committee |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose, scope and definitions

1.1 **Purpose.** Expert judgement is unavoidable in modelling, but it is also a significant source of model risk because it is less transparent and less testable than statistical estimation. This Standard ensures that every use of expert judgement in the model life cycle is identified, justified, documented, approved, challenged and monitored. It implements the expert judgement provisions of the Model Risk Management Policy (MRM-POL-001).

1.2 **Regulatory basis.** The Standard gives effect to CRR Article 172(3) (documentation of the situations in which human judgement may override the inputs or outputs of the rating assignment process), CRR Article 174(e) (human judgement and oversight complementing statistical models), CRR Article 179(1)(a) and (f) (plausible estimates and margin of conservatism), and the provisions of EBA/GL/2017/16 on human judgement in risk parameter estimation and on overrides.

1.3 **Scope.** The Standard applies to all models in the Model Inventory (MRM-STD-010) and to every life cycle stage: data preparation, model design and development, calibration, implementation, use and monitoring. Requirements for the documentation of the model as a whole are set out in MRM-STD-021; this Standard adds the requirements specific to expert judgement.

1.4 **Definitions.**

- **Expert judgement (EJ):** any decision affecting model data, model design, model parameters or model outputs that is based on the experience, knowledge or opinion of individuals rather than derived directly from data by a documented statistical or deterministic method.
- **Expert judgement log (EJ log):** the register, maintained per model, recording every instance of expert judgement in accordance with section 2.
- **Override:** a change by a human to the output of a model for an individual obligor, facility or transaction (for example a rating override).
- **Overlay (post-model adjustment):** an adjustment applied to the outputs of a model for a portfolio or segment, outside the model itself, to capture risks or effects the model does not reflect.
- **Approver:** the individual or body authorised under section 2 to approve an instance of expert judgement.

## 2 Documentation and approval of expert judgement

2.1 Expert judgement applied in data treatment, model design, calibration, overrides and overlays shall be documented and approved before the affected data, model or output is used. No expert judgement may be applied informally or undocumented.

2.2 Every model shall have an EJ log, stored with the model documentation in the model repository. Each entry in the EJ log shall contain at least:

a) a unique identifier and the model identifier;
b) the type of expert judgement (section 3) and the life cycle stage;
c) a description of the judgement and of the data, segment or parameter affected;
d) the rationale, including the evidence relied on (data analysis, external benchmarks, business knowledge) and the alternatives considered and rejected;
e) the quantified impact on the model output, or, where quantification is not possible, a qualitative assessment and the reason quantification is not possible;
f) the materiality classification under section 4;
g) the name and function of the person proposing the judgement;
h) the name and function of the approver and the date of approval;
i) the date by which the judgement shall be reviewed, and the conditions under which it expires.

2.3 The rationale shall be sufficiently specific for a knowledgeable third party to understand why the judgement was made and to replicate its effect. Statements such as "based on business experience" without supporting evidence are not an acceptable rationale.

2.4 Expert judgement shall be approved at the level set by its materiality:

| Materiality (section 4) | Minimum approver |
|---|---|
| Low | Model Owner |
| Medium | Model Owner and Head of the model development unit |
| High | Model Risk Committee, after review by Model Validation |

2.5 The proposer of an expert judgement may not be its sole approver.

2.6 Where expert judgement is elicited from a panel of experts (for example for qualitative rating modules or scenario weights), the composition of the panel, the elicitation method, the individual contributions and the aggregation of opinions shall be documented.

2.7 The EJ log shall be referenced in the model development document (MDD) and, for judgements in data treatment, in the reference data set (RDS) documentation as required by MRM-STD-021. A copy of the EJ log shall be provided to Model Validation at each validation.

2.8 Each expert judgement shall be reviewed at least at each annual model review under MRM-STD-040 and whenever new data becomes available that could replace it. Judgements that are no longer supported shall be withdrawn and the withdrawal recorded in the EJ log.

## 3 Types of expert judgement

3.1 **Expert judgement in data treatment.** This includes: approximation of default flags or default dates where the default definition was not applied historically; correction of data without source evidence; exclusion of records or periods on grounds other than documented DQ rules; selection of the observation period; treatment of missing values and outliers where designated as expert judgement in MRM-STD-022; and mapping of external or pooled data to internal definitions.

3.2 Expert judgement in data treatment that addresses a data deficiency shall be cross-referenced to the data deficiency log required by MRM-STD-022, and, for IRB models, to the assessment of the related margin of conservatism under CRM-STD-101.

3.3 **Expert judgement in model design.** This includes: segmentation choices; the selection or forced inclusion or exclusion of risk drivers against statistical evidence; qualitative modules and their weights; functional form and transformation choices not determined by data; choice of the calibration target, central tendency or downturn period; and the choice of benchmarks. Such judgements shall be justified in the MDD in accordance with MRM-STD-020.

3.4 **Overrides.** Overrides of model outputs for individual cases shall be permitted only within an override policy documented for the model, specifying the permitted reasons, the maximum permitted change (for example the number of rating notches), the evidence required and the authority levels. Each override shall record the reason code, the evidence and the approver.

3.5 **Overlays.** Overlays shall only be applied to address a specific, identified limitation of the model, shall be quantified by a documented method, and shall be accompanied by a plan to remove the limitation (for example by recalibration or redevelopment) with a target date. Overlays are temporary: an overlay that remains in place for more than 24 months shall trigger a model change assessment under MRM-STD-050.

## 4 Materiality of expert judgement

4.1 Each instance of expert judgement shall be classified as low, medium or high materiality on the basis of its impact on the relevant model output, assessed against the output without the judgement or against the best statistical alternative.

4.2 Unless model-specific thresholds are approved by Model Risk Management, an expert judgement is high materiality if it changes the model output at portfolio level by more than 5% (for example average PD, LGD, EAD, RWA or ECL) or changes the rating grade of more than 10% of exposures; medium if the change exceeds 1% or 2% of exposures respectively; and low otherwise.

4.3 The aggregate effect of all expert judgements in a model shall be quantified and reported in the MDD. If the aggregate effect exceeds the high materiality threshold, the aggregate shall be approved by the Model Risk Committee even if each individual judgement is below it.

4.4 Where materiality cannot be quantified, the judgement shall be classified as at least medium materiality, and as high for Tier 1 models.

## 5 Challenge of expert judgement

5.1 Every expert judgement of medium or high materiality shall be subject to documented challenge by a person independent of its proposer before approval. The challenge, the proposer's response and the resolution shall be recorded in the EJ log.

5.2 Challenge shall address whether the judgement is necessary, whether the evidence supports it, whether the direction and size of the effect are plausible, and whether a data-driven alternative exists.

5.3 Model Validation shall assess, at each validation, the completeness of the EJ log, the adequacy of rationale and approval, and the aggregate effect of expert judgement on model performance. Undocumented expert judgement identified during validation shall be raised as a finding under MV-STD-002.

5.4 Where possible, the effect of expert judgement shall be tested through sensitivity analysis showing the model output under reasonable alternative judgements.

## 6 Monitoring of overrides and overlays

6.1 Override rates, direction (upgrades and downgrades) and magnitude shall be monitored for every model with an override facility, at the frequency set in the monitoring plan under MRM-STD-040, by portfolio, by override reason and by approving unit.

6.2 Unless stricter model-specific thresholds are set, an override rate above 10% of assignments in a monitoring period is an amber signal and above 20% a red signal, which shall be escalated in accordance with MRM-STD-040.

6.3 The performance of overridden cases shall be analysed against non-overridden cases, including realised default rates by original and final grade, to assess whether overrides improve risk differentiation. Persistent one-directional overrides shall be analysed as an indication of model weakness.

6.4 Overlays shall be monitored against their stated purpose, and their continued need shall be reassessed at least quarterly for Tier 1 models and semi-annually for other models.

## 7 Roles and responsibilities

7.1 **Model developers and Model Owners (1LoD):** identify and document expert judgement, maintain the EJ log, quantify materiality and obtain approval.

7.2 **Model users and credit officers:** apply overrides only within the approved override policy and record reason and evidence.

7.3 **Model Validation (2LoD):** challenge high-materiality judgement before approval and assess expert judgement at each validation.

7.4 **Model Risk Management (2LoD):** maintains this Standard, approves model-specific materiality thresholds and reports on overlays and override trends to the Model Risk Committee.

7.5 **Model Risk Committee:** approves high-materiality expert judgement.

## 8 Exceptions and dispensations

8.1 Deviations from this Standard require a dispensation approved by the Head of Model Risk Management in accordance with MRM-POL-001, with a maximum duration of twelve months. The approval requirements in 2.4 and 2.5 cannot be waived.

## 9 Related documents

- Regulation (EU) No 575/2013 (CRR), Articles 172(3), 174(e) and 179(1)
- EBA/GL/2017/16, Guidelines on PD estimation, LGD estimation and the treatment of defaulted exposures (human judgement; overrides; margin of conservatism)
- ECB guide to internal models, Credit risk (use of human judgement and overrides)
- MRM-POL-001 Model Risk Management Policy
- MRM-STD-020 Model Development Standard
- MRM-STD-021 Model Documentation Standard
- MRM-STD-022 Data Quality Standard for Models
- MRM-STD-040 Model Monitoring Standard
- MRM-STD-050 Model Change and Regulatory Notification Standard
- CRM-STD-101 Margin of Conservatism Standard
- MV-STD-002 Validation Findings and Rating Standard

## 10 Document history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2020-04 | First issue. |
| 1.2 | 2022-09 | Overlay provisions and materiality thresholds added. |
| 1.3 | 2024-02 | EJ log fields extended (alternatives considered, review date). |
| 1.4 | 2025-06 | Explicit coverage of expert judgement in data treatment and link to the data deficiency log and MoC. |
