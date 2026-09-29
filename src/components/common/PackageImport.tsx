'use client';
import { FileJson, PackageOpen, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { fmtDateTime } from '@/lib/clock';
import { shortHash } from '@/lib/hash';
import { PACKAGE_LABEL, verifyPackage } from '@/lib/packages';
import { INDEPENDENCE_TOOLTIP } from '@/lib/permissions';
import type { FindingsPackage, PackageManifest, ResponsePackage, SubmissionPackage } from '@/lib/types';
import { FileDrop } from './FileDrop';

type TypeMap = { submission: SubmissionPackage; findings: FindingsPackage; response: ResponsePackage };

export function VerificationCard({ m, sha, note }: { m: PackageManifest; sha?: string; note?: React.ReactNode }) {
  const who = m.createdBy.includes('(') ? m.createdBy : `${m.createdBy}, ${m.line === '1lod' ? '1st line' : '2nd line'}`;
  return (
    <div className="rounded-lg border border-green-100 bg-green-50 p-3.5">
      <div className="flex items-center gap-2 text-sm font-semibold text-green-900">
        <ShieldCheck className="size-4 text-green-600" aria-hidden /> Integrity verified ✓
      </div>
      <p className="mt-1 text-sm text-green-900">
        {PACKAGE_LABEL[m.packageType]} <span className="font-mono">{m.packageId}</span> · created by {who} · {fmtDateTime(m.createdAt)} · requirement set {m.requirementSetId} · library v{m.libraryVersion}
      </p>
      <p className="mt-1 font-mono text-xs text-green-800">SHA-256 {shortHash(sha ?? m.sha256)} · schema {m.schemaVersion}</p>
      {note && <div className="mt-1.5 text-sm text-green-900">{note}</div>}
    </div>
  );
}

export function PackageImport<K extends keyof TypeMap>({
  type,
  expectedModelId,
  onVerified,
  demoFile,
  label,
}: {
  type: K;
  expectedModelId?: string;
  onVerified: (pkg: TypeMap[K], sha256: string) => React.ReactNode | void;
  demoFile?: string;
  label?: string;
}) {
  const [error, setError] = useState<{ error: string; detail?: string } | null>(null);
  const [ok, setOk] = useState<{ m: PackageManifest; sha: string; note?: React.ReactNode } | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleText(text: string) {
    setBusy(true);
    setError(null);
    setOk(null);
    const res = await verifyPackage(text, type);
    setBusy(false);
    if (!res.ok) {
      setError({ error: res.error, detail: res.detail });
      return;
    }
    if (expectedModelId && res.pkg.manifest.modelId !== expectedModelId) {
      setError({ error: 'Package belongs to another model', detail: `This package is for ${res.pkg.manifest.modelId}; this page is for ${expectedModelId}.` });
      return;
    }
    const note = onVerified(res.pkg, res.sha256);
    setOk({ m: res.pkg.manifest, sha: res.sha256, note: note || undefined });
  }

  return (
    <div className="space-y-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <FileDrop
              accept=".json,application/json"
              label={busy ? 'Verifying…' : (label ?? `Import ${PACKAGE_LABEL[type].toLowerCase()} (.rcc.json)`)}
              hint="Drag and drop the package file, or click to pick it. Schema and SHA-256 are verified on import."
              onFiles={async (files) => handleText(await files[0].text())}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{INDEPENDENCE_TOOLTIP}</TooltipContent>
      </Tooltip>
      {demoFile && (
        <div className="flex items-center gap-2 text-xs text-ink-2">
          <PackageOpen className="size-3.5" aria-hidden /> Live export not at hand?
          <Button
            variant="link"
            size="xs"
            className="h-auto p-0 text-xs"
            onClick={async () => {
              const r = await fetch(`/demo-packages/${demoFile}`);
              if (!r.ok) {
                setError({ error: 'Demo package not available', detail: demoFile });
                return;
              }
              handleText(await r.text());
            }}
          >
            <FileJson aria-hidden /> Import demo package
          </Button>
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-[#f1c4bd] bg-red-100 p-3.5" role="alert">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#8e2a20]">
            <ShieldAlert className="size-4" aria-hidden /> {error.error}
          </div>
          {error.detail && <p className="mt-1 text-sm text-[#8e2a20]">{error.detail}</p>}
        </div>
      )}
      {ok && <VerificationCard m={ok.m} sha={ok.sha} note={ok.note} />}
    </div>
  );
}
