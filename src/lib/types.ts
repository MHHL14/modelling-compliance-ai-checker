// Data model — section 6 of the build spec.

export type Line = '1lod' | '2lod' | 'library' | 'audit';
export type Verdict = 'compliant' | 'partial' | 'non_compliant' | 'not_found' | 'not_applicable';
export type FactorLevel = 'good' | 'weak' | 'bad';
export type ConfidenceFactorKey = 'match' | 'coverage' | 'location' | 'consistency' | 'verifiability';
export type MitigationType = 'remediation' | 'verification' | 'compensating' | 'justification';
export type CheckType = 'ai' | 'script' | 'ai+script';
export type Confidence = 'high' | 'medium' | 'low';

export interface Model {
  id: string;
  name: string;
  risk_type: string;
  portfolio: string;
  purpose: string;
  methodology: string;
  model_family: 'statistical' | 'ml' | 'genai' | 'expert';
  regulatory_use: string;
  tier: 1 | 2 | 3;
  lifecycle_stage: string;
  ai_act_assessment: string;
  owner_1lod: string;
  validator_2lod: string;
  pilot: boolean;
  tags: string[];
  evidence_documents: { id: string; title: string; type: string }[];
}

export interface LibraryDocument {
  id: string;
  category: 'external' | 'internal';
  type: string;
  title: string;
  issuer: string;
  reference: string;
  version_date: string;
  binding_level: 'binding_law' | 'comply_or_explain' | 'supervisory_expectation' | 'internal_mandatory' | 'reference';
  applicability: { any: string[]; all: string[] };
  key_topics: string[];
  extraction_priority: 'high' | 'medium' | 'low';
  source_url?: string | null;
  notes?: string | null;
}

export interface Requirement {
  id: string;
  text: string;
  source_doc: string;
  article: string;
  category: 'data' | 'methodology' | 'governance' | 'documentation' | 'validation';
  check_type: CheckType;
  applicability_rationale: string;
  layer: 'shared' | '2lod' | 'model_specific';
  origin?: 'library' | 'upload';
  status?: 'approved' | 'candidate';
}

export interface Upload {
  id: string;
  name: string;
  size: number;
  kind: 'evidence' | 'requirement_source';
  extractedRequirements?: Requirement[];
  uploadedAt: string;
  mime?: string;
}

export interface RequirementSet {
  id: string;
  modelId: string;
  component: string;
  libraryVersion: string;
  requirementIds: string[];
  excluded: { id: string; reason: string }[];
  addedDocuments: { docId: string; reason: string }[];
  uploads: Upload[];
  lockedAt?: string;
  lockedBy?: string;
  /** model characteristics used for the set (prototype extension) */
  tags?: string[];
  componentKey?: 'rds' | 'mdd' | 'full';
}

export interface Citation {
  doc: string;
  version: string;
  section: string;
  quote: string;
}
export interface ConfidenceFactors {
  levels: Record<ConfidenceFactorKey, FactorLevel>;
  notes: Partial<Record<ConfidenceFactorKey, string>>;
}
export interface Mitigation {
  type: MitigationType;
  text: string;
}
export interface ScriptResult {
  id: string;
  result: 'pass' | 'fail' | 'not_run';
  detail: string;
}

export interface RowDecision {
  by: string;
  at: string;
  decision: 'accepted' | 'edited' | 'rejected';
  finalVerdict?: Verdict;
  reason?: string;
}

export interface AssessmentRow {
  requirementId: string;
  verdict: Verdict;
  citations: Citation[];
  confidenceFactors: ConfidenceFactors;
  confidence: Confidence; // derived, see 9.2
  rationale: string;
  mitigation: Mitigation | null;
  script?: ScriptResult | null;
  decision?: RowDecision;
  /** set when the row was re-assessed after new evidence (prototype extension) */
  reassessedAt?: string;
  /** text relied on was AI-drafted (no self-grading) */
  aiDraftedEvidence?: boolean;
}

