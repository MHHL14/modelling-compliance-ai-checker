'use client';
import { Bot, CheckCircle2, CircleSlash, Code2, FileQuestion, Link2, ScrollText, ShieldCheck, TriangleAlert, User, Wrench, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { fmtDateTime } from '@/lib/clock';
import { cn } from '@/lib/utils';
import type { Confidence, LibraryDocument, MitigationType, RowDecision, Verdict } from '@/lib/types';

const pill = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap leading-5';

export const VERDICT_LABEL: Record<Verdict, string> = {
  compliant: 'Compliant',
  partial: 'Partial',
  non_compliant: 'Non-compliant',
  not_found: 'Not found',
  not_applicable: 'Not applicable',
};

const VERDICT_CLASS: Record<Verdict, string> = {
  compliant: 'bg-green-100 text-green-800',
  partial: 'bg-amber-100 text-amber',
  non_compliant: 'bg-red-100 text-red',
  not_found: 'bg-[#e8ebeb] text-ink-2',
  not_applicable: 'border border-[#b9c3c3] text-ink-2 bg-white',
};

const VERDICT_ICON: Record<Verdict, React.ComponentType<{ className?: string }>> = {
  compliant: CheckCircle2,
  partial: TriangleAlert,
  non_compliant: XCircle,
  not_found: FileQuestion,
  not_applicable: CircleSlash,
};

export function VerdictBadge({ verdict, className }: { verdict: Verdict; className?: string }) {
  const Icon = VERDICT_ICON[verdict];
  const badge = (
    <span className={cn(pill, VERDICT_CLASS[verdict], className)}>
      <Icon className="size-3" aria-hidden />
      {VERDICT_LABEL[verdict]}
    </span>
  );
  if (verdict !== 'not_found') return badge;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="rounded-full">{badge}</span>
      </TooltipTrigger>
      <TooltipContent>Not found ≠ non-compliant: evidence may sit in another document</TooltipContent>
    </Tooltip>
  );
}

export function AiDraftBadge({ className }: { className?: string }) {
  return (
    <span className={cn(pill, 'bg-blue-100 text-blue', className)}>
      <Bot className="size-3" aria-hidden /> AI draft
    </span>
  );
}

export function HumanDecisionBadge({ decision, className, compact }: { decision: RowDecision; className?: string; compact?: boolean }) {
  const label = decision.decision === 'accepted' ? 'Accepted' : decision.decision === 'edited' ? 'Edited' : 'Rejected';
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className={cn(pill, 'bg-yellow-100 text-yellow-ink', className)}>
          <User className="size-3" aria-hidden /> {compact ? label : `Human decision · ${label}`}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {decision.by} · {fmtDateTime(decision.at)}
        {decision.reason ? ` · “${decision.reason}”` : ''}
      </TooltipContent>
    </Tooltip>
  );
}

export function ScriptBadge({ result, id, className }: { result?: 'pass' | 'fail' | 'not_run'; id?: string; className?: string }) {
  return (
    <span className={cn(pill, 'bg-script text-[#333]', className)}>
      <Code2 className="size-3" aria-hidden /> Script{id ? ` ${id}` : ''}
      {result && (
        <span className={cn('ml-0.5 font-semibold', result === 'pass' ? 'text-green-800' : result === 'fail' ? 'text-red' : 'text-ink-2')}>
          {result === 'pass' ? 'PASS' : result === 'fail' ? 'FAIL' : 'NOT RUN'}
        </span>
      )}
    </span>
  );
}

export function LineBadge({ line, onDark = true }: { line: '1lod' | '2lod' | 'library' | 'audit'; onDark?: boolean }) {
  const label = { '1lod': '1st line', '2lod': '2nd line', library: 'Library', audit: '3rd line · read-only' }[line];
  const cls = {
    '1lod': 'bg-yellow text-green-900',
    '2lod': 'bg-[#9fc3e6] text-[#12263a]',
    library: 'bg-white text-green-900',
    audit: 'bg-[#e5e7eb] text-[#1f2937]',
  }[line];
  return <span className={cn('rounded px-2 py-0.5 text-xs font-bold tracking-wide uppercase', cls, !onDark && 'ring-1 ring-line')}>{label}</span>;
}

export const CONF_LABEL: Record<Confidence, string> = { high: 'High', medium: 'Medium', low: 'Low' };

