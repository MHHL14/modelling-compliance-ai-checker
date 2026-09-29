'use client';
import { ArrowRight, Inbox } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PackageImport } from '@/components/common/PackageImport';
import { Card, CardHeader, Kpi, PageHeader } from '@/components/common/ui-bits';
import { REVIEW_STATUS } from '@/components/val/reviewStatus';
import { Button } from '@/components/ui/button';
import { fmtDateTime } from '@/lib/clock';
import { shortHash } from '@/lib/hash';
import { can } from '@/lib/permissions';
import { getModel, PERSONAS } from '@/lib/seed';
import { cn } from '@/lib/utils';
import { use2lod } from '@/stores/store2lod';

export default function ValInbox() {
  const reviews = use2lod((s) => (can('2lod', 'read:store2lod') ? s.reviews : {}));
  const importSubmission = use2lod((s) => s.importSubmission);
  const router = useRouter();
  const list = Object.values(reviews).sort((a, b) => b.importedAt.localeCompare(a.importedAt));
  const me = PERSONAS['2lod'];
  return (
    <div>
      <PageHeader
        eyebrow="Model Validation – 2nd line"
        title="Validation inbox"
        subtitle={`${me.name} · ${me.role}, ${me.unit}. Submissions arrive only as package files; each import is verified and frozen.`}
      />
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Reviews" value={list.length} />
        <Kpi label="In review" value={list.filter((r) => r.status === 'in_review' || r.status === 'imported').length} tone="warn" />
        <Kpi label="Draft findings" value={list.reduce((a, r) => a + r.findings.filter((f) => f.status === 'draft').length, 0)} hint="Never visible to the 1st line" />
        <Kpi label="Opinions issued" value={list.filter((r) => r.status === 'opinion_issued').length} tone="good" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card>
          <CardHeader title="Reviews" subtitle="One review per imported submission package (snapshot)." />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-line bg-bg/70 text-left text-xs font-medium uppercase tracking-wide text-ink-2">
                  <th className="px-4 py-2">Model</th>
                  <th className="px-2 py-2">Package</th>
                  <th className="px-2 py-2">Created by / at</th>
                  <th className="px-2 py-2">Req. set</th>
                  <th className="px-2 py-2">Doc versions</th>
                  <th className="px-2 py-2">Hash</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => {
                  const m = getModel(r.modelId);
                  const st = REVIEW_STATUS[r.status];
                  return (
                    <tr key={r.snapshotId} className="border-b border-line/70 align-top last:border-0 hover:bg-bg">
                      <td className="px-4 py-2.5">
                        <Link href={`/val/reviews/${r.snapshotId}`} className="font-medium text-ink hover:text-lod2 hover:underline">
                          {m?.name ?? r.modelId}
                        </Link>
                        <div className="font-mono text-xs text-ink-2">{r.modelId}</div>
                      </td>
                      <td className="px-2 py-2.5 font-mono text-xs">{r.snapshotId}</td>
                      <td className="px-2 py-2.5 text-xs text-ink-2">
                        {r.pkg.manifest.createdBy}
                        <div>{fmtDateTime(r.pkg.manifest.createdAt)}</div>
                      </td>
                      <td className="px-2 py-2.5 text-xs">{r.pkg.manifest.requirementSetId}</td>
                      <td className="px-2 py-2.5 text-xs text-ink-2">
                        {Object.entries(r.pkg.manifest.documentVersions).map(([k, v]) => (
                          <div key={k}>
                            {k} v{v}
                          </div>
                        ))}
                      </td>
                      <td className="px-2 py-2.5 font-mono text-xs text-ink-2">{shortHash(r.sha256)}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', st.cls)}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-ink-2">
                      <Inbox className="mx-auto mb-2 size-5" aria-hidden /> No submissions imported yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="h-fit p-4">
          <p className="mb-3 text-sm font-semibold">Import submission package</p>
          <PackageImport
            type="submission"
            demoFile="SUB-MDL-01-20270614.rcc.json"
            onVerified={(pkg, sha) => {
              const res = importSubmission(pkg, sha);
              if (res.created) toast.success('Review created', { description: `${res.snapshotId} — 1st line matrix hidden until you reveal it.` });
              return (
                <div className="flex flex-wrap items-center gap-2">
                  <span>{res.created ? 'Review created. The 1st line matrix stays hidden until you reveal it.' : 'Already imported — no changes (idempotent).'}</span>
                  <Button size="xs" onClick={() => router.push(`/val/reviews/${res.snapshotId}`)}>
                    Open review <ArrowRight aria-hidden />
                  </Button>
                </div>
              );
            }}
          />
        </Card>
      </div>
    </div>
  );
}
