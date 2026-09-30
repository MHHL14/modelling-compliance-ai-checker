// Validates requirement library files. Usage: node scripts/validate-library.mjs [DOC-ID ...]
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const TAGS = new Set(['all_models', 'aml', 'capital', 'climate', 'corporate', 'credit', 'credit_origination', 'fraud', 'genai', 'icaap', 'ifrs9', 'irb', 'irb_ead', 'irb_lgd', 'irb_pd', 'irrbb', 'market', 'market_ima', 'ml', 'mortgage', 'mortgage_origination', 'natural_person_credit', 'personal_data', 'retail', 'risk_reporting', 'sme', 'statistical', 'stress_test', 'third_party_ai', 'valuation']);
const CATS = new Set(['data', 'methodology', 'governance', 'documentation', 'validation']);
const CHECKS = new Set(['ai', 'script', 'ai+script']);
const COMPS = new Set(['rds', 'mdd']);
const NO_QUOTE = /^(EXT-IFRS9|EXT-IFRS13|EXT-BCBS239|EXT-PRA-SS123|EXT-DNB-WWFT|EXT-WWFT)$/;

const docs = JSON.parse(readFileSync('data/documents.json', 'utf8'));
const docIds = new Set(docs.map((d) => d.id));
const pilot = JSON.parse(readFileSync('data/pilot_seed.json', 'utf8'));
const PILOT_SOURCE = {
  'REQ-D01': 'EXT-CRR-IRB', 'REQ-D15': 'EXT-CRR-IRB', 'REQ-D21': 'EXT-CRR-IRB', 'REQ-D02': 'EXT-ECB-GIM', 'REQ-D07': 'EXT-RTS-MAT',
  'REQ-D08': 'EXT-EBA-DOD', 'REQ-D09': 'EXT-EBA-DOD', 'REQ-D12a': 'EXT-EBA-PDLGD', 'REQ-D12b': 'EXT-EBA-PDLGD', 'REQ-D12c': 'EXT-EBA-PDLGD',
  'REQ-D22': 'EXT-EBA-PDLGD', 'REQ-D18': 'INT-STD-DQ', 'REQ-D19': 'INT-POL-DATA', 'REQ-D25': 'EXT-GDPR', 'REQ-D26': 'INT-POL-CREDIT',
  'REQ-D30': 'INT-STD-DOC', 'REQ-G01': 'INT-STD-DOC', 'REQ-D31': 'INT-STD-EJ', 'VAL-01': 'INT-VAL-GEN', 'VAL-02': 'INT-VAL-IRB', 'VAL-03': 'INT-VAL-IRB', 'VAL-04': 'INT-VAL-TEST',
  'REQ-L14': 'EXT-EBA-DLGD', 'REQ-D55': 'EXT-ECB-GIM',
};

const dir = 'data/library/requirements';
const only = process.argv.slice(2);
const files = (only.length ? only.map((id) => `${id}.json`) : readdirSync(dir).filter((f) => f.endsWith('.json')));
const errors = [];
const warn = [];
const seen = new Map();
let total = 0;
// global uniqueness across all existing files
for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  try {
    const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
    for (const r of j.requirements ?? []) seen.set(r.id, [...(seen.get(r.id) ?? []), f]);
  } catch {
    /* reported below */
  }
}
for (const f of files) {
  const p = `${dir}/${f}`;
  if (!existsSync(p)) { errors.push(`${f}: file missing`); continue; }
  let j;
  try { j = JSON.parse(readFileSync(p, 'utf8')); } catch (e) { errors.push(`${f}: invalid JSON (${e.message})`); continue; }
  const docId = f.replace(/\.json$/, '');
  if (j.docId !== docId) errors.push(`${f}: docId "${j.docId}" does not match file name`);
  if (!docIds.has(docId)) errors.push(`${f}: unknown document ID`);
  if (!Array.isArray(j.requirements) || !j.requirements.length) { errors.push(`${f}: no requirements`); continue; }
  const isInternal = docId.startsWith('INT-');
  if (isInternal && !existsSync(`data/library/texts/${docId}.md`)) errors.push(`${f}: internal document text data/library/texts/${docId}.md missing`);
  for (const r of j.requirements) {
    total++;
    const at = `${f} ${r.id ?? '(no id)'}`;
    if (!r.id || !/^[A-Za-z0-9.\-]+$/.test(r.id)) errors.push(`${at}: invalid id`);
    if ((seen.get(r.id) ?? []).length > 1) errors.push(`${at}: duplicate id in ${seen.get(r.id).join(', ')}`);
    for (const k of ['article', 'chapter', 'text']) if (!r[k] || typeof r[k] !== 'string') errors.push(`${at}: missing ${k}`);
    if (r.text && r.text.split(/\s+/).length > 60) warn.push(`${at}: text longer than 60 words`);
    if (!CATS.has(r.category)) errors.push(`${at}: bad category ${r.category}`);
    if (!CHECKS.has(r.check_type)) errors.push(`${at}: bad check_type ${r.check_type}`);
    if (!Array.isArray(r.components) || !r.components.length || r.components.some((c) => !COMPS.has(c))) errors.push(`${at}: components must be a non-empty subset of [rds, mdd]`);
    const ai = r.applies_if ?? { any: [], all: [] };
    for (const t of [...(ai.any ?? []), ...(ai.all ?? [])]) if (!TAGS.has(t)) errors.push(`${at}: unknown tag ${t}`);
    if (((ai.any ?? []).length || (ai.all ?? []).length) && !r.not_applicable_reason) errors.push(`${at}: restrictive applies_if needs not_applicable_reason`);
    const layer = r.layer ?? 'shared';
    if (docId.startsWith('INT-VAL-') ? layer !== '2lod' : layer !== 'shared') errors.push(`${at}: layer should be ${docId.startsWith('INT-VAL-') ? '2lod' : 'shared'}`);
    if (!['verified', 'to_review'].includes(r.verification)) errors.push(`${at}: verification must be verified or to_review`);
    if (r.quote && NO_QUOTE.test(docId)) errors.push(`${at}: quotes not allowed for this source — paraphrase`);
    if (r.quote && r.quote.split(/\s+/).length > 30) errors.push(`${at}: quote longer than 25 words`);
    if (PILOT_SOURCE[r.id] && PILOT_SOURCE[r.id] !== docId) errors.push(`${at}: pilot requirement belongs in ${PILOT_SOURCE[r.id]}`);
  }
  for (const [pid, src] of Object.entries(PILOT_SOURCE)) {
    if (src !== docId) continue;
    const rec = j.requirements.find((r) => r.id === pid);
    if (!rec) { errors.push(`${f}: pilot requirement ${pid} missing`); continue; }
    const seed = pilot.requirements.find((r) => r.id === pid);
    if (seed && (seed.text !== rec.text || seed.article !== rec.article)) errors.push(`${f}: pilot requirement ${pid} must keep text and article exactly`);
    if (!pid.startsWith('VAL') && pid !== 'REQ-L14' && pid !== 'REQ-D55' && !rec.components?.includes('rds')) errors.push(`${f}: pilot requirement ${pid} must include component rds`);
  }
}
console.log(`${files.length} file(s), ${total} requirements, ${errors.length} error(s), ${warn.length} warning(s)`);
for (const e of errors) console.log('ERROR', e);
for (const w of warn.slice(0, 20)) console.log('WARN ', w);
process.exit(errors.length ? 1 : 0);
