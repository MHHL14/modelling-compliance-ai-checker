'use client';
import { AlertTriangle, Boxes, Inbox, Search, Send } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Chip, FamilyBadge, PilotBadge } from '@/components/common/badges';
import { Card, Kpi, PageHeader } from '@/components/common/ui-bits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { applicableDocs } from '@/lib/applicability';
import { can } from '@/lib/permissions';
import { MODELS, PERSONAS } from '@/lib/seed';
import { cn } from '@/lib/utils';
import { use1lod } from '@/stores/store1lod';

const FAMILIES = [
  ['all', 'All'],
  ['statistical', 'Statistical'],
  ['ml', 'ML'],
  ['genai', 'GenAI'],
  ['expert', 'Expert'],
] as const;

function lifecycleTone(stage: string) {
  if (stage.startsWith('Development')) return 'bg-blue-100 text-blue';
  if (stage.startsWith('Pre-submission')) return 'bg-amber-100 text-amber';
  if (stage.startsWith('Validation')) return 'bg-lod2/10 text-lod2';
  if (stage.startsWith('Change')) return 'bg-[#efe7f7] text-[#5b3a86]';
  return 'bg-green-50 text-green-800';
}

export default function InventoryPage() {
  const cases = use1lod((s) => (can('1lod', 'read:store1lod') ? s.cases : {}));
  const activeCase = (modelId: string) => Object.values(cases).find((c) => c.modelId === modelId && c.status === 'active');
  const [family, setFamily] = useState<string>('all');
  const [mine, setMine] = useState(false);
  const [q, setQ] = useState('');
  const me = PERSONAS['1lod'];

  const rows = useMemo(
    () =>
      MODELS.filter((m) => family === 'all' || m.model_family === family)
        .filter((m) => !mine || m.owner_1lod === me.unit)
        .filter((m) => {
          const ql = q.trim().toLowerCase();
          return !ql || `${m.id} ${m.name} ${m.portfolio} ${m.regulatory_use}`.toLowerCase().includes(ql);
        }),
    [family, mine, q, me.unit],
  );

  const all = Object.values(cases);
  const openFindings = (modelId: string) => all.filter((c) => c.modelId === modelId).reduce((n, c) => n + c.findings.filter((f) => f.status !== 'closed').length, 0);
  const inProgress = all.filter((c) => c.status === 'active' && !c.submission).length;
  const awaiting = all.filter((c) => c.status === 'active' && c.submission && !c.findings.length).length;
  const received = all.reduce((n, c) => n + c.findings.filter((f) => f.status !== 'closed').length, 0);

  return (
    <div>
      <PageHeader
        eyebrow={<Link href="/dev" className="hover:underline">← Your use cases</Link>}
        title="Model inventory"
        subtitle={`${me.name} · ${me.role}, ${me.unit}. Model inventory with regulatory scope computed from the requirement library.`}
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Models in scope" value={MODELS.length} hint="Model inventory" icon={<Boxes className="size-4" aria-hidden />} />
        <Kpi label="Use cases in progress" value={inProgress} hint="Your active use cases" tone="warn" icon={<AlertTriangle className="size-4" aria-hidden />} />
        <Kpi label="Awaiting validation" value={awaiting} hint="Submitted to the 2nd line" icon={<Send className="size-4" aria-hidden />} />
        <Kpi label="Open findings" value={received} hint="Received through findings packages" tone={received ? 'bad' : 'default'} icon={<Inbox className="size-4" aria-hidden />} />
      </div>
      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          {FAMILIES.map(([k, l]) => (
            <Chip key={k} active={family === k} onClick={() => setFamily(k)} count={k === 'all' ? MODELS.length : MODELS.filter((m) => m.model_family === k).length}>
              {l}
            </Chip>
          ))}
          <span className="mx-1 h-5 w-px bg-line" aria-hidden />
          <Chip active={mine} onClick={() => setMine(!mine)}>
            Owned by my team
          </Chip>
          <div className="relative ml-auto">
            <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-ink-3" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search models" className="h-8 w-56 pl-7" aria-label="Search models" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-line bg-bg/70 text-left text-xs font-medium uppercase tracking-wide text-ink-2">
                <th className="px-4 py-2">ID</th>
                <th className="px-2 py-2">Model</th>
                <th className="px-2 py-2">Regulatory use</th>
                <th className="px-2 py-2">Family</th>
                <th className="px-2 py-2">Tier</th>
                <th className="px-2 py-2">Lifecycle stage</th>
                <th className="px-2 py-2 text-right">Applicable docs</th>
                <th className="px-2 py-2 text-right">Open findings</th>
                <th className="px-4 py-2 text-right">Use case</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const active = activeCase(m.id);
                const stage = active ? 'Use case in progress' : m.lifecycle_stage;
                const href = active ? `/dev/cases/${encodeURIComponent(active.caseId)}` : `/dev/new?model=${m.id}`;
                return (
                  <tr key={m.id} className={cn('border-b border-line/70 last:border-0 hover:bg-bg', m.pilot && 'bg-yellow-100/30')}>
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold text-green-800">{m.id}</td>
                    <td className="px-2 py-2.5">
                      <Link href={href} className="font-medium text-ink hover:text-green-800 hover:underline">
                        {m.name}
                      </Link>
                      {m.pilot && <span className="ml-2 align-middle"><PilotBadge /></span>}
                      <div className="text-xs text-ink-2">{m.portfolio}</div>
                    </td>
                    <td className="px-2 py-2.5 text-ink-2">{m.regulatory_use}</td>
                    <td className="px-2 py-2.5">
                      <FamilyBadge family={m.model_family} />
                    </td>
                    <td className="px-2 py-2.5">
                      <span className="rounded bg-bg px-1.5 py-0.5 text-xs font-semibold">T{m.tier}</span>
                    </td>
                    <td className="px-2 py-2.5">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', lifecycleTone(stage))}>{stage}</span>
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums">{applicableDocs(m).length}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums">{openFindings(m.id) || <span className="text-ink-3">0</span>}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Button asChild size="xs" variant={active ? 'outline' : 'default'}>
                        <Link href={href}>{active ? 'Open use case' : 'Start use case'}</Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
