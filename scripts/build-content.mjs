// Bundles the requirement library into data/generated/library.json (loaded lazily by the app).
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const dir = 'data/library/requirements';
const out = [];
const docs = [];
if (existsSync(dir)) {
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
    docs.push(j.docId);
    for (const r of j.requirements) out.push({ ...r, source_doc: j.docId, docId: j.docId, layer: r.layer ?? 'shared', applicability_rationale: r.applicability_rationale ?? '' });
  }
}
const texts = {};
mkdirSync('data/generated/texts', { recursive: true });
if (existsSync('data/library/texts'))
  for (const f of readdirSync('data/library/texts').filter((f) => f.endsWith('.md'))) {
    const id = f.replace(/\.md$/, '');
    texts[id] = true;
    writeFileSync(`data/generated/texts/${id}.json`, JSON.stringify({ id, markdown: readFileSync(`data/library/texts/${f}`, 'utf8') }));
  }
writeFileSync('data/generated/library.json', JSON.stringify({ documents: docs, texts: Object.keys(texts), requirements: out }));
const models = existsSync('data/modeldocs') ? readdirSync('data/modeldocs').filter((f) => /^MDL-\d{2}\.json$/.test(f)).map((f) => f.slice(0, 6)) : [];
writeFileSync('data/generated/modeldocs-index.json', JSON.stringify({ models }));
console.log(`library: ${docs.length} documents, ${out.length} requirements; model documentation: ${models.length} models`);