export function ConfidencePill({ confidence, className }: { confidence: Confidence; className?: string }) {
  const cls = { high: 'bg-green-50 text-green-800 ring-green-100', medium: 'bg-amber-100/60 text-amber ring-amber-100', low: 'bg-red-100/60 text-red ring-red-100' }[confidence];
  const bars = { high: 3, medium: 2, low: 1 }[confidence];
  return (
    <span className={cn(pill, 'ring-1', cls, className)}>
      <span className="flex items-end gap-px" aria-hidden>
        {[1, 2, 3].map((b) => (
          <span key={b} className={cn('w-[3px] rounded-sm', b <= bars ? 'bg-current' : 'bg-current/25')} style={{ height: 4 + b * 2 }} />
        ))}
      </span>
      {CONF_LABEL[confidence]}
    </span>
  );
}

export const MITIGATION_LABEL: Record<MitigationType, string> = {
  remediation: 'Remediation',
  verification: 'Verification',
  compensating: 'Compensating measure',
  justification: 'Justification',
};
export const MITIGATION_HINT: Record<MitigationType, string> = {
  remediation: 'A gap needs remediation — fix the evidence.',
  verification: 'Low confidence needs verification — reduce the uncertainty.',
  compensating: 'Deficiency that cannot be fixed now — compensate (e.g. MoC).',
  justification: 'Deviation or non-applicability — explain why.',
};
export const MITIGATION_ICON: Record<MitigationType, React.ComponentType<{ className?: string }>> = {
  remediation: Wrench,
  verification: ShieldCheck,
  compensating: Link2,
  justification: ScrollText,
};

export function MitigationBadge({ type, compact = false }: { type: MitigationType; compact?: boolean }) {
  const Icon = MITIGATION_ICON[type];
  const cls = { remediation: 'bg-amber-100 text-amber', verification: 'bg-blue-100 text-blue', compensating: 'bg-[#efe7f7] text-[#5b3a86]', justification: 'bg-[#eceff1] text-ink-2' }[type];
  const el = (
    <span className={cn(pill, cls)}>
      <Icon className="size-3" aria-hidden />
      {!compact && MITIGATION_LABEL[type]}
    </span>
  );
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="rounded-full">{el}</span>
      </TooltipTrigger>
      <TooltipContent>
        {MITIGATION_LABEL[type]} — {MITIGATION_HINT[type]}
      </TooltipContent>
    </Tooltip>
  );
}

export const BINDING_LABEL: Record<LibraryDocument['binding_level'], string> = {
  binding_law: 'Binding law',
  comply_or_explain: 'Comply or explain',
  supervisory_expectation: 'Supervisory expectation',
  internal_mandatory: 'Internal – mandatory',
  reference: 'Reference',
};
export function BindingBadge({ level }: { level: LibraryDocument['binding_level'] }) {
  const cls = {
    binding_law: 'bg-green-800 text-white',
    comply_or_explain: 'bg-green-100 text-green-900',
    supervisory_expectation: 'bg-blue-100 text-blue',
    internal_mandatory: 'bg-yellow-100 text-yellow-ink',
    reference: 'border border-line text-ink-2 bg-white',
  }[level];
  return <span className={cn(pill, cls)}>{BINDING_LABEL[level]}</span>;
}

export function FamilyBadge({ family }: { family: string }) {
  const cls = { statistical: 'bg-green-50 text-green-800', ml: 'bg-blue-100 text-blue', genai: 'bg-[#efe7f7] text-[#5b3a86]', expert: 'bg-amber-100 text-amber' }[family] ?? 'bg-muted';
  const label = { statistical: 'Statistical', ml: 'ML', genai: 'GenAI', expert: 'Expert' }[family] ?? family;
  return <span className={cn(pill, cls)}>{label}</span>;
}

export function SeverityBadge({ severity }: { severity: 'high' | 'medium' | 'low' }) {
  const cls = { high: 'bg-red text-white', medium: 'bg-amber-100 text-amber', low: 'bg-[#e8ebeb] text-ink-2' }[severity];
  return <span className={cn(pill, cls, 'uppercase tracking-wide')}>{severity}</span>;
}

export function PilotBadge() {
  return <span className={cn(pill, 'bg-yellow text-green-900 font-semibold')}>Pilot</span>;
}

export function Chip({ active, onClick, children, count }: { active?: boolean; onClick?: () => void; children: React.ReactNode; count?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors',
        active ? 'border-green-600 bg-green-600 text-white' : 'border-line bg-white text-ink hover:border-green-500 hover:bg-green-50',
      )}
    >
      {children}
      {count !== undefined && <span className={cn('rounded-full px-1.5 text-xs', active ? 'bg-white/20' : 'bg-bg text-ink-2')}>{count}</span>}
    </button>
  );
}
