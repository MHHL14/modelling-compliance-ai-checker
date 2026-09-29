import * as XLSX from 'xlsx';

export function exportSheets(fileName: string, sheets: { name: string; rows: Record<string, string | number | null | undefined>[] }[]) {
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    const ws = XLSX.utils.json_to_sheet(s.rows);
    const headers = Object.keys(s.rows[0] ?? {});
    ws['!cols'] = headers.map((h) => ({ wch: Math.min(60, Math.max(h.length + 2, ...s.rows.map((r) => String(r[h] ?? '').length / 2))) }));
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  }
  XLSX.writeFile(wb, fileName);
}
