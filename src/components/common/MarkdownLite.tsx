import { Fragment, type ReactNode } from 'react';

/** Renders **bold** and *italic* inline marks. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((p, i) =>
    p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p.startsWith('*') && p.length > 2 ? <em key={i}>{p.slice(1, -1)}</em> : <Fragment key={i}>{p}</Fragment>,
  );
}

const cells = (l: string) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

/** Minimal Markdown renderer for the internal policy and standard texts (headings, paragraphs, lists, tables). */
export function MarkdownLite({ source, className }: { source: string; className?: string }) {
  const lines = source.split('\n');
  const out: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) {
      i++;
      continue;
    }
    const h = l.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const lvl = h[1].length;
      const cls = lvl === 1 ? 'text-lg font-semibold' : lvl === 2 ? 'mt-5 text-base font-semibold' : 'mt-3 text-sm font-semibold';
      out.push(
        <p key={i} className={cls} role="heading" aria-level={lvl + 1}>
          {inline(h[2])}
        </p>,
      );
      i++;
      continue;
    }
    if (l.trim().startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        if (!/^\|?\s*:?-{2,}/.test(lines[i].trim().replace(/^\|/, ''))) rows.push(cells(lines[i]));
        i++;
      }
      const [head, ...body] = rows;
      const blankHead = head.every((c) => !c);
      out.push(
        <div key={i} className="overflow-x-auto">
          <table className="my-2 w-full text-xs">
            {!blankHead && (
              <thead>
                <tr className="border-b border-line bg-bg/70 text-left">
                  {head.map((c, k) => (
                    <th key={k} className="px-2 py-1.5 font-medium">
                      {inline(c)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {body.map((r, k) => (
                <tr key={k} className="border-b border-line/60 align-top">
                  {r.map((c, n) => (
                    <td key={n} className="px-2 py-1.5">
                      {inline(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (/^\s*[-*]\s+/.test(l)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, ''));
      out.push(
        <ul key={i} className="my-1.5 list-disc space-y-0.5 pl-5">
          {items.map((t, k) => (
            <li key={k}>{inline(t)}</li>
          ))}
        </ul>,
      );
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\||\s*[-*]\s)/.test(lines[i])) para.push(lines[i++]);
    out.push(
      <p key={i} className="my-1.5">
        {inline(para.join(' '))}
      </p>,
    );
  }
  return <div className={className}>{out}</div>;
}
