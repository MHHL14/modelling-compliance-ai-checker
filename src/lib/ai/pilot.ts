// Simulated AI results for the pilot (MDL-01, RDS documentation of PD-MORT-NL v4).
import { deriveConfidence, factors } from '../confidence';
import { PILOT, UPLOAD_EVIDENCE } from '../seed';
import type {
  AssessmentRow,
  Citation,
  ConfidenceFactors,
  DocSection,
  Mitigation,
  PackageDocument,
  Requirement,
  ScriptResult,
  Verdict,
} from '../types';

export const RDS_ID = PILOT.evidence_document.id;
export const RDS_TITLE = PILOT.evidence_document.title;

export function rdsSections(version: string): DocSection[] {
  return PILOT.evidence_document.versions[version] ?? [];
}

function row(
  requirementId: string,
  verdict: Verdict,
  citations: Citation[],
  cf: ConfidenceFactors,
  rationale: string,
  mitigation: Mitigation | null,
  script: ScriptResult | null = null,
): AssessmentRow {
  return { requirementId, verdict, citations, confidenceFactors: cf, confidence: deriveConfidence(cf), rationale, mitigation, script };
}

/** 1st line AI assessment from the seed. */
export function pilotRow1lod(reqId: string): AssessmentRow | null {
  const s = PILOT.assessment_1lod[reqId];
  if (!s) return null;
  return row(reqId, s.verdict, s.citations, s.confidence_factors, s.rationale, s.mitigation, s.script);
}

/** Re-assessment of a row after new evidence has been uploaded (spec 8.4). */
export function pilotReassess1lod(reqId: string, evidenceNames: string[]): AssessmentRow | null {
  if (reqId === 'REQ-D21' && evidenceNames.includes('MDD PD-MORT-NL v4.pdf')) {
    return row(
      reqId,
      'compliant',
      [
        { doc: 'EVD-01-MDD', version: '4.0', section: '7.2', quote: 'treated as a category A data deficiency. A MoC of +6% relative is applied to the long-run average default rate' },
        { doc: RDS_ID, version: '1.0', section: '6.2', quote: 'The default flag for 2012–2015 was approximated' },
      ],
      factors(
        { location: 'weak' },
        {
          location: 'Link to MoC category found in the MDD (§7.2), not in the RDS document itself.',
          verifiability: 'Documentation only — quantification of the +6% not re-performed in this run.',
        },
      ),
      'The deficiency identified in RDS §6.2 is linked to MoC category A with a quantified +6% relative add-on in MDD §7.2.',
      null,
    );
  }
  if (reqId === 'REQ-D09' && evidenceNames.includes('DoD implementation memo.pdf')) {
    return row(
      reqId,
      'compliant',
      [{ doc: 'EVD-01-DODMEMO', version: '1.0', section: '3', quote: 'remains in probation for 3 months (12 months for distressed restructurings)' }],
      factors(
        { location: 'weak' },
        {
          location: 'Probation logic found in the DoD implementation memo (§3), not in the RDS template section §3.3.',
          verifiability: 'Documentation only.',
        },
      ),
      'The DoD implementation memo describes the probation period applied after cure (3 months; 12 months for distressed restructurings), in line with EBA/GL/2016/07 section 7.',
      null,
    );
  }
  return null;
}

/** Rows that change when a given evidence file is uploaded. */
export const EVIDENCE_AFFECTS: Record<string, string[]> = {
  'MDD PD-MORT-NL v4.pdf': ['REQ-D21'],
  'DoD implementation memo.pdf': ['REQ-D09'],
};

// ---------------------------------------------------------------------------
// Scoping: applicability confidence and the not-applicable list
// ---------------------------------------------------------------------------
export const PILOT_APPLICABILITY_CONFIDENCE: Record<string, number> = {
  'REQ-D01': 0.96, 'REQ-D02': 0.9, 'REQ-D07': 0.97, 'REQ-D08': 0.93, 'REQ-D09': 0.88,
  'REQ-D12a': 0.95, 'REQ-D12b': 0.95, 'REQ-D12c': 0.9, 'REQ-D15': 0.86, 'REQ-D18': 0.92,
  'REQ-D19': 0.9, 'REQ-D21': 0.91, 'REQ-D22': 0.89, 'REQ-D25': 0.74, 'REQ-D26': 0.71,
  'REQ-D30': 0.87, 'REQ-D31': 0.69, 'REQ-G01': 0.78,
};

