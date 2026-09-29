'use client';
import { Archive } from 'lucide-react';
import { useParams } from 'next/navigation';
import { DocViewerProvider } from '@/components/common/DocViewer';
import { FamilyBadge } from '@/components/common/badges';
import { StageRail, type Stage } from '@/components/common/StageRail';
import { Banner, EmptyState } from '@/components/common/ui-bits';
import { caseSegments } from '@/components/dev/caseProgress';
import { useCaseCtx } from '@/components/dev/useCaseCtx';
import { COMPONENT_LABEL } from '@/lib/ai/generic';
import { fmtDate } from '@/lib/clock';

export default function CaseLayout({ children }: { children: React.ReactNode }) {
  const { caseId } = useParams<{ caseId: string }>();
  const { id, uc, model, docs, readOnly, seeded } = useCaseCtx(caseId);
  if (!uc || !model) return seeded ? <EmptyState title="Use case not found">There is no use case with ID {id}.</EmptyState> : null;
  const base = `/dev/cases/${encodeURIComponent(id)}`;
  const seg = caseSegments(uc);
  const rows = uc.run?.rows ?? [];
  const decided = rows.filter((r) => r.decision).length;
  const toStatus = (i: number): Stage['status'] => (seg[i] === 'done' ? 'done' : seg[i] === 'current' ? 'current' : 'todo');
  const stages: Stage[] = [
    { key: 'overview', label: 'Overview', href: base, status: 'optional', note: 'Stage tracker and counts' },
    { key: 'scope', label: 'Scoping', href: `${base}/scope`, status: toStatus(0), note: uc.lockedAt ? `${uc.reqSetId} locked` : uc.generatedAt ? 'Decide and lock the set' : 'Not started' },
    { key: 'draft', label: 'Draft check', href: `${base}/draft`, status: toStatus(1), note: 'Sandbox · no sign-off' },
    { key: 'assess', label: 'Self-assessment', href: `${base}/assess`, status: toStatus(2), note: uc.run ? `${decided}/${rows.length} reviewed` : 'Not started' },
    { key: 'submit', label: 'Submit', href: `${base}/submit`, status: toStatus(3), note: uc.submission ? uc.submission.packageId : 'Freeze and export package' },
    { key: 'findings', label: 'Findings', href: `${base}/findings`, status: toStatus(4), note: uc.findings.length ? `${uc.findings.length} received` : 'Awaiting findings package' },
  ];
  return (
    <DocViewerProvider docs={docs}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <StageRail
          title={
            <a href={base} className="hover:underline">
              {model.name}
            </a>
          }
          subtitle={
            <span className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="font-mono">{model.id}</span> <FamilyBadge family={model.model_family} />
              <span className="block w-full">
                {uc.cycle} · {COMPONENT_LABEL[uc.component]}
              </span>
            </span>
          }
          stages={stages}
        />
        <div className="min-w-0 flex-1">
          {readOnly && (
            <Banner tone="info" icon={<Archive className="size-4" aria-hidden />} className="mb-4">
              Completed use case ({fmtDate(uc.completedAt)}) — read-only. Start a new cycle for this model from “New use case”.
            </Banner>
          )}
          {children}
        </div>
      </div>
    </DocViewerProvider>
  );
}
