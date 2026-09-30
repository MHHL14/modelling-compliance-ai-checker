# Data Quality Standard for Models

| | |
|---|---|
| **Reference** | MRM-STD-022 |
| **Version and date** | v2.2 (2025-09) |
| **Owner** | Chief Data Office / Model Risk Management |
| **Approval body** | Model Risk Committee |
| **Status** | Approved |
| **Classification** | Internal |

## 1 Purpose and scope

1.1 This Standard specifies how the quality of data used in models is defined, measured, assessed, treated and reported. It implements section 8 of the Data Management and Governance Policy (DATA-POL-001) for model data and supports the requirements of the Model Risk Management Policy (MRM-POL-001).

1.2 The Standard gives effect to the requirement in CRR Article 174(b) that institutions have a rigorous process for vetting data inputs into models, including an assessment of the accuracy, completeness and appropriateness of the data, to the data requirements of CRR Article 179 and EBA/GL/2017/16, and to BCBS 239 principles 3 (accuracy and integrity), 4 (completeness) and 5 (timeliness).

1.3 The Standard applies to all models in the Model Inventory (MRM-STD-010) and covers the reference data set (RDS) used for development and calibration, the data used for validation and monitoring, and the production input data of the model. The depth of assessment is proportionate to the model tier, as set out in section 5.

## 2 Definitions

Terms defined in DATA-POL-001 (critical data element, Data Owner, lineage, RDS) have the same meaning in this Standard. In addition:

**Data quality (DQ) rule:** a precisely specified, testable condition on one or more data elements (for example "maturity date ≥ origination date"), linked to one DQ dimension.

**DQ threshold:** the minimum acceptable result of a DQ rule, expressed as the share of records passing, with an amber (warning) and a red (breach) level.

**Data deficiency:** any identified shortcoming in the data used by a model, whether a DQ rule breach, a gap in history, a lack of representativeness, a definitional inconsistency or a known error in source data.

**Data deficiency log:** the register, maintained per model, of all data deficiencies, their impact and their treatment (section 7).

**Outlier:** a value that is implausible, or extreme relative to the distribution of the variable, such that it may distort estimation if left untreated.

## 3 Data quality dimensions

3.1 Data quality is assessed on completeness, accuracy, consistency and timeliness. These four dimensions are mandatory for every model data set and every critical data element (CDE) of a model.

3.2 **Completeness:** all records and all values that should be present are present. Completeness is measured at record level (all relevant obligors, facilities, default events and recoveries in the scope of the model are included) and at attribute level (the share of non-missing values per variable). Exclusions of records from the RDS count against completeness unless justified under section 5.

3.3 **Accuracy:** data values correctly reflect the real-world facts or the source record they represent. Accuracy is measured by reconciliation to source systems or to accounting data, by comparison with independent sources, and by sample-based checks against source documentation (for example credit files and collateral valuations).

3.4 **Consistency:** the same fact is represented identically across data sets, systems and time, and related data elements do not contradict each other. Consistency covers consistency between the RDS and production input data, between definitions over the observation period (including changes in default definition), and logical consistency between fields.

3.5 **Timeliness:** data is available when required and reflects the relevant reference date. Timeliness is measured as the lag between the reference date and availability, and as the currency of data items that are periodically refreshed (for example financial statements, collateral values and behavioural scores).