export interface NotApplicableReq extends Requirement {
  why_not: string;
}

export const PILOT_NOT_APPLICABLE: NotApplicableReq[] = [
  {
    id: 'REQ-L14', text: 'Downturn LGD is estimated per EBA/GL/2019/03.', source_doc: 'EXT-EBA-DLGD', article: 'EBA/GL/2019/03',
    category: 'methodology', check_type: 'ai', applicability_rationale: '', layer: 'shared',
    why_not: 'PD model: downturn LGD requirements apply to models tagged “irb_lgd” only.',
  },
  {
    id: 'REQ-L20', text: 'Recognition of collateral and guarantees (incl. NHG) follows EBA/GL/2020/05.', source_doc: 'EXT-EBA-CRM', article: 'EBA/GL/2020/05 section 4',
    category: 'methodology', check_type: 'ai', applicability_rationale: '', layer: 'shared',
    why_not: 'Credit risk mitigation is reflected in LGD, not in the PD model or its RDS.',
  },
  {
    id: 'REQ-E05', text: 'CCF estimates use a 12-month fixed-horizon approach.', source_doc: 'EXT-CRR-IRB', article: 'CRR Art. 182',
    category: 'methodology', check_type: 'ai', applicability_rationale: '', layer: 'shared',
    why_not: 'EAD/CCF requirement; the model estimates PD only.',
  },
  {
    id: 'REQ-A01', text: 'A risk management system is established for the high-risk AI system (AI Act Art. 9).', source_doc: 'EXT-AIACT', article: 'AI Act Art. 9',
    category: 'governance', check_type: 'ai', applicability_rationale: '', layer: 'shared',
    why_not: 'Statistical model with fixed logic — inventory AI Act assessment: likely outside the AI system definition. Reasoning to be documented, see model inventory.',
  },
  {
    id: 'REQ-I03', text: 'SICR thresholds are defined relative to the PD at origination.', source_doc: 'EXT-IFRS9', article: 'IFRS 9 §5.5.9',
    category: 'methodology', check_type: 'ai', applicability_rationale: '', layer: 'shared',
    why_not: 'IRB capital model; IFRS 9 staging is covered by MDL-09.',
  },
  {
    id: 'REQ-M02', text: 'The creditworthiness assessment considers income, expenses and other circumstances of the consumer.', source_doc: 'EXT-MCD', article: 'MCD Art. 18',
    category: 'methodology', check_type: 'ai', applicability_rationale: '', layer: 'shared',
    why_not: 'The model is not used in mortgage origination (see MDL-18 acceptance scorecard).',
  },
  {
    id: 'REQ-ML03', text: 'Explainability of machine-learning models is demonstrated at global and local level.', source_doc: 'INT-STD-ML', article: 'AI-STD-700 §4',
    category: 'methodology', check_type: 'ai', applicability_rationale: '', layer: 'shared',
    why_not: 'Logistic regression scorecard; the ML standard applies to the “ml” model family only.',
  },
];

