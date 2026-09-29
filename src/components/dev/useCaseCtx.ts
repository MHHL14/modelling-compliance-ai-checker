'use client';
import { useMemo } from 'react';
import { getModel } from '@/lib/seed';
import type { ViewerDoc } from '@/lib/types';
import { caseScenario, setRequirements, use1lod } from '@/stores/store1lod';

/** 1st line context for a use case. Reads store1lod and the library only (never store2lod). */
export function useCaseCtx(caseId: string) {
  const id = decodeURIComponent(caseId);
  const uc = use1lod((s) => s.cases[id]);
  const seeded = use1lod((s) => s.seeded);
  const model = uc ? getModel(uc.modelId) : undefined;
  const sc = useMemo(() => (uc ? caseScenario(uc) : undefined), [uc]);
  const docs: ViewerDoc[] = useMemo(() => {
    if (!uc || !sc) return [];
    const out: ViewerDoc[] = [sc.document.draftVersion, sc.document.finalVersion].map((v) => ({
      id: sc.document.id, version: v, title: `${sc.document.title}${v === sc.document.draftVersion ? ' (draft)' : ''}`, sections: sc.document.versions[v], aiBlocks: uc.aiBlocks[v],
    }));
    for (const e of uc.evidenceDocs) out.push({ id: e.id, title: e.title, version: e.version, sections: e.sections });
    return out;
  }, [uc, sc]);
  const inSet = useMemo(() => (uc ? setRequirements(uc) : []), [uc]);
  const readOnly = uc?.status === 'completed';
  return { id, uc, model, sc, docs, inSet, readOnly, seeded };
}
