import { compactDate, nowISO } from './clock';
import { packageHash } from './hash';
import type { AnyPackage, FindingsPackage, PackageManifest, ResponsePackage, SubmissionPackage } from './types';

export const PACKAGE_PREFIX: Record<PackageManifest['packageType'], string> = { submission: 'SUB', findings: 'FND', response: 'RSP' };

export const PACKAGE_LABEL: Record<PackageManifest['packageType'], string> = {
  submission: 'Submission package',
  findings: 'Findings package',
  response: 'Response package',
};

export function packageId(type: PackageManifest['packageType'], modelId: string, seq = 1) {
  return `${PACKAGE_PREFIX[type]}-${modelId}-${compactDate()}${seq > 1 ? `-${String(seq).padStart(2, '0')}` : ''}`;
}

export function manifest(p: Omit<PackageManifest, 'createdAt' | 'schemaVersion' | 'sha256'> & { createdAt?: string }): PackageManifest {
  return { ...p, createdAt: p.createdAt ?? nowISO(), schemaVersion: '1.0', sha256: '' };
}

/** Compute and set the integrity hash. */
export async function seal<T extends AnyPackage>(pkg: T): Promise<T> {
  const sha256 = await packageHash(pkg);
  return { ...pkg, manifest: { ...pkg.manifest, sha256 } };
}

export function fileNameFor(m: PackageManifest) {
  return `${m.packageId}.rcc.json`;
}

export function downloadJson(fileName: string, obj: unknown) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export type VerifyResult<T> =
  | { ok: true; pkg: T; sha256: string }
  | { ok: false; error: string; detail?: string };

type TypeMap = { submission: SubmissionPackage; findings: FindingsPackage; response: ResponsePackage };

const REQUIRED_MANIFEST: (keyof PackageManifest)[] = [
  'packageType', 'packageId', 'modelId', 'createdAt', 'createdBy', 'line', 'libraryVersion', 'requirementSetId', 'documentVersions', 'schemaVersion', 'sha256',
];

/** Verify schema and SHA-256 of an imported package file (spec 4.3). */
export async function verifyPackage<K extends keyof TypeMap>(text: string, expected: K): Promise<VerifyResult<TypeMap[K]>> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Not a valid package file', detail: 'The file is not valid JSON.' };
  }
  const pkg = parsed as AnyPackage;
  const m = pkg?.manifest as PackageManifest | undefined;
  if (!m || typeof m !== 'object') return { ok: false, error: 'Manifest missing', detail: 'The file has no package manifest.' };
  const missing = REQUIRED_MANIFEST.filter((k) => m[k] === undefined);
  if (missing.length) return { ok: false, error: 'Manifest incomplete', detail: `Missing fields: ${missing.join(', ')}.` };
  if (m.schemaVersion !== '1.0') return { ok: false, error: 'Unsupported schema version', detail: `Schema ${m.schemaVersion} — expected 1.0.` };
  if (m.packageType !== expected) {
    return { ok: false, error: 'Wrong package type', detail: `This is a ${PACKAGE_LABEL[m.packageType] ?? m.packageType}; expected a ${PACKAGE_LABEL[expected].toLowerCase()}.` };
  }
  const shapeOk =
    expected === 'submission'
      ? Array.isArray((pkg as SubmissionPackage).matrix1lod) && Array.isArray((pkg as SubmissionPackage).documents) && !!(pkg as SubmissionPackage).requirementSet
      : expected === 'findings'
        ? Array.isArray((pkg as FindingsPackage).findings)
        : Array.isArray((pkg as ResponsePackage).responses);
  if (!shapeOk) return { ok: false, error: 'Payload does not match schema', detail: 'Required package sections are missing.' };
  const computed = await packageHash(pkg);
  if (computed !== m.sha256) {
    return {
      ok: false,
      error: 'Integrity check failed — package rejected',
      detail: `SHA-256 in manifest (${String(m.sha256).slice(0, 12)}…) does not match the computed hash of the payload (${computed.slice(0, 12)}…). The file was modified after export.`,
    };
  }
  return { ok: true, pkg: pkg as TypeMap[K], sha256: computed };
}
