import { COMPONENT_LABEL } from '@/lib/ai/generic';
import { RDS_ID, RDS_TITLE, rdsSections } from '@/lib/ai/pilot';
import { manifest, packageId, seal } from '@/lib/packages';
import { LIBRARY_BASE_VERSION, PERSONAS } from '@/lib/seed';
import type { SubmissionPackage } from '@/lib/types';
import { setRequirements, type ModelWork } from '@/stores/store1lod';

export const SIGN_OFF = 'I confirm this self-assessment reflects the model documentation as submitted.';

export async function buildSubmission(work: ModelWork): Promise<SubmissionPackage> {
  const reqs = setRequirements(work);
  const documentVersions = { [RDS_ID]: '1.0', ...Object.fromEntries(work.evidenceDocs.map((d) => [d.id, d.version])) };
  return seal<SubmissionPackage>({
    manifest: manifest({
      packageType: 'submission',
      packageId: packageId('submission', work.modelId),
      modelId: work.modelId,
      createdBy: PERSONAS['1lod'].name,
      line: '1lod',
      libraryVersion: work.run?.libraryVersion ?? LIBRARY_BASE_VERSION,
      requirementSetId: work.reqSetId,
      documentVersions,
    }),
    requirementSet: {
      id: work.reqSetId,
      modelId: work.modelId,
      component: COMPONENT_LABEL[work.component],
      libraryVersion: work.run?.libraryVersion ?? LIBRARY_BASE_VERSION,
      requirementIds: reqs.map((r) => r.id),
      excluded: Object.entries(work.excludedReasons).map(([id, reason]) => ({ id, reason })),
      addedDocuments: work.addedDocuments.map((d) => ({ docId: d.docId, reason: d.reason })),
      uploads: work.uploads,
      lockedAt: work.lockedAt,
      lockedBy: work.lockedBy,
    },
    requirements: reqs,
    documents: [
      { id: RDS_ID, version: '1.0', title: RDS_TITLE, sections: rdsSections('1.0') },
      ...work.evidenceDocs.map((d) => ({ id: d.id, version: d.version, title: d.title, sections: d.sections })),
    ],
    matrix1lod: work.run?.rows ?? [],
    statement: SIGN_OFF,
  });
}