export interface AssessmentRun {
  id: string;
  line: '1lod' | '2lod';
  modelId: string;
  requirementSetId: string;
  libraryVersion: string;
  documentVersions: Record<string, string>;
  startedAt: string;
  provider: 'simulated' | 'live';
  inputsSummary: string;
  rows: AssessmentRow[];
}

export interface PackageManifest {
  packageType: 'submission' | 'findings' | 'response';
  packageId: string;
  modelId: string;
  createdAt: string;
  createdBy: string;
  line: '1lod' | '2lod';
  libraryVersion: string;
  requirementSetId: string;
  documentVersions: Record<string, string>;
  schemaVersion: '1.0';
  sha256: string;
}

export interface DocSection {
  section: string;
  heading: string;
  text: string;
}
export interface PackageDocument {
  id: string;
  version: string;
  title?: string;
  sections: DocSection[];
}

export interface SubmissionPackage {
  manifest: PackageManifest;
  requirementSet: RequirementSet;
  /** full requirement texts of the locked set (so 2nd line does not depend on 1st line state) */
  requirements?: Requirement[];
  documents: PackageDocument[];
  matrix1lod: AssessmentRow[];
  statement: string;
}
export interface FindingsPackage {
  manifest: PackageManifest;
  findings: Finding[];
  opinionSummary?: string;
}
export interface ResponsePackage {
  manifest: PackageManifest;
  responses: { findingId: string; plan: string; evidence: Upload[] }[];
}
export type AnyPackage = SubmissionPackage | FindingsPackage | ResponsePackage;

export interface Finding {
  id: string;
  modelId: string;
  snapshotId: string;
  requirementRefs: string[];
  severity: 'high' | 'medium' | 'low';
  title: string;
  observation: string;
  impact: string;
  challenge: string;
  owner: string;
  deadline: string;
  status: 'draft' | 'issued' | 'response_submitted' | 'closed';
  response?: { plan: string; evidence: Upload[]; at: string };
  aiDrafted: boolean;
  /** prototype extensions */
  kind?: 'finding' | 'scoping_gap';
  evidenceQuotes?: string[];
  issuedAt?: string;
  closure?: { note: string; at: string; by: string };
}

export interface AuditEvent {
  id: string;
  at: string;
  line: Line;
  actor: string;
  modelId?: string;
  type: string;
  detail: string;
}

// ---- Seed-file shapes ----
export interface SeedAssessment {
  verdict: Verdict;
  citations: Citation[];
  confidence_factors: ConfidenceFactors;
  rationale: string;
  mitigation: Mitigation | null;
  script: ScriptResult | null;
}
export interface Seed2lod {
  verdict: Verdict;
  rationale: string;
  script: ScriptResult | null;
}
export interface SeedDecision {
  decision: 'accepted' | 'edited' | 'rejected';
  final_verdict?: Verdict;
  reason?: string;
}
export interface SeedFinding {
  id: string;
  requirement: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  observation: string;
  impact: string;
  challenge: string;
  owner: string;
  deadline: string;
}
export interface LibraryChange {
  from: string;
  to: string;
  trigger: string;
  changes: { id: string; type: 'modified' | 'new'; old?: string; new: string; source: string; impact_note: string }[];
  impact: [string, number][];
}
export interface UploadExample {
  name: string;
  kind: 'evidence' | 'requirement_source';
  extracted?: { id: string; text: string; scope: string }[];
}
export interface PilotSeed {
  requirements: Requirement[];
  evidence_document: { id: string; title: string; versions: Record<string, DocSection[]> };
  assessment_1lod: Record<string, SeedAssessment>;
  decisions_1lod_initial: Record<string, SeedDecision>;
  decisions_1lod_scripted: Record<string, SeedDecision>;
  assessment_2lod_blind: Record<string, Seed2lod>;
  draft_findings_2lod: SeedFinding[];
  library_change: LibraryChange;
  upload_examples: UploadExample[];
}

/** A document that can be opened in the document viewer. */
export interface ViewerDoc {
  id: string;
  title: string;
  version: string;
  sections: DocSection[];
  /** AI-drafted inserted blocks, keyed by section id */
  aiBlocks?: Record<string, string[]>;
}
