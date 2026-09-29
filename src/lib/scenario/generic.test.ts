import { describe, expect, it } from 'vitest';
import { MODELS } from '../seed';
import { buildGenericScenario } from './generic';
import type { Component } from './types';

const COMPONENTS: Component[] = ['rds', 'mdd', 'full'];
const cases = MODELS.flatMap((m) => COMPONENTS.map((c) => [m.id, c] as const));

describe.each(cases)('generic scenario %s / %s', (modelId, component) => {
  const model = MODELS.find((m) => m.id === modelId)!;
  const sc = buildGenericScenario(model, component, `${modelId}|${component}`);
  const final = sc.document.versions[sc.document.finalVersion];
  const draft = sc.document.versions[sc.document.draftVersion];
  const textOf = (secs: typeof final, s: string) => secs.find((x) => x.section === s)?.text ?? '';
  const rows = Object.values(sc.rows1lod);

  it('has enough requirements and an AI result for each', () => {
    expect(sc.requirements.length).toBeGreaterThanOrEqual(6);
    for (const r of sc.requirements) expect(sc.rows1lod[r.id]).toBeDefined();
  });

  it('cites passages that exist verbatim in the final document', () => {
    for (const row of rows) {
      if (row.verdict === 'not_found') continue;
      expect(row.citations.length).toBeGreaterThan(0);
      for (const c of row.citations) expect(textOf(final, c.section)).toContain(c.quote);
    }
  });

  it('guarantees a low-confidence compliant row, a resolvable not-found row and a partial row', () => {
    expect(rows.some((r) => r.verdict === 'compliant' && r.confidence === 'low' && r.mitigation?.type === 'verification')).toBe(true);
    const nf = rows.find((r) => r.verdict === 'not_found')!;
    expect(nf).toBeDefined();
    const file = sc.evidenceFiles.find((f) => f.resolves[nf.requirementId]);
    expect(file).toBeDefined();
    const resolved = file!.resolves[nf.requirementId];
    expect(resolved.verdict).toBe('compliant');
    expect(textOf(file!.doc.sections, resolved.citations[0].section)).toContain(resolved.citations[0].quote);
    expect(rows.some((r) => r.verdict === 'partial')).toBe(true);
  });

  it('has two draft gaps that are absent in the draft and present in the final version', () => {
    expect(sc.draftGaps).toHaveLength(2);
    for (const g of sc.draftGaps) {
      const q = sc.rows1lod[g.requirementId].citations[0].quote;
      expect(textOf(final, g.section)).toContain(q);
      expect(textOf(draft, g.section)).not.toContain(q);
      expect(g.generated.text.replace(/\{\{|\}\}/g, '')).toContain(q);
    }
  });

  it('plans a failing script check against the low-confidence row and a validation layer with pass and fail', () => {
    const low = rows.find((r) => r.verdict === 'compliant' && r.confidence === 'low')!;
    expect(sc.plan2lod[low.requirementId].script?.result).toBe('fail');
    const results = sc.validationLayer.map((v) => sc.plan2lod[v.id]?.script?.result);
    expect(results).toContain('pass');
    expect(results).toContain('fail');
    const diffs = sc.requirements.filter((r) => sc.plan2lod[r.id].verdict !== sc.rows1lod[r.id].verdict);
    expect(diffs.length).toBeGreaterThanOrEqual(2);
  });

  it('is deterministic', () => {
    expect(buildGenericScenario(model, component, 'x')).toEqual({ ...sc, key: 'x' });
  });
});
