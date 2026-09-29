// Demo clock. The pilot story is set in June 2027 (RDS v1.0 approved 12 June 2027), so the
// prototype pins the calendar date to 2027-06-14 and uses the real time of day.
export const DEMO_DATE = '2027-06-14';

export function nowISO(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${DEMO_DATE}T${hh}:${mm}:${ss}.${ms}`;
}

export function compactDate(iso: string = nowISO()) {
  return iso.slice(0, 10).replace(/-/g, '');
}

export function fmtDateTime(iso?: string) {
  if (!iso) return '—';
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}

export function fmtDate(iso?: string) {
  if (!iso) return '—';
  return iso.slice(0, 10);
}
