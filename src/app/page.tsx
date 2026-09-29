'use client';
import { ArrowRight, BookOpen, ClipboardCheck, FlaskConical, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { LineBadge } from '@/components/common/badges';
import { LogoMark } from '@/components/shell/Logo';
import { AiProviderBadge, PrototypeFlag } from '@/components/shell/WorkspaceShell';
import { cn } from '@/lib/utils';

const CARDS = [
  {
    href: '/dev', line: '1lod' as const, title: 'Model Development – 1st line', persona: 'Sanne de Vries', role: 'Model Developer, Retail Credit Risk Modelling',
    header: 'bg-green-800', icon: FlaskConical, purpose: 'Scope, draft-check, self-assess and submit models against the locked requirement set.',
  },
  {
    href: '/val', line: '2lod' as const, title: 'Model Validation – 2nd line', persona: 'Pieter Bakker', role: 'Validator, Model Validation – Credit Risk',
    header: 'bg-lod2', icon: ShieldCheck, purpose: 'Independent blind assessment, comparison with the 1st line, findings and validation opinion.',
  },
  {
    href: '/library', line: 'library' as const, title: 'Requirement Library', persona: 'Fatima El Amrani', role: 'Library Owner, Model Risk Management',
    header: 'bg-green-800 border-b-4 border-yellow', icon: BookOpen, purpose: 'Regulatory and internal documents, requirements, candidate requirements and change impact.',
  },
  {
    href: '/audit', line: 'audit' as const, title: 'Audit (read-only)', persona: 'Internal Audit', role: '3rd line of defence',
    header: 'bg-audit', icon: ClipboardCheck, purpose: 'Read-only audit trail across both lines: runs, decisions, packages, reveals and publications.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="bg-green-900 text-white">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-3 px-4">
          <LogoMark />
          <span className="text-[15px] font-semibold">Model Compliance Workbench</span>
          <div className="ml-auto flex items-center gap-2.5">
            <PrototypeFlag />
            <AiProviderBadge />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Choose workspace</h1>
        <p className="mt-2 max-w-3xl text-ink-2">
          AI drafts requirement sets, documentation text, filled matrices and findings — always with a cited source passage, an explained confidence and a proposed mitigating measure.
          Humans decide. The 1st and 2nd line work in strictly separated workspaces and exchange only verified package files.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {CARDS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group overflow-hidden rounded-[12px] border border-line bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline-green-600"
            >
              <div className={cn('flex items-center justify-between px-5 py-4 text-white', c.header)}>
                <span className="flex items-center gap-2.5">
                  <c.icon className="size-5" aria-hidden />
                  <span className="text-lg font-semibold">{c.title}</span>
                </span>
                <LineBadge line={c.line} />
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-ink-2">{c.purpose}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium text-ink">{c.persona}</div>
                    <div className="text-xs text-ink-2">{c.role} · fictional persona</div>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-medium text-green-600 group-hover:gap-2 transition-all">
                    Enter <ArrowRight className="size-4" aria-hidden />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-6 rounded-lg border border-[#f0e19a] bg-yellow-100 px-4 py-3 text-sm text-yellow-ink">
          <strong>Demo only</strong> — in production the workspace follows from your SSO entitlements; users cannot switch between lines.
        </div>
        <p className="mt-10 text-center text-xs text-ink-3">Prototype with illustrative, fictional data. Not affiliated with any bank.</p>
      </main>
    </div>
  );
}