// ---------------------------------------------------------------------------
// Uploads: requirement extraction
// ---------------------------------------------------------------------------
export function extractFromUpload(fileName: string, modelId: string): Requirement[] {
  const ex = PILOT.upload_examples.find((u) => u.name === fileName);
  if (ex?.extracted) {
    return ex.extracted.map((e) => ({
      id: e.id,
      text: e.text,
      source_doc: `UPLOAD:${fileName}`,
      article: fileName.replace(/\.(pdf|docx|txt|md)$/i, ''),
      category: e.text.toLowerCase().includes('represent') ? 'data' : 'governance',
      check_type: 'ai',
      applicability_rationale: `Extracted from uploaded ${fileName.toLowerCase().includes('ecb') ? 'supervisory decision' : 'document'}; applies to ${modelId} specifically.`,
      layer: 'model_specific',
      origin: 'upload',
    }));
  }
  // plausible generic extraction for unknown files
  const base = fileName.replace(/\.(pdf|docx|txt|md)$/i, '');
  const n = (base.length % 2) + 1;
  const templates = [
    `Obligation: the institution shall address the observations in “${base}” before the next model submission.`,
    `Limitation: model use is restricted to the portfolio scope described in “${base}” until the conditions are lifted.`,
  ];
  return templates.slice(0, n).map((t, i) => ({
    id: `MS-U${(base.length * 7 + i) % 90 + 10}`,
    text: t,
    source_doc: `UPLOAD:${fileName}`,
    article: base,
    category: 'governance',
    check_type: 'ai',
    applicability_rationale: `Extracted from uploaded document “${fileName}”.`,
    layer: 'model_specific',
    origin: 'upload',
  }));
}

/** Simulated text extraction for uploaded evidence files. */
export function evidenceDocFor(fileName: string, textContent?: string): PackageDocument & { title: string } {
  const known = UPLOAD_EVIDENCE[fileName];
  if (known) return { id: known.docId, version: known.version, title: known.title, sections: known.sections };
  const id = `UPL-${fileName.replace(/[^A-Za-z0-9]/g, '').slice(0, 16).toUpperCase()}`;
  if (textContent) {
    const paras = textContent.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).slice(0, 12);
    return {
      id, version: '1.0', title: fileName,
      sections: paras.map((p, i) => ({ section: String(i + 1), heading: p.split('\n')[0].slice(0, 60), text: p })),
    };
  }
  return {
    id, version: '1.0', title: fileName,
    sections: [{ section: '1', heading: 'Extracted text (simulated)', text: `Text extraction simulated for “${fileName}”. No passage relevant to the open requirements was identified.` }],
  };
}

// ---------------------------------------------------------------------------
// Draft check (Stage 2 sandbox)
// ---------------------------------------------------------------------------
export type DraftStatus = 'addressed' | 'partial' | 'gap' | 'not_in_draft';

export interface DraftResult {
  requirementId: string;
  status: DraftStatus;
  verdict: Verdict;
  citations: Citation[];
  confidenceFactors: ConfidenceFactors;
  confidence: ReturnType<typeof deriveConfidence>;
  rationale: string;
  mitigation: Mitigation | null;
  script: ScriptResult | null;
  gapLocation?: { section: string; quote?: string };
  aiDrafted?: boolean;
  checkType: string;
}

const GAP_LOCATION: Record<string, { section: string; quote?: string }> = {
  'REQ-D12b': { section: '4.2', quote: 'Loans with incomplete collateral information were excluded from the RDS.' },
  'REQ-D12c': { section: '4.2', quote: 'Representativeness impact: see §5.1.' },
};

const GAP_TEXT: Record<string, { rationale: string; mitigation: string }> = {
  'REQ-D12b': {
    rationale: 'Both exclusion categories are named, but neither is quantified in number of facilities, share of the population or number of defaults.',
    mitigation: 'Quantify each exclusion in §4.2: number of facilities, share of the population and number of defaults (source: exclusion log).',
  },
  'REQ-D12c': {
    rationale: 'The draft refers to §5.1 for the representativeness impact, but §5.1 only covers PSI on risk drivers; the impact of the exclusions themselves is not analysed.',
    mitigation: 'Add an analysis of the impact of the exclusions on representativeness: LTV distribution and default rate of excluded vs retained loans.',
  },
};

const stripMarks = (s: string) => s.replace(/\{\{|\}\}/g, '');

