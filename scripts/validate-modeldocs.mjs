// Validates model documentation files. Usage: node scripts/validate-modeldocs.mjs [MODEL-ID ...]
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const models = JSON.parse(readFileSync('data/models.json', 'utf8'));
const docs = JSON.parse(readFileSync('data/documents.json', 'utf8'));
const reqs = new Map();
for (const f of readdirSync('data/library/requirements').filter((f) => f.endsWith('.json'))) {
  const j = JSON.parse(readFileSync(`data/library/requirements/${f}`, 'utf8'));
  for (const r of j.requirements) reqs.set(r.id, { ...r, docId: j.docId });
}
const docApplies = (m, d) => (d.applicability.any.length === 0 || d.applicability.any.some((t) => m.tags.includes(t))) && d.applicability.all.every((t) => m.tags.includes(t));
const reqApplies = (m, r) => {
  const a = r.applies_if ?? { any: [], all: [] };
  return ((a.any ?? []).length === 0 || a.any.some((t) => m.tags.includes(t))) && (a.all ?? []).every((t) => m.tags.includes(t));
};
const ids = process.argv.slice(2).length ? process.argv.slice(2) : models.map((m) => m.id);
let failed = false;
for (const id of ids) {
  const errors = [];
  const warns = [];
  const m = models.find((x) => x.id === id);
  const p = `data/modeldocs/${id}.json`;
  if (!m) { console.log(`${id}: unknown model`); failed = true; continue; }
  if (!existsSync(p)) { console.log(`${id}: file missing`); failed = true; continue; }
  let j;
  try { j = JSON.parse(readFileSync(p, 'utf8')); } catch (e) { console.log(`${id}: invalid JSON ${e.message}`); failed = true; continue; }
  if (j.modelId !== id) errors.push('modelId mismatch');
  const applicableDocIds = new Set(docs.filter((d) => docApplies(m, d)).map((d) => d.id));
  const applicable = [...reqs.values()].filter((r) => applicableDocIds.has(r.docId) && reqApplies(m, r) && (r.layer ?? 'shared') === 'shared');
  const docsList = j.documents ?? [];
  if (docsList.length < 4 || docsList.length > 6) errors.push(`expected 4–6 documents, found ${docsList.length}`);
  for (const ev of m.evidence_documents.filter((e) => e.type !== 'code')) if (!docsList.some((d) => d.id === ev.id)) errors.push(`evidence document ${ev.id} from models.json missing`);
  const covered = new Map();
  const comps = new Set();
  for (const d of docsList) {
    if (!/^EVD-\d{2}-[A-Z0-9-]+$/.test(d.id ?? '')) errors.push(`${d.id}: bad id`);
    for (const k of ['title', 'type', 'owner']) if (!d[k]) errors.push(`${d.id}: missing ${k}`);
    if (!Array.isArray(d.component) || !d.component.length || d.component.some((c) => !['rds', 'mdd'].includes(c))) errors.push(`${d.id}: component must be subset of [rds, mdd]`);
    (d.component ?? []).forEach((c) => comps.add(c));
    const vs = d.versions ?? [];
    if (!vs.some((v) => v.status === 'final')) errors.push(`${d.id}: no final version`);
    for (const v of vs) {
      if (!['draft', 'final'].includes(v.status)) errors.push(`${d.id} v${v.version}: bad status`);
      const secs = v.sections ?? [];
      if (!secs.length) errors.push(`${d.id} v${v.version}: no sections`);
      const seenSec = new Set();
      for (const s of secs) {
        if (seenSec.has(s.section)) errors.push(`${d.id} v${v.version} §${s.section}: duplicate section`);
        seenSec.add(s.section);
        if (!s.heading || !s.text) errors.push(`${d.id} v${v.version} §${s.section}: missing heading/text`);
        const words = (s.text ?? '').split(/\s+/).length;
        if (words < 35) warns.push(`${d.id} v${v.version} §${s.section}: short text (${words} words)`);
        for (const e of s.evidence ?? []) {
          const r = reqs.get(e.req);
          if (!r) { errors.push(`${d.id} v${v.version} §${s.section}: unknown requirement ${e.req}`); continue; }
          if (!applicableDocIds.has(r.docId) || !reqApplies(m, r)) errors.push(`${d.id} v${v.version} §${s.section}: ${e.req} does not apply to ${id}`);
          if (!['full', 'partial'].includes(e.coverage)) errors.push(`${d.id} §${s.section}: bad coverage for ${e.req}`);
          if (!e.quote || !(s.text ?? '').includes(e.quote)) errors.push(`${d.id} v${v.version} §${s.section}: quote for ${e.req} not verbatim in text`);
          if (v.status === 'final') covered.set(e.req, [...(covered.get(e.req) ?? []), e.coverage]);
        }
      }
    }
  }
  const target = applicable.filter((r) => r.components.some((c) => comps.has(c)));
  const pct = target.length ? covered.size / target.length : 1;
  if (pct < 0.75) errors.push(`evidence covers ${covered.size}/${target.length} applicable requirements (${Math.round(pct * 100)}%), need ≥ 75%`);
  for (const df of j.deficiencies ?? []) {
    if (!reqs.has(df.req)) errors.push(`deficiency: unknown requirement ${df.req}`);
    if (!docsList.some((d) => d.id === df.doc)) errors.push(`deficiency ${df.req}: unknown doc ${df.doc}`);
    if (!['partial', 'non_compliant'].includes(df.verdict)) errors.push(`deficiency ${df.req}: bad verdict`);
    if (!df.rationale || !df.mitigation?.type || !df.mitigation?.text) errors.push(`deficiency ${df.req}: rationale/mitigation missing`);
  }
  if ((j.deficiencies ?? []).length < 3) errors.push('need 3–6 deficiencies');
  const cf = j.codeFacts ?? [];
  if (cf.length < 2) errors.push('need 2–4 code facts');
  if (!cf.some((c) => c.result === 'fail')) errors.push('need at least one failing code fact');
  for (const c of cf) {
    for (const r of c.reqs ?? []) if (!reqs.has(r)) errors.push(`code fact ${c.id}: unknown requirement ${r}`);
    if (c.result === 'fail' && !(c.reqs ?? []).some((r) => (covered.get(r) ?? []).includes('full'))) errors.push(`code fact ${c.id}: failing fact needs a requirement documented with coverage full in a final version`);
  }
  const vt = j.validationTests ?? [];
  if (vt.length < 3) errors.push('need 3–5 validation tests');
  for (const t of vt) {
    const r = reqs.get(t.req);
    if (!r) { errors.push(`validation test ${t.id}: unknown requirement ${t.req}`); continue; }
    if (!r.docId.startsWith('INT-VAL-')) errors.push(`validation test ${t.id}: ${t.req} is not a validation-standard requirement`);
    if (!applicableDocIds.has(r.docId) || !reqApplies(m, r)) errors.push(`validation test ${t.id}: ${t.req} does not apply to ${id}`);
    if (!['pass', 'fail', 'partial'].includes(t.result)) errors.push(`validation test ${t.id}: bad result`);
  }
  if (!vt.some((t) => t.result === 'pass') || !vt.some((t) => t.result !== 'pass')) errors.push('validation tests need at least one pass and one fail/partial');
  console.log(`${id}: ${docsList.length} documents, evidence ${covered.size}/${target.length} (${Math.round(pct * 100)}%), ${errors.length} error(s), ${warns.length} warning(s)`);
  for (const e of errors) console.log('  ERROR', e);
  for (const w of warns.slice(0, 8)) console.log('  WARN ', w);
  if (errors.length) failed = true;
}
process.exit(failed ? 1 : 0);
