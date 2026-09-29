import { describe, expect, it } from 'vitest';
import { deriveConfidence, factors } from './confidence';

describe('deriveConfidence', () => {
  it('is high when only verifiability is weak', () => {
    expect(deriveConfidence(factors({}))).toBe('high');
  });
  it('is medium with exactly one other weak factor', () => {
    expect(deriveConfidence(factors({ location: 'weak' }))).toBe('medium');
  });
  it('is low with any bad factor or two weak factors', () => {
    expect(deriveConfidence(factors({ verifiability: 'bad' }))).toBe('low');
    expect(deriveConfidence(factors({ match: 'weak', coverage: 'weak' }))).toBe('low');
  });
});
