import { beforeEach, describe, expect, it } from 'vitest';
import { verifyPackage } from '@/lib/packages';
import { getModel } from '@/lib/seed';
import { setRequirements, use1lod } from './store1lod';

const attrs = (id: string) => {
  const m = getModel(id)!;
  return { portfolio: m.portfolio, purpose: m.purpose, methodology: m.methodology, model_family: m.model_family, regulatory_use: m.regulatory_use, tier: m.tier, tags: m.tags };
};

describe('store1lod', () => {
  beforeEach(() => use1lod.setState(use1lod.getInitialState(), true));

  it('seeds two completed use cases and one submitted use case, without the pilot', async () => {
    await use1lod.getState().ensureSeed();
    const cases = Object.values(use1lod.getState().cases);
    expect(cases.map((c) => [c.modelId, c.status, !!c.submission])).toEqual([
      ['MDL-07', 'completed', true],
      ['MDL-02', 'completed', true],
      ['MDL-04', 'active', true],
    ]);
    expect(cases.some((c) => c.modelId === 'MDL-01')).toBe(false);
  });

  it('creates a use case with nothing pre-filled', () => {
    const id = use1lod.getState().createCase({ modelId: 'MDL-01', cycle: 'Initial validation 2027', component: 'rds', attributes: attrs('MDL-01') });
    const c = use1lod.getState().cases[id];
    expect(c.generatedAt).toBeUndefined();
    expect(Object.keys(c.reqStatus)).toHaveLength(0);
    expect(c.run).toBeUndefined();
    expect(c.draftCheck).toBeUndefined();
  });

  it('refuses a second active use case for the same model', () => {
    const s = use1lod.getState();
    const a = s.createCase({ modelId: 'MDL-15', cycle: 'Annual review 2027', component: 'full', attributes: attrs('MDL-15') });
    const b = s.createCase({ modelId: 'MDL-15', cycle: 'Other 2027', component: 'full', attributes: attrs('MDL-15') });
    expect(b).toBe(a);
  });

  it('only locks when every requirement has a decision', () => {
    const s = use1lod.getState();
    const id = s.createCase({ modelId: 'MDL-15', cycle: 'Annual review 2027', component: 'full', attributes: attrs('MDL-15') });
    s.generate(id);
    expect(s.lock(id)).toBe(false);
    const ids = Object.keys(use1lod.getState().cases[id].reqStatus);
    s.setReqStatus(id, ids, 'accepted');
    expect(s.lock(id)).toBe(true);
    expect(setRequirements(use1lod.getState().cases[id])).toHaveLength(ids.length);
  });

  it('runs an assessment with no decisions and fast-forwards all rows', () => {
    const s = use1lod.getState();
    const id = s.createCase({ modelId: 'MDL-20', cycle: 'Initial validation 2027', component: 'full', attributes: attrs('MDL-20') });
    s.generate(id);
    s.setReqStatus(id, Object.keys(use1lod.getState().cases[id].reqStatus), 'accepted');
    s.lock(id);
    s.runAssessment(id);
    expect(use1lod.getState().cases[id].run!.rows.every((r) => !r.decision)).toBe(true);
    s.fastForward(id);
    expect(use1lod.getState().cases[id].run!.rows.every((r) => r.decision)).toBe(true);
  });

  it('builds a verifiable submission package for any model', async () => {
    const s = use1lod.getState();
    const id = s.createCase({ modelId: 'MDL-07', cycle: 'Annual review 2027', component: 'full', attributes: attrs('MDL-07') });
    s.generate(id);
    s.setReqStatus(id, Object.keys(use1lod.getState().cases[id].reqStatus), 'accepted');
    s.lock(id);
    s.runAssessment(id);
    s.fastForward(id);
    const pkg = await s.buildSubmission(id);
    expect((await verifyPackage(JSON.stringify(pkg), 'submission')).ok).toBe(true);
    expect(pkg.requirementSet.componentKey).toBe('full');
  });
});
