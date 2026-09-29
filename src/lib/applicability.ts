import { DOCUMENTS, MODELS } from './seed';
import type { LibraryDocument, Model } from './types';

/** A document applies if the model has any tag in `any` (or `any` is empty) and all tags in `all`. */
export function docApplies(model: Pick<Model, 'tags'>, doc: LibraryDocument): boolean {
  const tags = new Set(model.tags);
  const anyOk = doc.applicability.any.length === 0 || doc.applicability.any.some((t) => tags.has(t));
  const allOk = doc.applicability.all.every((t) => tags.has(t));
  return anyOk && allOk;
}

export function applicableDocs(model: Pick<Model, 'tags'>): LibraryDocument[] {
  return DOCUMENTS.filter((d) => docApplies(model, d));
}

export function modelsForDoc(doc: LibraryDocument): Model[] {
  return MODELS.filter((m) => docApplies(m, doc));
}

export function applicabilityReason(model: Model, doc: LibraryDocument): string {
  const matched = doc.applicability.any.filter((t) => model.tags.includes(t));
  const parts: string[] = [];
  if (doc.applicability.any.length === 0) parts.push('applies to all models');
  else parts.push(`model tag${matched.length > 1 ? 's' : ''} ${matched.map((t) => `“${t}”`).join(', ')}`);
  if (doc.applicability.all.length) parts.push(`requires ${doc.applicability.all.map((t) => `“${t}”`).join(' + ')}`);
  return parts.join('; ');
}