3.6 In addition to the mandatory dimensions, the following dimensions shall be assessed where relevant to the model: **validity** (values conform to format, type and permitted ranges), **uniqueness** (no unintended duplicate records) and **appropriateness** (the data is representative of and suitable for the model's range of application, as required by CRR Article 179(1) and EBA/GL/2017/16).

3.7 Every DQ rule defined under section 4 shall be assigned to exactly one dimension, so that DQ results can be aggregated and reported per dimension.

## 4 Data quality rules and thresholds for critical data elements

4.1 For every CDE of a model, at least one DQ rule shall be defined for each mandatory dimension that is applicable to the element. Where a dimension is not applicable, the reason shall be recorded.

4.2 DQ rules shall be defined jointly by the model developer and the Data Steward of the relevant data domain, documented in the RDS documentation required by MRM-STD-021 and, for recurring checks, implemented in the Group DQ monitoring tool.

4.3 Each DQ rule shall have an amber and a red threshold. Unless a stricter threshold is justified, the following defaults apply to CDEs:

| Dimension | Default amber threshold | Default red threshold |
|---|---|---|
| Completeness (attribute level) | < 98% non-missing | < 95% non-missing |
| Accuracy (reconciliation) | difference > 0.5% of amount | difference > 1% of amount |
| Consistency (logical rules) | < 99% of records passing | < 98% of records passing |
| Timeliness | data older than required refresh + 1 month | data older than required refresh + 3 months |

4.4 Thresholds for the target variable and its constituents (default flag, default date, realised loss, recovery cash flows, exposure at default) shall be at least as strict as the defaults in 4.3; for the default flag, accuracy shall be confirmed by reconciliation of default events to the default register maintained under CR-STD-110.

4.5 Deviations from the default thresholds shall be justified in the RDS documentation and approved by the Model Owner; less strict thresholds for Tier 1 models additionally require the approval of Model Risk Management.

## 5 Data quality assessment per model data set

5.1 A documented DQ assessment shall be performed on the RDS before model development starts, on every new RDS version used for recalibration, and on the data used for each periodic validation.

5.2 The DQ assessment shall report, per variable and per dimension, the result of each DQ rule against its thresholds, and shall include the number and share of records excluded from the RDS by reason of exclusion.

5.3 Every exclusion of records from the RDS shall be justified, quantified and assessed for its effect on the representativeness of the data. Exclusions exceeding 5% of records or of exposure in any segment shall be approved by the Model Owner and reported to Model Validation.

5.4 The DQ assessment shall include a reconciliation of the RDS to the source systems or to accounting data for key amounts (exposure, outstanding balance, losses) and for record counts per reference date.

5.5 The depth of the assessment shall be proportionate to the model tier. For Tier 1 models the assessment shall include sample-based verification of accuracy against source documentation; for Tier 2 and Tier 3 models reconciliation and automated rules are sufficient unless deficiencies indicate otherwise.

5.6 The DQ assessment shall conclude explicitly whether the data is fit for the intended use and shall be signed off by the model developer and the Model Owner before the RDS is frozen.

5.7 The DQ rules applied to the RDS shall also be applied to the production input data of the model, so that DQ in production can be compared with DQ at development.

## 6 Missing values and outliers

6.1 The approach to missing values shall be documented per variable, distinguishing between values that are missing at random, missing for a structural reason (for example "not applicable") and missing because of a data deficiency.

6.2 Imputation of missing values shall use a documented, reproducible method. The share of imputed values per variable shall be reported, and the effect of imputation on the estimated parameters shall be assessed. Where more than 10% of values of a model variable are imputed, the choice of method shall be treated as expert judgement under MRM-STD-023.

6.3 Outliers shall be identified using documented criteria (for example plausibility ranges, percentile rules or statistical distance measures) applied consistently between development and production.

6.4 Treatment of outliers (correction, capping, flooring, exclusion) shall be justified, applied consistently between development and production, and its impact on the model output quantified.

6.5 Missing values and outliers in the target variable (default flag, realised LGD, realised CCF) shall not be imputed; affected records shall be investigated and either corrected at source or excluded with justification under 5.3.

## 7 Treatment of data deficiencies and link to the margin of conservatism

7.1 Every model shall have a data deficiency log. All data deficiencies identified during development, validation, monitoring or by the Data Owner shall be recorded in the log, stating the affected variables and segments, the dimension concerned, the cause, the quantified or estimated impact and the treatment.

7.2 The treatment of each deficiency shall be one or more of: remediation at source; correction in the model data with documented evidence; exclusion of affected records; adjustment of the methodology; or recognition of the resulting uncertainty in the margin of conservatism (MoC).

7.3 For models used for own funds requirements (IRB), each data deficiency that is not fully remediated shall be assessed for inclusion in the MoC as a deficiency in data (category A) in accordance with the Margin of Conservatism Standard (CRM-STD-101), CRR Article 179(1)(f) and EBA/GL/2017/16. The log shall reference the MoC component to which each deficiency is mapped.

7.4 Corrections in model data that are not supported by documented evidence from the source are expert judgement and shall be documented and approved under MRM-STD-023.

7.5 Each deficiency shall have a remediation owner and target date. Deficiencies shall be removed from the log only when remediation is confirmed, and the corresponding MoC component shall then be reassessed.

## 8 Data quality reporting

8.1 The Model Owner shall report DQ results for the model's CDEs, including production input data, at least at the frequency of model monitoring defined in MRM-STD-040.

8.2 DQ reporting shall show results per dimension against thresholds, trends over time, open deficiencies from the data deficiency log and the status of remediation.

8.3 Red threshold breaches on a CDE of a Tier 1 model shall be escalated to Model Risk Management within ten business days and shall be included in the next report to the Model Risk Committee.

8.4 Model Risk Management shall report annually to the Model Risk Committee on DQ across the model portfolio, including the number and severity of open deficiencies and their aggregate effect on MoC.

## 9 Roles and responsibilities

9.1 **Model developers:** define DQ rules for model CDEs, perform the DQ assessment, treat missing values, outliers and deficiencies, and maintain the data deficiency log during development.

9.2 **Model Owners:** approve the DQ assessment and thresholds, own the data deficiency log after implementation and report DQ under section 8.

9.3 **Data Owners and Data Stewards:** implement DQ rules at source, remediate deficiencies at source and provide reconciliations.

9.4 **Model Validation:** independently reviews the DQ assessment, the data deficiency log and the treatment of deficiencies as part of validation under MV-STD-001.

9.5 **Model Risk Management:** maintains this Standard, approves deviations under 4.5 and reports under 8.4.

## 10 Exceptions and dispensations

10.1 Deviations from this Standard require a dispensation approved by the Head of Model Risk Management, following the process in MRM-POL-001. Dispensations for Tier 1 models are reported to the Model Risk Committee.

10.2 A dispensation shall identify compensating measures, including, where relevant, an additional MoC component, and shall not exceed twelve months.

## 11 Related documents

- Regulation (EU) No 575/2013 (CRR), Articles 174(b), 179(1) and 185
- EBA/GL/2017/16, Guidelines on PD estimation, LGD estimation and the treatment of defaulted exposures (data requirements; margin of conservatism)
- BCBS 239, principles 3, 4 and 5
- ECB guide to internal models, General topics (data maintenance)
- DATA-POL-001 Data Management and Governance Policy
- MRM-POL-001 Model Risk Management Policy
- MRM-STD-020 Model Development Standard
- MRM-STD-021 Model Documentation Standard (RDS template)
- MRM-STD-023 Expert Judgement Standard
- MRM-STD-040 Model Monitoring Standard
- CRM-STD-101 Margin of Conservatism Standard
- CR-STD-110 Definition of Default Standard
- MV-STD-001 Model Validation Standard

## 12 Document history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2019-02 | First issue. |
| 2.0 | 2021-10 | Alignment with EBA/GL/2017/16; data deficiency log and MoC link introduced. |
| 2.1 | 2023-07 | Default thresholds per dimension added (4.3). |
| 2.2 | 2025-09 | Production input data brought into scope (5.7); treatment of target-variable gaps clarified (6.5). |
