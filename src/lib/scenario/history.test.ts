import { describe, expect, it } from 'vitest';
import { verifyPackage } from '../packages';
import { buildHistoricCase, historicPackage, HISTORY } from './history';

describe('history', () => {
  it('builds three use cases: two completed, one submitted', () => {
    expect(HISTORY.map((h) => [h.modelId, h.status])).toEqual([
      ['MDL-07', 'completed'],
      ['MDL-02', 'completed'],
      ['MDL-04', 'active'],
    ]);
  });
  it('produces identical, verifiable packages on every build', async () => {
    for (const spec of HISTORY) {
      const a = await historicPackage(spec);
      const b = await historicPackage(spec);
      expect(a.manifest.sha256).toBe(b.manifest.sha256);
      expect(a.manifest.packageId).toBe(spec.packageId);
      const v = await verifyPackage(JSON.stringify(a), 'submission');
      expect(v.ok).toBe(true);
    }
  });
  it('decides every row of a historic run', () => {
    const c = buildHistoricCase(HISTORY[0]);
    expect(c.run.rows.every((r) => r.decision)).toBe(true);
    expect(c.findings.every((f) => f.status === 'closed')).toBe(true);
  });
});
