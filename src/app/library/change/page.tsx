'use client';
import { AlertTriangle, CheckCircle2, GitCompare, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Banner, Card, CardHeader, Kpi, PageHeader } from '@/components/common/ui-bits';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fmtDateTime } from '@/lib/clock';
import { wordDiff } from '@/lib/diff';
import { can } from '@/lib/permissions';
import { getModel, PILOT } from '@/lib/seed';
import { useLibrary } from '@/stores/storeLibrary';

export default function LibraryChange() {
  const lib = useLibrary();
  const [confirm, setConfirm] = useState(false);
  const ch = PILOT.library_change;
  const published = lib.version === ch.to;
  const impact = [...ch.impact].sort((a, b) => b[1] - a[1]);
  const rows = impact.reduce((a, [, n]) => a + n, 0);
  return (
    <div>
      <PageHeader
        eyebrow="Requirement Library"
        title={`Version change v${ch.from} → v${ch.to}`}
        subtitle={`Trigger: ${ch.trigger}`}
        actions={
          published ? (
            <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              <CheckCircle2 className="size-4" aria-hidden /> Published {fmtDateTime(lib.publishedAt)}
            </span>
          ) : (
            <Button className="bg-yellow text-green-900 hover:bg-yellow/85" disabled={!can('library', 'write:library')} onClick={() => setConfirm(true)}>
              <Upload aria-hidden /> Publish v{ch.to}
            </Button>
          )
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Changes" value={ch.changes.length} hint={`${ch.changes.filter((c) => c.type === 'modified').length} modified · ${ch.changes.filter((c) => c.type === 'new').length} new`} />
        <Kpi label="Models affected" value={impact.length} tone="warn" />
        <Kpi label="Assessment rows affected" value={rows} tone="warn" />
        <Kpi label="Status" value={published ? 'Published' : 'Draft'} tone={published ? 'good' : 'default'} />
      </div>
      {published && (
        <Banner tone="warn" icon={<AlertTriangle className="size-4" aria-hidden />} className="mb-4">
          Affected rows in model workspaces are flagged “Needs review — library changed”. Locked requirement sets keep v{ch.from} until they are re-scoped.
        </Banner>
      )}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <GitCompare className="size-4" aria-hidden /> Changes
              </span>
            }
          />
          <ul className="divide-y divide-line">
            {ch.changes.map((c) => (
              <li key={c.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-green-800">{c.id}</span>
                  <span className={c.type === 'new' ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800' : 'rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber'}>
                    {c.type === 'new' ? 'New' : 'Modified'}
                  </span>
                  <span className="text-xs text-ink-2">Source: {c.source}</span>
                </div>
                <p className="mt-2 rounded-lg bg-bg px-3 py-2 text-sm leading-6">
                  {c.type === 'new' ? (
                    <ins className="bg-green-100 text-green-900 no-underline">{c.new}</ins>
                  ) : (
                    wordDiff(c.old ?? '', c.new).map((p, i) =>
                      p.type === 'same' ? (
                        <span key={i}>{p.text}</span>
                      ) : p.type === 'del' ? (
                        <del key={i} className="bg-red-100 text-red">
                          {p.text}
                        </del>
                      ) : (
                        <ins key={i} className="bg-green-100 text-green-900 no-underline">
                          {p.text}
                        </ins>
                      ),
                    )
                  )}
                </p>
                <p className="mt-1.5 text-xs text-ink-2">
                  <strong>Impact note:</strong> {c.impact_note}
                </p>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="h-fit">
          <CardHeader title="Impact across models" subtitle={`${impact.length} models · ${rows} assessment rows`} />
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-bg/70 text-left text-xs font-medium uppercase tracking-wide text-ink-2">
                <th className="px-4 py-2">Model</th>
                <th className="px-2 py-2 text-right">Rows</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {impact.map(([mid, n]) => (
                <tr key={mid} className="border-b border-line/70 last:border-0">
                  <td className="px-4 py-2">
                    <span className="font-mono text-xs text-ink-2">{mid}</span>
                    <div className="text-ink">{getModel(mid)?.name}</div>
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{n}</td>
                  <td className="px-4 py-2">
                    <span className={published ? 'rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber' : 'rounded-full bg-bg px-2 py-0.5 text-xs text-ink-2'}>
                      {published ? 'Needs review' : 'On publication'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish library v{ch.to}?</DialogTitle>
            <DialogDescription>
              {ch.changes.length} changes become effective. {rows} assessment rows across {impact.length} models will be flagged “Needs review — library changed”. This is logged in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                lib.publish(ch.to);
                setConfirm(false);
                toast.success(`Library v${ch.to} published`);
              }}
            >
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
