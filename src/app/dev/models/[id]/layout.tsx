'use client';
import { useParams } from 'next/navigation';
import { DocViewerProvider } from '@/components/common/DocViewer';
import { FamilyBadge, PilotBadge } from '@/components/common/badges';
import { StageRail, type Stage } from '@/components/common/StageRail';
import { EmptyState } from '@/components/common/ui-bits';
import { useModelCtx } from '@/components/dev/useModelCtx';

export default function ModelLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const { model, work, pilot, docs } = useModelCtx(id);
  if (!model) return <EmptyState title="Model not found">No model with ID {id} in the inventory.</EmptyState>;
  if (!work) return null;
  const base = `/dev/models/${id}`;
  const rows = work.run?.rows ?? [];
  const decided = rows.filter((r) => r.decision).length;
  const pilotOnly = 'Pilot only in this prototype';
  const stages: Stage[] = [
    { key: 'scope', label: 'Scoping', href: `${base}/scope`, status: work.lockedAt ? 'done' : 'current', note: work.lockedAt ? `${work.reqSetId} locked` : 'Set proposed · not locked' },
    { key: 'draft', label: 'Draft check', href: `${base}/draft`, status: pilot ? (work.draftCheck ? 'done' : 'optional') : 'locked', note: pilot ? 'Sandbox · no sign-off' : pilotOnly },
    {
      key: 'assess', label: 'Self-assessment', href: `${base}/assess`,
      status: !pilot ? 'locked' : work.submission ? 'done' : work.run ? 'current' : 'todo',
      note: pilot ? (work.run ? `${decided}/${rows.length} reviewed` : 'Not started') : pilotOnly,
    },
    { key: 'submit', label: 'Submit', href: `${base}/submit`, status: !pilot ? 'locked' : work.submission ? 'done' : 'todo', note: pilot ? (work.submission ? work.submission.packageId : 'Freeze & export package') : pilotOnly },
    {
      key: 'findings', label: 'Findings', href: `${base}/findings`,
      status: !pilot ? 'locked' : work.responseExports.length ? 'done' : work.findings.length ? 'current' : 'todo',
      note: pilot ? (work.findings.length ? `${work.findings.length} received` : 'Awaiting findings package') : pilotOnly,
    },
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
              <span className="font-mono">{model.id}</span> <FamilyBadge family={model.model_family} /> {model.pilot && <PilotBadge />}
            </span>
          }
          stages={[{ key: 'overview', label: 'Overview', href: base, status: 'optional', note: 'Stage tracker & counts' }, ...stages]}
        />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </DocViewerProvider>
  );
}
