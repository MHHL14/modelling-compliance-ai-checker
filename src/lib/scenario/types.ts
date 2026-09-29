import type {
  AssessmentRow, Citation, Confidence, ConfidenceFactors, DocSection, Mitigation,
  PackageDocument, Requirement, ScriptResult, SeedDecision, Verdict,
} from '../types';

export type Component = 'rds' | 'mdd' | 'full';

export interface NotApplicableReq extends Requirement {
  why_not: string;
}

export interface GeneratedSection {
  requirementId: string;
  section: string;
  /** numbers taken from a data source are wrapped in {{ }} */
  text: string;
  sources: string[];
}

export interface DraftGap {
  requirementId: string;
  section: string;
  /** exact sentence to mark red; undefined marks the whole section */
  quote?: string;
  rationale: string;
  mitigation: string;
  generated: GeneratedSection;
}

export interface ScenarioDocument extends PackageDocument {
  title: string;
}

export interface EvidenceFile {
  name: string;
  sizeKb: number;
  doc: ScenarioDocument;
  /** rows that become this outcome once the file is uploaded */
  resolves: Record<string, AssessmentRow>;
}

/** What the independent 2nd line AI concludes; citations are retrieved separately from the frozen package. */
export interface Plan2lod {
  verdict: Verdict;
  rationale: string;
  script: ScriptResult | null;
  mitigation: Mitigation | null;
}

export interface FindingTemplate {
  id?: string;
  requirementRefs: string[];
  severity: 'high' | 'medium' | 'low';
  title: string;
  observation: string;
  impact: string;
  challenge: string;
  deadline: string;
}

export interface Scenario {
  key: string;
  modelId: string;
  component: Component;
  pilot: boolean;
  requirements: Requirement[];
  notApplicable: NotApplicableReq[];
  applicabilityConfidence: Record<string, number>;
  document: { id: string; title: string; draftVersion: string; finalVersion: string; versions: Record<string, DocSection[]> };
  rows1lod: Record<string, AssessmentRow>;
  scriptedDecisions: Record<string, SeedDecision>;
  draftGaps: DraftGap[];
  evidenceFiles: EvidenceFile[];
  validationLayer: Requirement[];
  plan2lod: Record<string, Plan2lod>;
  /** passages the 2nd line retrieval can find, per requirement (filtered by what is in the package) */
  passages: Record<string, Citation[]>;
  findingTemplates: Record<string, FindingTemplate>;
}

export type DraftStatus = 'addressed' | 'partial' | 'gap' | 'not_in_draft';

export interface DraftResult {
  requirementId: string;
  status: DraftStatus;
  verdict: Verdict;
  citations: Citation[];
  confidenceFactors: ConfidenceFactors;
  confidence: Confidence;
  rationale: string;
  mitigation: Mitigation | null;
  script: ScriptResult | null;
  gapLocation?: { section: string; quote?: string };
  aiDrafted?: boolean;
  checkType: string;
}
