'use client';
import { useMemo } from 'react';
import { useContent } from '@/components/common/useContent';
import { resolveSelection } from '@/lib/engine/assess';
import { getModel } from '@/lib/seed';
import type { ViewerDoc } from '@/lib/types';
import { selKey, setRequirements, use1lod } from '@/stores/store1lod';

/** 1st line context for a use case. Reads store1lod and the libraries only (never store2lod). */
export function useCaseCtx(caseId: string) {
  const id = decodeURIComponent(caseId);
  const uc = use1lod((s) => s.cases[id]);
  const seeded = use1lod((s) => s.seeded);
  const model = uc ? getModel(uc.modelId) : undefined;
  const modelIds = uc ? [...new Set([uc.modelId, ...uc.draftSelection.map((s) => s.modelId), ...(uc.submissionSelection ?? []).map((s) => s.modelId)])] : [];
  const ready = useContent(modelIds);
  /** documents the viewer can open: every selected document (draft and submission) and every upload */
  const docs: ViewerDoc[] = useMemo(() => {
    if (!uc || !ready) return [];
    const seen = new Set<string>();
    const out: ViewerDoc[] = [];
    for (const d of resolveSelection([...uc.draftSelection, ...(uc.submissionSelection ?? [])], uc.evidenceDocs)) {
      const k = `${d.id}@${d.version}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ id: d.id, title: `${d.title}${d.status === 'draft' ? ' (draft)' : ''}`, version: d.version, sections: d.sections, aiBlocks: uc.aiBlocks[selKey({ modelId: uc.modelId, docId: d.id, version: d.version })] });
    }
    return out;
  }, [uc, ready]);
  const inSet = useMemo(() => (uc && ready ? setRequirements(uc) : []), [uc, ready]);
  const readOnly = uc?.status === 'completed';
  return { id, uc, model, docs, inSet, readOnly, seeded, ready };
}
