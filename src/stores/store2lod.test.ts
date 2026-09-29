import { beforeEach, describe, expect, it } from 'vitest';
import { historicPackage, HISTORY } from '@/lib/scenario/history';
import { use2lod } from './store2lod';

describe('store2lod', () => {
  beforeEach(() => use2lod.setState(use2lod.getInitialState(), true));

  it('seeds two completed reviews and MDL-04 in review, not revealed, all rows decided', async () => {
    await use2lod.getState().ensureSeed();
    const r = use2lod.getState().reviews;
    expect(Object.keys(r).sort()).toEqual(['SUB-MDL-02-20260612', 'SUB-MDL-04-20270422', 'SUB-MDL-07-20260930']);
    const mdl04 = r['SUB-MDL-04-20270422'];
    expect(mdl04.revealedAt).toBeUndefined();
    expect(mdl04.run!.rows.every((x) => x.decision)).toBe(true);
    expect(r['SUB-MDL-07-20260930'].status).toBe('opinion_issued');
  });

  it('runs a blind assessment for any model with a failing script check', async () => {
    const pkg = await historicPackage(HISTORY[0]);
    const s = use2lod.getState();
    const id = s.importSubmission({ ...pkg }, pkg.manifest.sha256).snapshotId;
    s.runBlind(id);
    const rows = use2lod.getState().reviews[id].run!.rows;
    expect(rows.every((x) => !x.decision)).toBe(true);
    expect(rows.some((x) => x.script?.result === 'fail')).toBe(true);
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
