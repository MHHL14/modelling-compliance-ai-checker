import type { Confidence, ConfidenceFactorKey, ConfidenceFactors, FactorLevel } from './types';

export const FACTOR_KEYS: ConfidenceFactorKey[] = ['match', 'coverage', 'location', 'consistency', 'verifiability'];

export const FACTOR_LABEL: Record<ConfidenceFactorKey, string> = {
  match: 'Evidence match',
  coverage: 'Coverage',
  location: 'Location',
  consistency: 'Consistency',
  verifiability: 'Verifiability',
};

export const FACTOR_DESCRIPTION: Record<ConfidenceFactorKey, Record<FactorLevel, string>> = {
  match: { good: 'Exact quote found', weak: 'Paraphrase / indirect evidence', bad: 'No passage found' },
  coverage: { good: 'All sub-elements addressed', weak: 'Some sub-elements missing', bad: 'Most sub-elements missing' },
  location: { good: 'Expected template section', weak: 'Elsewhere in the document', bad: 'Not located' },
  consistency: { good: 'No conflicting passages', weak: 'Minor tension', bad: 'Contradiction (doc vs doc, or doc vs code)' },
  verifiability: { good: 'Confirmed by script / data', weak: 'Documentation only', bad: 'Cannot be verified with linked sources' },
};

/**
 * Section 9.2 — deterministic:
 * High if all factors good, or only verifiability weak.
 * Medium if exactly one other factor weak.
 * Low if any factor bad or two or more (non-verifiability) factors weak.
 */
export function deriveConfidence(f: ConfidenceFactors): Confidence {
  const levels = f.levels;
  if (FACTOR_KEYS.some((k) => levels[k] === 'bad')) return 'low';
  const otherWeak = FACTOR_KEYS.filter((k) => k !== 'verifiability' && levels[k] === 'weak').length;
  if (otherWeak === 0) return 'high';
  if (otherWeak === 1) return 'medium';
  return 'low';
}

export function factors(
  levels: Partial<Record<ConfidenceFactorKey, FactorLevel>>,
  notes: Partial<Record<ConfidenceFactorKey, string>> = {},
): ConfidenceFactors {
  return {
    levels: { match: 'good', coverage: 'good', location: 'good', consistency: 'good', verifiability: 'weak', ...levels },
    notes,
  };
}

export const CONFIDENCE_RANK: Record<Confidence, number> = { low: 0, medium: 1, high: 2 };
