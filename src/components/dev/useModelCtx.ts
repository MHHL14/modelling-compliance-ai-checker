'use client';
import { useEffect, useMemo } from 'react';
import { genericEvidenceDoc } from '@/lib/ai/generic';
import { RDS_ID, RDS_TITLE, rdsSections } from '@/lib/ai/pilot';
import { getModel, PILOT_MODEL_ID } from '@/lib/seed';
import type { ViewerDoc } from '@/lib/types';
import { proposalRequirements, setRequirements, use1lod } from '@/stores/store1lod';

/** 1st line context for a model page. Reads store1lod and the library only (never store2lod). */
export function useModelCtx(id: string) {
  const model = getModel(id);
  const ensure = use1lod((s) => s.ensure);
  const work = use1lod((s) => s.models[id]);
  useEffect(() => {
    if (model) ensure(id);
  }, [id, model, ensure]);
  const pilot = id === PILOT_MODEL_ID;

  const docs: ViewerDoc[] = useMemo(() => {
    if (!model || !work) return [];
    const out: ViewerDoc[] = [];
    if (pilot) {
      for (const v of ['1.0', '0.7']) out.push({ id: RDS_ID, title: `${RDS_TITLE}${v === '0.7' ? ' (draft)' : ''}`, version: v, sections: rdsSections(v), aiBlocks: work.aiBlocks[v] });
    } else {
      const g = genericEvidenceDoc(model, proposalRequirements(work));
      out.push({ id: g.id, title: g.title, version: g.version, sections: g.sections });
    }
    for (const e of work.evidenceDocs) out.push({ id: e.id, title: e.title, version: e.version, sections: e.sections });
    return out;
  }, [model, work, pilot]);

  const inSet = useMemo(() => (work ? setRequirements(work) : []), [work]);
  return { model, work, pilot, docs, inSet };
}
