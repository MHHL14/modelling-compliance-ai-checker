// Content of the requirement library (Part 2) and the model documentation library (Part 3).
// Loaded on demand (dynamic import → separate chunks); synchronous accessors after loading.
import type { Mitigation, Requirement, Verdict } from '../types';

export type ComponentKey = 'rds' | 'mdd';

export interface LibReq extends Requirement {
  docId: string;
  chapter: string;
  components: ComponentKey[];
  applies_if?: { any?: string[]; all?: string[] };
  not_applicable_reason?: string;
  quote?: string;
  verification: 'verified' | 'to_review';
  verification_note?: string;
  introduced_in?: string;
  /** institution-level obligations are evidenced in governance documents, not in model documentation */
  level?: 'institution';
  level_reason?: string;
}

export interface EvidenceRef {
  req: string;
  coverage: 'full' | 'partial';
  quote: string;
}
export interface MDSection {
  section: string;
  heading: string;
  text: string;
  evidence?: EvidenceRef[];
}
export interface MDVersion {
  version: string;
  status: 'draft' | 'final';
  date: string;
  sections: MDSection[];
}
export interface ModelDocument {
  id: string;
  title: string;
  type: string;
  component: ComponentKey[];
  owner: string;
  versions: MDVersion[];
}
export interface Deficiency {
  req: string;
  doc: string;
  verdict: 'partial' | 'non_compliant';
  rationale: string;
  mitigation: Mitigation;
  detected_by?: '2lod';
}
export interface CodeFact {
  id: string;
  reqs: string[];
  check: string;
  result: 'pass' | 'fail';
  detail: string;
}
export interface ValidationTest {
  req: string;
  id: string;
  result: 'pass' | 'fail' | 'partial';
  verdict: Verdict;
  detail: string;
}
export interface ModelDocs {
  modelId: string;
  documents: ModelDocument[];
  deficiencies: Deficiency[];
  codeFacts: CodeFact[];
  validationTests: ValidationTest[];
}

let library: LibReq[] | null = null;
let textIds: Set<string> | null = null;
let libraryById: Map<string, LibReq> | null = null;
let libraryPromise: Promise<void> | null = null;
const modelDocs = new Map<string, ModelDocs | null>();
const modelPromises = new Map<string, Promise<void>>();

export function setLibrary(reqs: LibReq[]) {
  library = reqs;
  libraryById = new Map(reqs.map((r) => [r.id, r]));
}

export function loadLibrary(): Promise<void> {
  if (library) return Promise.resolve();
  if (!libraryPromise) {
    libraryPromise = import('../../../data/generated/library.json').then((m) => {
      const data = (m as unknown as { default: { requirements: LibReq[]; texts: string[] } }).default ?? (m as unknown as { requirements: LibReq[]; texts: string[] });
      setLibrary(data.requirements);
      textIds = new Set(data.texts ?? []);
    });
  }
  return libraryPromise;
}

export function loadModelDocs(modelId: string): Promise<void> {
  if (modelDocs.has(modelId)) return Promise.resolve();
  if (!modelPromises.has(modelId)) {
    modelPromises.set(
      modelId,
      import(`../../../data/modeldocs/${modelId}.json`)
        .then((m) => {
          const data = (m as { default?: ModelDocs }).default ?? (m as unknown as ModelDocs);
          modelDocs.set(modelId, data);
        })
        .catch(() => {
          modelDocs.set(modelId, null);
        }),
    );
  }
  return modelPromises.get(modelId)!;
}

export async function loadContent(modelIds: string[] = []) {
  await Promise.all([loadLibrary(), ...modelIds.map(loadModelDocs)]);
}

export const libraryLoaded = () => !!library;
export const modelDocsLoaded = (id: string) => modelDocs.has(id);

export function libraryReqs(): LibReq[] {
  if (!library) throw new Error('Requirement library not loaded');
  return library;
}
export function libReq(id: string): LibReq | undefined {
  return libraryById?.get(id);
}
export function getModelDocs(modelId: string): ModelDocs | undefined {
  return modelDocs.get(modelId) ?? undefined;
}
export function setModelDocs(modelId: string, docs: ModelDocs) {
  modelDocs.set(modelId, docs);
}

/** Internal documents written for the prototype have a full text. */
export const hasText = (docId: string) => !!textIds?.has(docId);
export async function loadText(docId: string): Promise<string | null> {
  try {
    const m = await import(`../../../data/generated/texts/${docId}.json`);
    return ((m as { default?: { markdown: string } }).default ?? (m as { markdown: string })).markdown;
  } catch {
    return null;
  }
}
