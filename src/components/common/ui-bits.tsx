import { cn } from '@/lib/utils';

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(0,59,59,0.04)]', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, actions, className }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-3.5', className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: React.ReactNode; title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-xs font-medium uppercase tracking-wider text-ink-3">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <div className="mt-1 text-sm text-ink-2">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Kpi({ label, value, hint, tone = 'default', icon }: { label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: 'default' | 'warn' | 'bad' | 'good'; icon?: React.ReactNode }) {
  const accent = { default: 'bg-green-600', warn: 'bg-amber', bad: 'bg-red', good: 'bg-green-500' }[tone];
  return (
    <Card className="relative overflow-hidden px-4 py-3.5">
      <span className={cn('absolute inset-y-0 left-0 w-1', accent)} aria-hidden />
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-ink-2">
        {label}
        {icon}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-ink">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-ink-3">{hint}</div>}
    </Card>
  );
}

export function EmptyState({ icon, title, children, actions }: { icon?: React.ReactNode; title: string; children?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[12px] border border-dashed border-[#c7d3d2] bg-white px-6 py-12 text-center">
      {icon && <div className="mb-3 rounded-full bg-green-50 p-3 text-green-600">{icon}</div>}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {children && <div className="mt-1 max-w-lg text-sm text-ink-2">{children}</div>}
      {actions && <div className="mt-4 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}

export function Banner({ tone = 'info', icon, children, className }: { tone?: 'info' | 'warn' | 'sandbox' | 'blind' | 'danger' | 'success'; icon?: React.ReactNode; children: React.ReactNode; className?: string }) {
  const cls = {
    info: 'bg-blue-100 text-[#16467c] border-[#c3d8f3]',
    warn: 'bg-amber-100 text-[#7a4a00] border-[#f2d8a8]',
    sandbox: 'bg-yellow-100 text-yellow-ink border-[#f0e19a]',
    blind: 'bg-lod2 text-white border-lod2',
    danger: 'bg-red-100 text-[#8e2a20] border-[#f1c4bd]',
    success: 'bg-green-50 text-green-900 border-green-100',
  }[tone];
  return (
    <div className={cn('flex items-start gap-2.5 rounded-lg border px-4 py-2.5 text-sm', cls, className)} role="status">
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Dl({ items, className }: { items: [React.ReactNode, React.ReactNode][]; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm', className)}>
      {items.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="text-ink-2">{k}</dt>
          <dd className="min-w-0 break-words text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