export function draftCheck(version: string, requirements: Requirement[], aiBlocks: Record<string, string[]> = {}): DraftResult[] {
  const sections = rdsSections(version);
  const textOf = (sec: string) => {
    const base = sections.find((s) => s.section === sec)?.text ?? '';
    return base;
  };
  const aiTextOf = (sec: string) => (aiBlocks[sec] ?? []).map(stripMarks).join(' ');
  const allAi = Object.values(aiBlocks).flat().map(stripMarks).join(' ');

  return requirements.map((req) => {
    const seed = PILOT.assessment_1lod[req.id];
    const checkType = req.check_type;
    if (!seed) {
      const cf = factors({ match: 'bad', coverage: 'bad', location: 'bad' }, { match: 'No passage found in the draft.' });
      return {
        requirementId: req.id, status: 'not_in_draft', verdict: 'not_found', citations: [], confidenceFactors: cf,
        confidence: deriveConfidence(cf), rationale: 'No passage in the draft addresses this requirement.',
        mitigation: { type: 'verification', text: 'Confirm where this requirement is evidenced (possibly the MDD) or add a paragraph to the RDS document.' },
        script: null, checkType,
      };
    }
    const citations = seed.citations.map((c) => ({ ...c, version }));
    const missing = citations.filter((c) => !textOf(c.section).includes(c.quote));
    const coveredByAi = missing.length > 0 && missing.every((c) => aiTextOf(c.section).includes(c.quote) || allAi.includes(c.quote));

    if (missing.length > 0 && !coveredByAi) {
      const gt = GAP_TEXT[req.id];
      const loc = GAP_LOCATION[req.id] ?? { section: missing[0].section };
      const cf = factors(
        { match: 'bad', coverage: 'bad', location: 'weak' },
        { match: 'Expected passage not found in this draft.', coverage: gt ? gt.rationale : 'Required elements not yet written.' },
      );
      return {
        requirementId: req.id, status: 'gap', verdict: 'non_compliant',
        citations: citations.filter((c) => !missing.includes(c)),
        confidenceFactors: cf, confidence: deriveConfidence(cf),
        rationale: gt?.rationale ?? 'The passage that would address this requirement is not yet in the draft.',
        mitigation: { type: 'remediation', text: gt?.mitigation ?? 'Add the missing passage to the draft.' },
        script: seed.script, gapLocation: loc, checkType,
      };
    }
    if (coveredByAi) {
      const cf = factors({}, { verifiability: 'AI-drafted text — confirm the figures against the exclusion log before relying on this outcome.' });
      return {
        requirementId: req.id, status: 'addressed', verdict: 'compliant',
        citations: citations.map((c) => ({ ...c, doc: RDS_ID })),
        confidenceFactors: cf, confidence: deriveConfidence(cf),
        rationale: `${seed.rationale} (evidence is AI-drafted text inserted in this draft)`,
        mitigation: null, script: seed.script, aiDrafted: true, checkType,
      };
    }
    const status: DraftStatus =
      seed.verdict === 'compliant' ? 'addressed' : seed.verdict === 'partial' ? 'partial' : seed.verdict === 'not_found' ? 'not_in_draft' : 'gap';
    return {
      requirementId: req.id, status, verdict: seed.verdict, citations,
      confidenceFactors: seed.confidence_factors, confidence: deriveConfidence(seed.confidence_factors),
      rationale: seed.rationale, mitigation: seed.mitigation, script: seed.script, checkType,
      gapLocation: status === 'not_in_draft' ? GAP_LOCATION[req.id] : undefined,
    };
  });
}

export interface GeneratedSection {
  requirementId: string;
  section: string;
  text: string; // numbers from script wrapped in {{ }}
  sources: string[];
}

export function generateSectionText(reqId: string, mitigationText?: string): GeneratedSection {
  if (reqId === 'REQ-D12b') {
    return {
      requirementId: reqId,
      section: '4.2',
      text: 'Loans with incomplete collateral information were excluded from the RDS ({{3,412 facilities, 0.4% of the population; 61 defaults}}). Facilities originated under the former brand portfolio were excluded ({{1,208 facilities, 0.15%; 9 defaults}}) because origination data is unavailable.',
      sources: ['exclusion_log_v7', 'dq_report_v3'],
    };
  }
  if (reqId === 'REQ-D12c') {
    return {
      requirementId: reqId,
      section: '4.2',
      text: 'Excluded loans show a comparable LTV distribution to retained loans (PSI {{0.03}}) and a {{comparable default rate (0.47% vs 0.45%)}}; the exclusions are therefore not expected to affect representativeness. The combined exclusions affect the long-run default rate by {{+0.01pp}}.',
      sources: ['exclusion_log_v7', 'rds_profile_2024Q4'],
    };
  }
  const seed = PILOT.assessment_1lod[reqId];
  const sec = seed?.citations[0]?.section ?? '1';
  return {
    requirementId: reqId,
    section: sec,
    text: `${mitigationText ? mitigationText.replace(/^Add /, 'This section adds ').replace(/\.$/, '') : 'This section documents the required analysis'}. Results are summarised in the table below and reproduced from the RDS profiling run ({{run 2027-06-10}}).`,
    sources: ['rds_profile_2024Q4', 'dq_report_v3'],
  };
}

