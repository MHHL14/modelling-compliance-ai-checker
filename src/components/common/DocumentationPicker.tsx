'use client';
import { FileText, FileUp, Library, Search } from 'lucide-react';
import { useState } from 'react';
import { FileDrop } from '@/components/common/FileDrop';
import { useContent } from '@/components/common/useContent';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { docsOf, draftVersionOf, finalVersionOf, type DocSel } from '@/lib/engine/assess';
import { MODELS } from '@/lib/seed';
import { cn } from '@/lib/utils';
import type { ModelDocument } from '@/lib/content';

const ALL_IDS = MODELS.map((m) => m.id);

function DocRow({ modelId, d, sel, kind, onChange, readOnly }: { modelId: string; d: ModelDocument; sel?: DocSel; kind: 'draft' | 'final'; onChange: (s: DocSel | null) => void; readOnly?: boolean }) {
  const def = (kind === 'draft' ? draftVersionOf(d) : finalVersionOf(d)).version;
  const version = sel?.version ?? def;
  return (
    <li className={cn('flex flex-wrap items-center gap-3 px-3 py-2.5', sel && 'bg-green-50/60')}>
      <Checkbox checked={!!sel} disabled={readOnly} onCheckedChange={(v) => onChange(v ? { modelId, docId: d.id, version } : null)} aria-label={d.title} />
      <FileText className="size-4 shrink-0 text-ink-3" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-ink">{d.title}</span>
        <span className="text-xs text-ink-2">
          {d.type} · {d.owner} · {d.component.map((c) => (c === 'rds' ? 'data' : 'methodology')).join(' and ')}
        </span>
      </span>
      <Select value={version} disabled={readOnly || d.versions.length < 2} onValueChange={(v) => onChange({ modelId, docId: d.id, version: v })}>
        <SelectTrigger className="h-8 w-40 bg-white" aria-label={`Version of ${d.title}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {d.versions.map((v) => (
            <SelectItem key={v.version} value={v.version}>
              v{v.version} · {v.status} · {v.date}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </li>
  );
}

/** The user selects the documentation to assess from the model documentation library, or uploads it (spec §12.5, §12.6). */
export function DocumentationPicker({
  modelId, selection, onChange, kind, readOnly, onUpload, demoFiles, uploads,
}: {
  modelId: string;
  selection: DocSel[];
  onChange: (s: DocSel[]) => void;
  kind: 'draft' | 'final';
  readOnly?: boolean;
  onUpload?: (files: File[]) => void;
  demoFiles?: string[];
  uploads?: { name: string; note: string }[];
}) {
  const [browseAll, setBrowseAll] = useState(false);
  const [q, setQ] = useState('');
  const ready = useContent(browseAll ? ALL_IDS : [modelId]);
  const set = (modelIdOf: string, docId: string, s: DocSel | null) => {
    const rest = selection.filter((x) => !(x.docId === docId && x.modelId === modelIdOf));
    onChange(s ? [...rest, s] : rest);
  };
  const own = docsOf(modelId)?.documents ?? [];
  const others = browseAll && ready ? MODELS.filter((m) => m.id !== modelId) : [];
  const ql = q.trim().toLowerCase();
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-line">
        <div className="flex items-center gap-2 bg-bg/70 px-3 py-2 text-sm font-semibold text-ink">
          <Library className="size-4 text-ink-3" aria-hidden /> Model documentation library — this model
          <span className="ml-auto text-xs font-normal text-ink-2">{selection.filter((s) => s.modelId === modelId).length} of {own.length} selected</span>
        </div>
        <ul className="divide-y divide-line">
          {own.map((d) => (
            <DocRow key={d.id} modelId={modelId} d={d} kind={kind} readOnly={readOnly} sel={selection.find((s) => s.docId === d.id && s.modelId === modelId)} onChange={(s) => set(modelId, d.id, s)} />
          ))}
          {own.length === 0 && <li className="px-3 py-4 text-sm text-ink-2">{ready ? 'No documentation in the library for this model yet. Upload the documents below.' : 'Loading documentation…'}</li>}
        </ul>
      </div>
      {!readOnly && (
        <div className="rounded-lg border border-line">
          <button type="button" onClick={() => setBrowseAll(!browseAll)} className="flex w-full items-center gap-2 bg-bg/70 px-3 py-2 text-left text-sm font-semibold text-ink" aria-expanded={browseAll}>
            <Search className="size-4 text-ink-3" aria-hidden /> Search the documentation of all 20 models
          </button>
          {browseAll && (
            <div className="space-y-2 p-3">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search document title or model" aria-label="Search documentation" />
              {!ready && <p className="text-sm text-ink-2">Loading the documentation library…</p>}
              <ul className="max-h-[360px] divide-y divide-line overflow-y-auto rounded-md border border-line">
                {others.flatMap((m) =>
                  (docsOf(m.id)?.documents ?? [])
                    .filter((d) => !ql || `${d.title} ${m.name} ${m.id}`.toLowerCase().includes(ql))
                    .map((d) => <DocRow key={`${m.id}-${d.id}`} modelId={m.id} d={d} kind={kind} sel={selection.find((s) => s.docId === d.id && s.modelId === m.id)} onChange={(s) => set(m.id, d.id, s)} />),
                )}
              </ul>
            </div>
          )}
        </div>
      )}
      {onUpload && !readOnly && (
        <div className="space-y-2">
          <FileDrop compact label="Upload documentation (PDF, DOCX, TXT, MD)" onFiles={onUpload} />
          {!!demoFiles?.length && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
              <span className="text-ink-3">Demo files:</span>
              {demoFiles.map((n) => (
                <button key={n} type="button" className="flex items-center gap-1 text-green-800 hover:underline" onClick={() => onUpload([new File([new Uint8Array(284_000)], n, { type: 'application/pdf' })])}>
                  <FileUp className="size-3" aria-hidden /> {n}
                </button>
              ))}
            </div>
          )}
          {!!uploads?.length && (
            <ul className="space-y-1 text-xs text-ink-2">
              {uploads.map((u) => (
                <li key={u.name}>
                  <strong className="text-ink">{u.name}</strong> — {u.note}
                </li>
              ))}
            </ul>
          )}
          {!!selection.length && (
            <Button variant="ghost" size="xs" onClick={() => onChange([])}>
              Clear selection
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
