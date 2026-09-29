'use client';
import { Download, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Card, PageHeader } from '@/components/common/ui-bits';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fmtDateTime } from '@/lib/clock';
import { exportSheets } from '@/lib/excel';
import { can } from '@/lib/permissions';
import { MODELS } from '@/lib/seed';
import { cn } from '@/lib/utils';
import type { Line } from '@/lib/types';
import { useAudit } from '@/stores/storeAudit';

const LINE_LABEL: Record<Line, string> = { '1lod': '1st line', '2lod': '2nd line', library: 'Library', audit: 'Audit' };
const LINE_CLS: Record<Line, string> = { '1lod': 'bg-green-100 text-green-800', '2lod': 'bg-lod2/10 text-lod2', library: 'bg-yellow-100 text-yellow-ink', audit: 'bg-[#e5e7eb] text-[#1f2937]' };
const HIGHLIGHT = /Blind assessment run|Reveal 1st line matrix|package (exported|imported)|Library version published/;

export default function AuditPage() {
  const events = useAudit((s) => (can('audit', 'read:audit') ? s.events : []));
  const [model, setModel] = useState('all');
  const [line, setLine] = useState('all');
  const [type, setType] = useState('all');
  const [q, setQ] = useState('');
  const types = useMemo(() => [...new Set(events.map((e) => e.type))].sort(), [events]);
  const list = [...events]
    .filter((e) => model === 'all' || e.modelId === model)
    .filter((e) => line === 'all' || e.line === line)
    .filter((e) => type === 'all' || e.type === type)
    .filter((e) => !q.trim() || `${e.type} ${e.detail} ${e.actor}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => b.at.localeCompare(a.at));
  return (
    <div>
      <PageHeader
        eyebrow="Audit – 3rd line · read-only"
        title="Audit trail"
        subtitle="Every state-changing action in both lines and the library: runs, decisions, package exports and imports, reveals and publications. Nothing here can be edited."
        actions={
          <Button
            variant="outline"
            onClick={() =>
              exportSheets('Audit-trail.xlsx', [{ name: 'Audit trail', rows: list.map((e) => ({ Timestamp: fmtDateTime(e.at), Line: LINE_LABEL[e.line], Actor: e.actor, Model: e.modelId ?? '', Event: e.type, Detail: e.detail })) }])
            }
          >
            <Download aria-hidden /> Export (.xlsx)
          </Button>
        }
      />
      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="h-8 w-60" aria-label="Model">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All models</SelectItem>
              {MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.id} · {m.name.slice(0, 32)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={line} onValueChange={setLine}>
            <SelectTrigger className="h-8 w-40" aria-label="Line">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All lines</SelectItem>
              {(Object.keys(LINE_LABEL) as Line[]).map((l) => (
                <SelectItem key={l} value={l}>
                  {LINE_LABEL[l]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-8 w-60" aria-label="Event type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All event types</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative ml-auto">
            <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-ink-3" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events" className="h-8 w-56 pl-7" aria-label="Search events" />
          </div>
          <span className="text-xs text-ink-2">{list.length} events</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-line bg-bg/70 text-left text-xs font-medium uppercase tracking-wide text-ink-2">
                <th className="px-4 py-2">Timestamp</th>
                <th className="px-2 py-2">Line</th>
                <th className="px-2 py-2">Actor</th>
                <th className="px-2 py-2">Model</th>
                <th className="px-2 py-2">Event</th>
                <th className="px-4 py-2">Detail</th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id} className={cn('border-b border-line/70 align-top last:border-0', HIGHLIGHT.test(e.type) && 'bg-yellow-100/30')}>
                  <td className="whitespace-nowrap px-4 py-2 font-mono text-xs">{fmtDateTime(e.at)}</td>
                  <td className="px-2 py-2">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', LINE_CLS[e.line])}>{LINE_LABEL[e.line]}</span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-xs">{e.actor}</td>
                  <td className="px-2 py-2 font-mono text-xs">{e.modelId ?? '—'}</td>
                  <td className="px-2 py-2 text-xs font-medium">{e.type}</td>
                  <td className="px-4 py-2 text-xs text-ink-2">{e.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