// ---------------------------------------------------------------------------
// 2nd line blind assessment
// ---------------------------------------------------------------------------
function docHas(docs: PackageDocument[], docId: string, section: string, quote: string) {
  const d = docs.find((x) => x.id === docId);
  const s = d?.sections.find((x) => x.section === section);
  return !!s && s.text.includes(quote);
}

function cite(docs: PackageDocument[], docId: string, section: string, quote: string): Citation[] {
  const d = docs.find((x) => x.id === docId);
  return docHas(docs, docId, section, quote) && d ? [{ doc: docId, version: d.version, section, quote }] : [];
}

/** Passages the 2nd line retrieval finds in the frozen package documents (never 1st line conclusions). */
function retrieve2lod(reqId: string, docs: PackageDocument[]): Citation[] {
  const rdsVersion = docs.find((d) => d.id === RDS_ID)?.version ?? '1.0';
  const baseQuotes = PILOT.assessment_1lod[reqId]?.citations ?? [];
  const fromRds = baseQuotes.flatMap((c) => cite(docs, c.doc, c.section, c.quote)).map((c) => ({ ...c, version: rdsVersion }));
  switch (reqId) {
    case 'REQ-D21':
      return [...cite(docs, 'EVD-01-MDD', '7.2', 'A MoC of +6% relative is applied to the long-run average default rate'), ...fromRds];
    case 'REQ-D09':
      return cite(docs, 'EVD-01-DODMEMO', '3', 'remains in probation for 3 months (12 months for distressed restructurings)');
    case 'VAL-01':
      return cite(docs, RDS_ID, '8', 'A full rebuild reproduces the RDS row count and default count exactly');
    case 'VAL-02':
      return cite(docs, RDS_ID, '3.3', 'materiality threshold of EUR 100 absolute and 1% relative');
    case 'VAL-03': {
      const m = cite(docs, 'EVD-01-MDD', '7.2', 'A MoC of +6% relative is applied');
      return m.length ? m : cite(docs, RDS_ID, '6.2', 'The default flag for 2012–2015 was approximated');
    }
    case 'VAL-04':
      return cite(docs, RDS_ID, '5.1', 'PSI on loan-to-value bucket, loan age and interest-only share');
    default:
      return fromRds;
  }
}

const MIT_2LOD: Record<string, Mitigation> = {
  'REQ-D07': { type: 'remediation', text: 'Align the implemented default flag (rds_build.py L214) with the documented definition (EUR 100 / 1%), rebuild the RDS and quantify the impact on the calibration.' },
  'VAL-02': { type: 'remediation', text: 'Correct MAT_ABS in rds_build.py to EUR 100 and re-run the RDS build; report affected vintages.' },
  'REQ-D21': { type: 'compensating', text: 'Recalibrate MoC category A to the level supported by the sensitivity analysis (~+11%) until the deficiency is remediated.' },
  'VAL-03': { type: 'compensating', text: 'Apply the MoC level supported by the validation sensitivity analysis (~+11%) and document the sensitivity in the MDD.' },
  'VAL-04': { type: 'remediation', text: 'Add a default-rate level comparison per segment, RDS vs current portfolio 2022–2024 (MV-HB-003 §6).' },
  'REQ-D09': { type: 'remediation', text: 'Document the treatment of multiple defaults within 12 months (EBA/GL/2016/07 §7) in the DoD memo or RDS §3.' },
  'REQ-D15': { type: 'remediation', text: 'Compare default-rate levels per segment between the RDS and 2022–2024 (MV-HB-003 §6); Annex B covers LTV only.' },
};

