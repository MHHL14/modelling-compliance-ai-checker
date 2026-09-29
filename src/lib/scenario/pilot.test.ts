import { describe, expect, it } from 'vitest';
import { PILOT } from '../seed';
import { buildPilotScenario } from './pilot';

describe('pilot scenario', () => {
  const sc = buildPilotScenario('MDL-01|rds');
  it('keeps the 18 shared requirements and 4 validation-layer requirements', () => {
    expect(sc.requirements.map((r) => r.id)).toEqual(PILOT.requirements.filter((r) => r.layer === 'shared').map((r) => r.id));
    expect(sc.validationLayer.map((r) => r.id)).toEqual(['VAL-01', 'VAL-02', 'VAL-03', 'VAL-04']);
  });
  it('keeps the demo moments', () => {
    expect(sc.rows1lod['REQ-D07'].confidence).toBe('low');
    expect(sc.rows1lod['REQ-D21'].verdict).toBe('not_found');
    expect(sc.draftGaps.map((g) => g.requirementId)).toEqual(['REQ-D12b', 'REQ-D12c']);
    expect(sc.plan2lod['VAL-02'].script?.result).toBe('fail');
    const mdd = sc.evidenceFiles.find((f) => f.name === 'MDD PD-MORT-NL v4.pdf')!;
    expect(mdd.resolves['REQ-D21'].verdict).toBe('compliant');
    expect(sc.document.draftVersion).toBe('0.7');
    expect(sc.findingTemplates['REQ-D07'].id).toBe('F-07');
  });
  it('combines initial and scripted decisions for the fast-forward', () => {
    expect(Object.keys(sc.scriptedDecisions)).toHaveLength(18);
  });
});
