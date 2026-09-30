import type { Citation, Confidence, ConfidenceFactors, Mitigation, ScriptResult, Verdict } from '../types';

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
  gapLocation?: { section: string; quote?: string; doc?: string };
  aiDrafted?: boolean;
  checkType: string;
}

export interface GeneratedSection {
  requirementId: string;
  docId?: string;
  section: string;
  text: string;
  sources: string[];
}
