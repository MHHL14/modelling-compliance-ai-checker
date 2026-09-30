import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadContent } from '@/lib/content';
import { historicPackage, HISTORY, typicalSources } from '@/lib/engine/history';
import { MANDATORY_SOURCES } from '@/lib/engine/sources';
import { verifyPackage } from '@/lib/packages';
import { MODELS } from '@/lib/seed';
import { attributesFromModel, defaultSelection, setRequirements, use1lod } from './store1lod';
import { use2lod } from './store2lod';
import { getModel } from '@/lib/seed';

beforeAll(async () => {
  await loadContent(MODELS.map((m) => m.id));
});

const create = (modelId: string, cycle = 'Annual review 2027', sources = typicalSources(modelId)) =>
  use1lod.getState().createCase({ modelId, cycle, component: 'full', attributes: attributesFromModel(getModel(modelId)!), sources });

function lockAll(id: string) {
  const s = use1lod.getState();
  s.generate(id);
  s.setReqStatus(id, Object.keys(use1lod.getState().cases[id].reqStatus), 'accepted');
  return s.lock(id);
}

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
  });

  it('creates a use case with the mandatory base and nothing derived yet', () => {
    const id = create('MDL-01', 'Initial validation 2027', []);
    const c = use1lod.getState().cases[id];
    expect(c.sources).toEqual(expect.arrayContaining(MANDATORY_SOURCES));
    expect(c.generatedAt).toBeUndefined();
    expect(Object.keys(c.reqStatus)).toHaveLength(0);
    expect(c.run).toBeUndefined();
  });

  it('only locks when every derived requirement has a decision', () => {
    const s = use1lod.getState();
    const id = create('MDL-15');
    s.generate(id);
    expect(s.lock(id)).toBe(false);
    const ids = Object.keys(use1lod.getState().cases[id].reqStatus);
    s.setReqStatus(id, ids, 'accepted');
    expect(s.lock(id)).toBe(true);
    expect(setRequirements(use1lod.getState().cases[id])).toHaveLength(ids.length);
  });

  it('assesses against exactly the confirmed documentation and builds a verifiable package', async () => {
    const s = use1lod.getState();
    const id = create('MDL-07');
    expect(lockAll(id)).toBe(true);
    s.setSubmissionSelection(id, defaultSelection('MDL-07', 'final'));
    s.confirmSelection(id);
    s.runAssessment(id);
    const c = use1lod.getState().cases[id];
    expect(Object.keys(c.run!.documentVersions).sort()).toEqual(defaultSelection('MDL-07', 'final').map((d) => d.docId).sort());
    expect(c.run!.rows.every((r) => !r.decision)).toBe(true);
    s.fastForward(id);
    const pkg = await s.buildSubmission(id);
    expect((await verifyPackage(JSON.stringify(pkg), 'submission')).ok).toBe(true);
    expect(pkg.documents.map((d) => d.id).sort()).toEqual(Object.keys(c.run!.documentVersions).sort());
  });

  it('assesses nothing as evidenced when no documentation is selected', () => {
    const s = use1lod.getState();
    const id = create('MDL-20');
    lockAll(id);
    s.setSubmissionSelection(id, []);
    s.runAssessment(id);
    expect(use1lod.getState().cases[id].run!.rows.every((r) => r.verdict === 'not_found' || r.verdict === 'not_applicable')).toBe(true);
  });
});

describe('store2lod', () => {
  beforeEach(() => use2lod.setState(use2lod.getInitialState(), true));

  it('seeds two completed reviews and MDL-04 in review, not revealed, all rows decided', async () => {
    await use2lod.getState().ensureSeed();
    const r = use2lod.getState().reviews;
    expect(Object.keys(r).sort()).toEqual(['SUB-MDL-02-20260612', 'SUB-MDL-04-20270422', 'SUB-MDL-07-20260930']);
    expect(r['SUB-MDL-04-20270422'].revealedAt).toBeUndefined();
    expect(r['SUB-MDL-04-20270422'].run!.rows.every((x) => x.decision)).toBe(true);
  });

  it('runs a blind assessment including the validation layer', async () => {
    const pkg = await historicPackage(HISTORY[0]);
    const s = use2lod.getState();
    const id = s.importSubmission(pkg, pkg.manifest.sha256).snapshotId;
    s.runBlind(id);
    const rev = use2lod.getState().reviews[id];
    expect(rev.run!.rows.every((x) => !x.decision)).toBe(true);
    expect(rev.run!.rows.length).toBe((pkg.requirements ?? []).length + rev.validationLayer.length);
  });

  it('refuses the reveal until every row has a validator decision', async () => {
    const pkg = await historicPackage(HISTORY[1]);
    const s = use2lod.getState();
    const id = s.importSubmission(pkg, pkg.manifest.sha256).snapshotId;
    s.runBlind(id);
    expect(s.reveal(id)).toBe(false);
    s.decide(id, use2lod.getState().reviews[id].run!.rows.map((r) => r.requirementId), { decision: 'accepted' });
    expect(s.reveal(id)).toBe(true);
  });
});
