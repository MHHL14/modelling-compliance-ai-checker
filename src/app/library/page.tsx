'use client';
import { ExternalLink, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BINDING_LABEL, BindingBadge, Chip } from '@/components/common/badges';
import { Card, Dl, Kpi, PageHeader } from '@/components/common/ui-bits';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { modelsForDoc } from '@/lib/applicability';
import { can } from '@/lib/permissions';
import { DOCUMENTS, getDocument, PILOT } from '@/lib/seed';
import type { LibraryDocument, Requirement } from '@/lib/types';
import { useLibrary } from '@/stores/storeLibrary';

const typeLabel = (t: string) => t.replace(/_/g, ' ').replace(/\b(eu|eba|ecb)\b/g, (m) => m.toUpperCase()).replace(/^\w/, (c) => c.toUpperCase());

export default function LibraryHome() {
  const lib = useLibrary((s) => (can('library', 'read:library') ? s : null));
  const [cat, setCat] = useState<'all' | 'external' | 'internal'>('all');
  const [binding, setBinding] = useState('all');
  const [type, setType] = useState('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<LibraryDocument | null>(null);
  const [rq, setRq] = useState('');

  const types = useMemo(() => [...new Set(DOCUMENTS.map((d) => d.type))].sort(), []);
  const docs = DOCUMENTS.filter((d) => cat === 'all' || d.category === cat)
    .filter((d) => binding === 'all' || d.binding_level === binding)
    .filter((d) => type === 'all' || d.type === type)
    .filter((d) => {
      const ql = q.trim().toLowerCase();
      return !ql || `${d.title} ${d.reference} ${d.issuer} ${d.key_topics.join(' ')}`.toLowerCase().includes(ql);
    });

  const changes = new Map(PILOT.library_change.changes.map((c) => [c.id, c]));
  const published33 = lib?.version === '3.3';
  const reqs: (Requirement & { libStatus: string; text33?: string })[] = [
    ...PILOT.requirements.map((r) => ({ ...r, libStatus: 'Approved', text33: published33 && changes.get(r.id)?.type === 'modified' ? changes.get(r.id)!.new : undefined })),
    ...(published33 ? PILOT.library_change.changes.filter((c) => c.type === 'new').map((c) => ({ id: c.id, text: c.new, source_doc: 'EXT-ECB-GIM', article: c.source, category: 'methodology' as const, check_type: 'ai' as const, applicability_rationale: '', layer: 'shared' as const, libStatus: 'Approved (v3.3)' })) : []),
    ...(lib?.candidates ?? []).filter((c) => c.status !== 'rejected').map((c) => ({ ...c.requirement, libStatus: c.status === 'approved' ? 'Approved (model-specific origin)' : 'Candidate' })),
  ].filter((r) => {
    const ql = rq.trim().toLowerCase();
    return !ql || `${r.id} ${r.text} ${r.article}`.toLowerCase().includes(ql);
  });

  return (
    <div>
      <PageHeader eyebrow={`Requirement Library · v${lib?.version}`} title="Documents & requirements" subtitle="Regulatory and internal sources, and the requirements derived from them, with full traceability." />
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Documents" value={DOCUMENTS.length} hint={`${DOCUMENTS.filter((d) => d.category === 'external').length} external · ${DOCUMENTS.filter((d) => d.category === 'internal').length} internal`} />
        <Kpi label="Library version" value={`v${lib?.version}`} hint={published33 ? 'v3.3 published' : 'Draft v3.3 pending'} />
        <Kpi label="Pilot requirements" value={PILOT.requirements.length} hint="18 shared · 4 validation layer" />
        <Kpi label="Open candidates" value={lib?.candidates.filter((c) => c.status === 'candidate').length ?? 0} tone="warn" />
      </div>
      <Tabs defaultValue="docs">
        <TabsList>
          <TabsTrigger value="docs">Documents ({DOCUMENTS.length})</TabsTrigger>
          <TabsTrigger value="reqs">Requirements</TabsTrigger>
        </TabsList>
        <TabsContent value="docs" className="mt-3">
          <Card>
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
              {(['all', 'external', 'internal'] as const).map((c) => (
                <Chip key={c} active={cat === c} onClick={() => setCat(c)} count={c === 'all' ? DOCUMENTS.length : DOCUMENTS.filter((d) => d.category === c).length}>
                  {c === 'all' ? 'All' : c === 'external' ? 'External' : 'Internal'}
                </Chip>
              ))}
              <Select value={binding} onValueChange={setBinding}>
                <SelectTrigger className="h-8 w-48" aria-label="Binding level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All binding levels</SelectItem>
                  {Object.entries(BINDING_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-8 w-48" aria-label="Document type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {types.map((t) => (
                    <SelectItem key={t} value={t}>
                      {typeLabel(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative ml-auto">
                <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-ink-3" aria-hidden />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or topic" className="h-8 w-60 pl-7" aria-label="Search documents" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-bg/70 text-left text-xs font-medium uppercase tracking-wide text-ink-2">
                    <th className="px-4 py-2">Document</th>
                    <th className="px-2 py-2">Issuer</th>
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">Binding level</th>
                    <th className="px-2 py-2">Version</th>
                    <th className="px-4 py-2 text-right">Applies to</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((d) => (
                    <tr key={d.id} className="cursor-pointer border-b border-line/70 align-top last:border-0 hover:bg-bg" onClick={() => setOpen(d)}>
                      <td className="px-4 py-2.5">
                        <button type="button" className="text-left font-medium text-ink hover:text-green-800 hover:underline" onClick={() => setOpen(d)}>
                          {d.title}
                        </button>
                        <div className="text-xs text-ink-2">{d.reference}</div>
                      </td>
                      <td className="px-2 py-2.5 text-xs text-ink-2">{d.issuer}</td>
                      <td className="px-2 py-2.5 text-xs">{typeLabel(d.type)}</td>
                      <td className="px-2 py-2.5">
                        <BindingBadge level={d.binding_level} />
                      </td>
                      <td className="px-2 py-2.5 text-xs text-ink-2">{d.version_date}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{modelsForDoc(d).length} models</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="reqs" className="mt-3">
          <Card>
            <div className="flex items-center border-b border-line px-4 py-3">
              <p className="text-sm text-ink-2">Pilot requirements and approved model-specific requirements, traced to their source document and article.</p>
              <div className="relative ml-auto">
                <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-ink-3" aria-hidden />
                <Input value={rq} onChange={(e) => setRq(e.target.value)} placeholder="Search requirements" className="h-8 w-60 pl-7" aria-label="Search requirements" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-bg/70 text-left text-xs font-medium uppercase tracking-wide text-ink-2">
                    <th className="px-4 py-2">Requirement</th>
                    <th className="px-2 py-2">Source document → article</th>
                    <th className="px-2 py-2">Layer</th>
                    <th className="px-2 py-2">Check</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reqs.map((r) => (
                    <tr key={r.id} className="border-b border-line/70 align-top last:border-0">
                      <td className="max-w-[420px] px-4 py-2.5">
                        <span className="font-mono text-xs font-semibold text-green-800">{r.id}</span>
                        <p className="mt-0.5">{r.text33 ?? r.text}</p>
                        {r.text33 && <p className="mt-0.5 text-xs text-amber">Modified in v3.3</p>}
                      </td>
                      <td className="px-2 py-2.5 text-xs text-ink-2">
                        {r.source_doc.startsWith('UPLOAD:') ? `Upload: ${r.source_doc.slice(7)}` : (getDocument(r.source_doc)?.title ?? r.source_doc)}
                        <div className="text-ink-3">→ {r.article}</div>
                      </td>
                      <td className="px-2 py-2.5 text-xs">{r.layer === '2lod' ? 'Validation layer' : r.layer === 'model_specific' ? 'Model-specific' : 'Shared'}</td>
                      <td className="px-2 py-2.5 text-xs">{r.check_type === 'script' ? 'Script' : r.check_type === 'ai+script' ? 'AI + script' : 'AI'}</td>
                      <td className="px-4 py-2.5 text-xs">{r.libStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-[560px]">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle>{open.title}</SheetTitle>
                <SheetDescription>
                  {open.issuer} · {open.reference}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-8">
                <div className="flex flex-wrap gap-2">
                  <BindingBadge level={open.binding_level} />
                  <span className="rounded-full bg-bg px-2 py-0.5 text-xs">{open.category === 'external' ? 'External' : 'Internal'}</span>
                  <span className="rounded-full bg-bg px-2 py-0.5 text-xs">Extraction priority: {open.extraction_priority}</span>
                </div>
                <Dl
                  items={[
                    ['ID', <span key="i" className="font-mono">{open.id}</span>],
                    ['Type', typeLabel(open.type)],
                    ['Version', open.version_date],
                    ['Applicability', `any of [${open.applicability.any.join(', ') || 'all models'}]${open.applicability.all.length ? ` and all of [${open.applicability.all.join(', ')}]` : ''}`],
                    ['Notes', open.notes ?? '—'],
                  ]}
                />
                {open.source_url && (
                  <a href={open.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-green-800 underline">
                    <ExternalLink className="size-3.5" aria-hidden /> Official source
                  </a>
                )}
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-2">Key topics</p>
                  <ul className="list-disc space-y-0.5 pl-5 text-sm">
                    {open.key_topics.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-2">Applies to {modelsForDoc(open).length} models</p>
                  <ul className="space-y-1 text-sm">
                    {modelsForDoc(open).map((m) => (
                      <li key={m.id} className="flex gap-2">
                        <span className="font-mono text-xs text-ink-2">{m.id}</span> {m.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
