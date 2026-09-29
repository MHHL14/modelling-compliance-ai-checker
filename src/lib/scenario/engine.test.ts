import { describe, expect, it } from 'vitest';
import { assess1lod, assess2lod, getScenario, runDraftCheck, scriptedDecision } from './engine';

describe('engine', () => {
  it('memoises scenarios per model, component and tags', () => {
    expect(getScenario('MDL-15', 'full')).toBe(getScenario('MDL-15', 'full'));
    expect(getScenario('MDL-01', 'rds').pilot).toBe(true);
    expect(getScenario('MDL-01', 'mdd').pilot).toBe(false);
  });

  it('runs the draft check with two drafting gaps that close in the final version', () => {
    for (const id of ['MDL-01', 'MDL-15', 'MDL-20', 'MDL-07']) {
      const sc = getScenario(id, id === 'MDL-01' ? 'rds' : 'full');
      const draft = runDraftCheck(sc, sc.document.draftVersion, sc.requirements, {});
      const final = runDraftCheck(sc, sc.document.finalVersion, sc.requirements, {});
      const draftGaps = draft.filter((r) => r.status === 'gap');
      const finalGaps = final.filter((r) => r.status === 'gap');
      expect(draftGaps.length - finalGaps.length).toBe(2);
      // what remains in the final version are genuine non-compliances, not drafting gaps
      for (const g of finalGaps) expect(sc.rows1lod[g.requirementId].verdict).toBe('non_compliant');
    }
  });

  it('treats AI-drafted inserted text as addressed but flagged', () => {
    const sc = getScenario('MDL-15', 'full');
    const g = sc.draftGaps[0];
    const res = runDraftCheck(sc, sc.document.draftVersion, sc.requirements, { [g.section]: [g.generated.text] });
    const r = res.find((x) => x.requirementId === g.requirementId)!;
    expect(r.status).toBe('addressed');
    expect(r.aiDrafted).toBe(true);
  });

  it('re-assesses a not-found row when the named evidence file is uploaded', () => {
    const sc = getScenario('MDL-20', 'full');
    const file = sc.evidenceFiles[0];
    const reqId = Object.keys(file.resolves)[0];
    const req = sc.requirements.find((r) => r.id === reqId)!;
    expect(assess1lod(sc, req, []).verdict).toBe('not_found');
    expect(assess1lod(sc, req, [file.name]).verdict).toBe('compliant');
  });

  it('builds 2nd line rows only from documents in the package', () => {
    const sc = getScenario('MDL-15', 'full');
    const docs = [{ id: sc.document.id, version: sc.document.finalVersion, sections: sc.document.versions[sc.document.finalVersion] }];
    const nfId = Object.keys(sc.evidenceFiles[0].resolves)[0];
    const nfReq = sc.requirements.find((r) => r.id === nfId)!;
    expect(assess2lod(sc, nfReq, docs).verdict).toBe('not_found');
    const withEvidence = [...docs, sc.evidenceFiles[0].doc];
    expect(assess2lod(sc, nfReq, withEvidence).verdict).toBe('compliant');
    const val02 = sc.validationLayer.find((v) => v.id === 'VAL-02')!;
    expect(assess2lod(sc, val02, docs).script?.result).toBe('fail');
  });

  it('turns a scripted edit into an accept when the AI already agrees', () => {
    const sc = getScenario('MDL-01', 'rds');
    const reassessed = sc.evidenceFiles.find((f) => f.name.startsWith('MDD'))!.resolves['REQ-D21'];
    expect(scriptedDecision(sc, reassessed).decision).toBe('accepted');
  });
});
