'use client';
import { FileText } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { Citation, ViewerDoc } from '@/lib/types';
import { DocumentPane, type Highlight } from './DocumentPane';

interface Ctx {
  open: (c: Citation, all?: Citation[]) => void;
  docs: ViewerDoc[];
}
const DocViewerContext = createContext<Ctx>({ open: () => {}, docs: [] });

export function DocViewerProvider({ docs, children }: { docs: ViewerDoc[]; children: React.ReactNode }) {
  const [state, setState] = useState<{ c: Citation; all: Citation[]; n: number } | null>(null);
  const open = useCallback((c: Citation, all?: Citation[]) => setState((s) => ({ c, all: all ?? [c], n: (s?.n ?? 0) + 1 })), []);
  const doc = state ? (docs.find((d) => d.id === state.c.doc && d.version === state.c.version) ?? docs.find((d) => d.id === state.c.doc)) : undefined;
  const highlights: Highlight[] = useMemo(
    () =>
      state && doc
        ? state.all.filter((x) => x.doc === doc.id).map((x) => ({ section: x.section, quote: x.quote, kind: 'cite' as const, active: x === state.c }))
        : [],
    [state, doc],
  );
  return (
    <DocViewerContext.Provider value={{ open, docs }}>
      {children}
      <Sheet open={!!state} onOpenChange={(o) => !o && setState(null)}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-[760px]">
          <SheetHeader className="border-b border-line">
            <SheetTitle className="flex items-center gap-2">
              <FileText className="size-4 text-green-600" aria-hidden /> Document viewer
            </SheetTitle>
            <SheetDescription>
              {state ? `${state.c.doc} · v${state.c.version} · §${state.c.section} — cited passage highlighted` : ''}
            </SheetDescription>
          </SheetHeader>
          {doc ? (
            <DocumentPane doc={doc} highlights={highlights} scrollKey={`${state?.n}`} className="h-[calc(100vh-88px)]" />
          ) : (
            <div className="p-8 text-sm text-ink-2">
              Document {state?.c.doc} v{state?.c.version} is not available in this workspace. It may not have been uploaded or included in the package.
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DocViewerContext.Provider>
  );
}

export const useDocViewer = () => useContext(DocViewerContext);

export function CitationQuote({ c, all, docTitle }: { c: Citation; all?: Citation[]; docTitle?: string }) {
  const { open, docs } = useDocViewer();
  const title = docTitle ?? (docs.find((d) => d.id === c.doc && d.version === c.version) ?? docs.find((d) => d.id === c.doc))?.title ?? c.doc;
  return (
    <button
      type="button"
      onClick={() => open(c, all)}
      className="group block w-full rounded-md border-l-4 border-yellow bg-yellow-100/60 px-3 py-2 text-left transition-colors hover:bg-yellow-100"
    >
      <span className="doc-serif block text-[14px] leading-6 text-ink">“{c.quote}”</span>
      <span className="mt-1 flex items-center gap-1 text-xs text-ink-2 group-hover:text-green-800">
        <FileText className="size-3" aria-hidden />
        {title} · v{c.version} · §{c.section} <span className="ml-1 underline-offset-2 group-hover:underline">Open at passage</span>
      </span>
    </button>
  );
}
