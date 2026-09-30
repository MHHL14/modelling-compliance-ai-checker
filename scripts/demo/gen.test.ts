// One-off generator for public/demo-packages (run: npx vitest run --config scripts/demo/vitest.config.ts)
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { loadContent } from '@/lib/content';
import { typicalSources } from '@/lib/engine/history';
import { fileNameFor, manifest, packageId, seal } from '@/lib/packages';
import { getModel, PERSONAS } from '@/lib/seed';
import type { FindingsPackage, ResponsePackage } from '@/lib/types';
import { attributesFromModel, use1lod } from '@/stores/store1lod';
import { use2lod } from '@/stores/store2lod';

const out = (pkg: { manifest: Parameters<typeof fileNameFor>[0] }) => writeFileSync(`public/demo-packages/${fileNameFor(pkg.manifest)}`, JSON.stringify(pkg, null, 2));

it('generates the MDL-01 demo packages', async () => {
  await loadContent(['MDL-01']);
  const s1 = use1lod.getState();
  const id = s1.createCase({ modelId: 'MDL-01', cycle: 'Initial validation 2027', component: 'rds', attributes: attributesFromModel(getModel('MDL-01')!), sources: typicalSources('MDL-01') });
  s1.generate(id);
  s1.setReqStatus(id, Object.keys(use1lod.getState().cases[id].reqStatus), 'accepted');
  if (!s1.lock(id)) throw new Error('lock failed');
  s1.setSubmissionSelection(id, [
    { modelId: 'MDL-01', docId: 'EVD-01-RDS', version: '1.0' },
    { modelId: 'MDL-01', docId: 'EVD-01-MDD', version: '4.0' },
  ]);
  s1.confirmSelection(id);
  s1.runAssessment(id);
  s1.fastForward(id);
  const sub = await s1.buildSubmission(id);
  out(sub);
  s1.recordSubmission(id, { packageId: sub.manifest.packageId, sha256: sub.manifest.sha256, at: sub.manifest.createdAt, fileName: fileNameFor(sub.manifest), packageJson: JSON.stringify(sub) });

  const s2 = use2lod.getState();
  const rid = s2.importSubmission(sub, sub.manifest.sha256).snapshotId;
  s2.runBlind(rid);
  s2.decide(rid, use2lod.getState().reviews[rid].run!.rows.map((r) => r.requirementId), { decision: 'accepted' });
  s2.reveal(rid);
  const fids = ['REQ-D07', 'REQ-D21'].map((r) => s2.draftFindingFromRow(rid, r, { category: 'code_differs' }));
  fids.forEach((f) => s2.issueFinding(rid, f));
  const review = use2lod.getState().reviews[rid];
  const fnd = await seal<FindingsPackage>({
    manifest: manifest({ packageType: 'findings', packageId: packageId('findings', 'MDL-01', 1), modelId: 'MDL-01', createdBy: PERSONAS['2lod'].name, line: '2lod', libraryVersion: review.pkg.manifest.libraryVersion, requirementSetId: review.pkg.manifest.requirementSetId, documentVersions: review.pkg.manifest.documentVersions }),
    findings: review.findings.filter((f) => f.status !== 'draft'),
  });
  out(fnd);

  const uc = use1lod.getState().cases[id];
  const f07 = fnd.findings.find((f) => f.requirementRefs.includes('REQ-D07'))!;
  const rsp = await seal<ResponsePackage>({
    manifest: manifest({ packageType: 'response', packageId: packageId('response', 'MDL-01', 1), modelId: 'MDL-01', createdBy: PERSONAS['1lod'].name, line: '1lod', libraryVersion: uc.run!.libraryVersion, requirementSetId: uc.reqSetId, documentVersions: uc.run!.documentVersions }),
    responses: [{ findingId: f07.id, plan: 'Correct MAT_ABS in rds_build.py to EUR 100, rebuild the RDS for all vintages 2012–2024 and quantify the PD impact per rating grade by 2027-09-15.', evidence: [] }],
  });
  out(rsp);
  console.log(sub.manifest.packageId, sub.requirements?.length, sub.documents.map((d) => d.id), fnd.findings.map((f) => f.id + ':' + f.requirementRefs.join(',')), rsp.manifest.packageId);
});