export function pilotRow2lod(req: Requirement, docs: PackageDocument[]): AssessmentRow {
  const seed = PILOT.assessment_2lod_blind[req.id];
  let citations = retrieve2lod(req.id, docs);
  let verdict: Verdict = seed?.verdict ?? 'not_found';
  let rationale = seed?.rationale ?? 'No passage in the submitted documents addresses this requirement.';
  const script = seed?.script ?? null;

  if (!seed && req.layer === 'model_specific') {
    verdict = 'not_found';
    citations = [];
    rationale = 'The submitted RDS documentation does not address this model-specific obligation; evidence may sit in the MDD calibration chapter.';
  }
  if (citations.length === 0 && !script && verdict !== 'not_applicable') {
    if (verdict !== 'not_found') rationale = `No supporting passage in the submitted documents. ${rationale}`;
    verdict = 'not_found';
  }

  // Factor derivation for 2nd line rows without seeded factors (spec 8.9)
  let cf: ConfidenceFactors;
  if (verdict === 'compliant') {
    cf = factors(
      script?.result === 'pass' ? { verifiability: 'good' } : {},
      script?.result === 'pass' ? { verifiability: `Confirmed by script ${script.id}.` } : { verifiability: 'Documentation only.' },
    );
  } else if (verdict === 'partial') {
    cf = factors({ coverage: 'weak' }, { coverage: rationale });
  } else if (verdict === 'non_compliant' && script?.result === 'fail') {
    cf = factors({ consistency: 'bad', verifiability: 'good' }, { consistency: `Documentation contradicts the implementation: ${script.detail}.`, verifiability: `Script ${script.id} executed on the linked repository.` });
  } else if (verdict === 'non_compliant') {
    cf = factors({ consistency: 'bad' }, { consistency: rationale });
  } else {
    cf = factors({ match: 'bad', coverage: 'bad', location: 'bad' }, { match: 'No passage found in the frozen package documents.' });
  }

  let mitigation: Mitigation | null = MIT_2LOD[req.id] ?? null;
  const conf = deriveConfidence(cf);
  if (!mitigation && (verdict === 'partial' || verdict === 'non_compliant')) {
    mitigation = PILOT.assessment_1lod[req.id]?.mitigation ?? { type: 'remediation', text: 'Complete the missing elements identified in the rationale.' };
  }
  if (!mitigation && verdict === 'not_found') {
    mitigation = req.layer === 'model_specific'
      ? { type: 'verification', text: 'Request evidence that the obligation is implemented (e.g. MDD calibration chapter) before issuing the opinion.' }
      : { type: 'verification', text: 'Request the supporting evidence from the 1st line through a finding.' };
  }
  if (!mitigation && conf === 'low') mitigation = { type: 'verification', text: 'Obtain additional evidence to confirm the outcome.' };
  if (verdict === 'non_compliant' && !mitigation) mitigation = { type: 'remediation', text: 'Remediate the deficiency.' };
  return { requirementId: req.id, verdict, citations, confidenceFactors: cf, confidence: conf, rationale, mitigation, script };
}

/** Model-specific requirement assessment for the 1st line (e.g. MS-01 from the ECB decision). */
export function modelSpecificRow1lod(req: Requirement): AssessmentRow {
  const cf = factors({ match: 'bad', coverage: 'bad', location: 'bad' }, { match: 'No passage in the RDS document addresses this obligation.' });
  return {
    requirementId: req.id,
    verdict: 'not_found',
    citations: [],
    confidenceFactors: cf,
    confidence: deriveConfidence(cf),
    rationale: 'The RDS document does not address this model-specific obligation; evidence is expected outside the RDS (e.g. MDD calibration chapter or model use policy).',
    mitigation: { type: 'justification', text: 'Explain why this obligation is evidenced outside the RDS documentation component (reference the MDD section), or add a cross-reference.' },
    script: null,
  };
}
