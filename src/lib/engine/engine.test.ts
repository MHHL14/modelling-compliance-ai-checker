import { beforeAll, describe, expect, it } from 'vitest';
import { getModelDocs, libraryReqs, libReq, loadContent } from '@/lib/content';
import { getModel, MODELS, PILOT, PILOT_MODEL_ID } from '@/lib/seed';
import { assess1lod, assess2lod, docsOf, draftVersionOf, finalVersionOf, resolveSelection, runDraftCheck, sectionText, type DocSel } from './assess';
import { allFinalSelection, typicalSources } from './history';
import { deriveRequirements, MANDATORY_SOURCES } from './sources';

beforeAll(async () => {
  await loadContent(MODELS.map((m) => m.id));
});

const pilot = () => getModel(PILOT_MODEL_ID)!;

describe('requirement library', () => {
  it('holds the full library with every pilot requirement', () => {
    expect(libraryReqs().length).toBeGreaterThan(2000);
    for (const r of PILOT.requirements) expect(libReq(r.id)?.text).toBe(r.text);
  });

  it('has unique requirement IDs', () => {
    const ids = libraryReqs().map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('deriveRequirements', () => {
  it('derives only from the selected sources', () => {
    const { applicable } = deriveRequirements({ model: pilot(), tags: pilot().tags, component: 'rds', sources: MANDATORY_SOURCES, libraryVersion: '3.2' });
    expect(applicable.length).toBeGreaterThan(50);
    expect(applicable.every((r) => MANDATORY_SOURCES.includes(r.docId))).toBe(true);
  });

  it('filters on the component under review', () => {
    const d = (component: 'rds' | 'mdd' | 'full') => deriveRequirements({ model: pilot(), tags: pilot().tags, component, sources: typicalSources(PILOT_MODEL_ID), libraryVersion: '3.2' }).applicable;
    expect(d('rds').every((r) => r.components.includes('rds'))).toBe(true);
    expect(d('mdd').every((r) => r.components.includes('mdd'))).toBe(true);
    expect(d('full').length).toBeGreaterThanOrEqual(Math.max(d('rds').length, d('mdd').length));
  });

  it('keeps library v3.3 requirements out of a v3.2 set', () => {
    const { applicable } = deriveRequirements({ model: pilot(), tags: pilot().tags, component: 'full', sources: typicalSources(PILOT_MODEL_ID), libraryVersion: '3.2' });
    expect(applicable.some((r) => r.id === 'REQ-D55')).toBe(false);
  });

  it('shows institution-level obligations as not applicable, with the reason', () => {
    const { applicable, notApplicable } = deriveRequirements({ model: pilot(), tags: pilot().tags, component: 'full', sources: typicalSources(PILOT_MODEL_ID), libraryVersion: '3.2' });
    expect(applicable.some((r) => r.level === 'institution')).toBe(false);
    for (const r of notApplicable.filter((x) => x.level === 'institution')) expect(r.why_not).toMatch(/^Institution-level obligation/);
  });

  it('never includes validation-standard requirements in the 1st line set', () => {
    const { applicable } = deriveRequirements({ model: pilot(), tags: pilot().tags, component: 'full', sources: typicalSources(PILOT_MODEL_ID), libraryVersion: '3.2' });
    expect(applicable.some((r) => r.layer === '2lod')).toBe(false);
  });
});

describe('pilot assessment', () => {
  const rds = (version: string): DocSel[] => [{ modelId: PILOT_MODEL_ID, docId: 'EVD-01-RDS', version }];

  it('reproduces the seeded 1st line outcome on the final RDS', () => {
    const ctx = { modelId: PILOT_MODEL_ID, docs: resolveSelection(rds('1.0')) };
    for (const [id, a] of Object.entries(PILOT.assessment_1lod)) {
      const req = libReq(id);
      if (!req) continue;
      expect(assess1lod(ctx, req).verdict, id).toBe(a.verdict);
    }
  });

  it('finds the two drafting gaps in RDS v0.7 and resolves them with inserted text', () => {
    const ctx = { modelId: PILOT_MODEL_ID, docs: resolveSelection(rds('0.7')) };
    const reqs = ['REQ-D12b', 'REQ-D12c'].map((id) => libReq(id)!);
    expect(runDraftCheck(ctx, reqs, {}).map((r) => r.status)).toEqual(['gap', 'gap']);
    const blocks: Record<string, string[]> = {};
    for (const id of ['REQ-D12b', 'REQ-D12c']) {
      const g = sectionText(ctx, id);
      blocks[`${g.docId}#${g.section}`] = [...(blocks[`${g.docId}#${g.section}`] ?? []), g.text];
    }
    const after = runDraftCheck(ctx, reqs, blocks);
    expect(after.every((r) => r.status === 'addressed' && r.aiDrafted)).toBe(true);
  });

  it('flags the materiality threshold in the code for the 2nd line', () => {
    const docs = resolveSelection(rds('1.0')).map((d) => ({ id: d.id, version: d.version, title: d.title, sections: d.sections }));
    const row = assess2lod(PILOT_MODEL_ID, libReq('REQ-D07')!, docs);
    expect(row.script?.result).toBe('fail');
  });
});

describe('model documentation library', () => {
  const withDocs = () => MODELS.filter((m) => getModelDocs(m.id));

  it('documents have a final version and draft main documents', () => {
    for (const m of withDocs()) {
      const md = docsOf(m.id)!;
      expect(md.documents.length, m.id).toBeGreaterThanOrEqual(3);
      for (const d of md.documents) expect(finalVersionOf(d).status, `${m.id} ${d.id}`).toBe('final');
      expect(md.documents.some((d) => draftVersionOf(d).status === 'draft'), m.id).toBe(true);
    }
  });

  it('evidence quotes appear verbatim and reference existing requirements', () => {
    for (const m of withDocs())
      for (const d of docsOf(m.id)!.documents)
        for (const v of d.versions)
          for (const s of v.sections)
            for (const e of s.evidence ?? []) {
              expect(libReq(e.req), `${m.id} ${d.id} §${s.section} ${e.req}`).toBeDefined();
              expect(s.text.includes(e.quote), `${m.id} ${d.id} v${v.version} §${s.section} ${e.req}`).toBe(true);
            }
  });

  it('a self-assessment on all final documents evidences most of the typical requirement set', () => {
    for (const m of withDocs()) {
      const { applicable } = deriveRequirements({ model: m, tags: m.tags, component: 'full', sources: typicalSources(m.id), libraryVersion: '3.2' });
      const ctx = { modelId: m.id, docs: resolveSelection(allFinalSelection(m.id)) };
      const found = applicable.filter((r) => assess1lod(ctx, r).verdict !== 'not_found').length;
      expect(found / applicable.length, m.id).toBeGreaterThan(0.6);
    }
  });

  it('a failing code fact is compliant with low confidence for the 1st line and a script failure for the 2nd line', () => {
    for (const m of withDocs()) {
      const md = docsOf(m.id)!;
      const fact = md.codeFacts.find((c) => c.result === 'fail');
      if (!fact) continue;
      const req = libReq(fact.reqs.find((r) => libReq(r) && libReq(r)!.layer !== '2lod')!);
      if (!req) continue;
      const sel = allFinalSelection(m.id);
      const row1 = assess1lod({ modelId: m.id, docs: resolveSelection(sel) }, req);
      const pkgDocs = resolveSelection(sel).map((d) => ({ id: d.id, version: d.version, title: d.title, sections: d.sections }));
      const row2 = assess2lod(m.id, req, pkgDocs);
      expect(row2.script?.result, `${m.id} ${fact.id}`).toBe('fail');
      if (m.id !== PILOT_MODEL_ID) expect(row1.verdict === 'non_compliant', `${m.id} ${fact.id} 1st line`).toBe(false);
    }
  });
});
