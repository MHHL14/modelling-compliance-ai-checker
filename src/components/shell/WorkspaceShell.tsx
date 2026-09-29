'use client';
import { Bot, ChevronDown, LayoutGrid, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LineBadge } from '@/components/common/badges';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useProvider } from '@/lib/ai/provider';
import type { Workspace } from '@/lib/permissions';
import { resetDemoData } from '@/lib/reset';
import { PERSONAS } from '@/lib/seed';
import { cn } from '@/lib/utils';
import { LogoMark } from './Logo';

const WS: Record<Workspace, { name: string; header: string; nav: { href: string; label: string; exact?: boolean }[] }> = {
  '1lod': { name: 'Model Development', header: 'bg-green-800', nav: [{ href: '/dev', label: 'My models' }] },
  '2lod': { name: 'Model Validation', header: 'bg-lod2', nav: [{ href: '/val', label: 'Validation inbox' }] },
  library: {
    name: 'Requirement Library',
    header: 'bg-green-800 border-b-4 border-yellow',
    nav: [
      { href: '/library', label: 'Documents & requirements', exact: true },
      { href: '/library/candidates', label: 'Candidates' },
      { href: '/library/change', label: 'Version change' },
    ],
  },
  audit: { name: 'Audit', header: 'bg-audit', nav: [{ href: '/audit', label: 'Audit trail' }] },
};

export function AiProviderBadge() {
  const { live, model } = useProvider();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="inline-flex items-center gap-1 rounded-full bg-white/12 px-2 py-0.5 text-xs font-medium text-white ring-1 ring-white/25">
          <Bot className="size-3" aria-hidden /> AI: {live ? 'live' : 'simulated'}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        {live
          ? `Live provider (${model}) used for free-text generation; assessments use the simulated engine. Falls back to simulated on error.`
          : 'Simulated provider: deterministic seed results with realistic latency. Set ANTHROPIC_API_KEY to enable live free-text generation.'}
      </TooltipContent>
    </Tooltip>
  );
}

export function PrototypeFlag({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded bg-yellow px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-green-900', className)}>
      Prototype · illustrative data
    </span>
  );
}

export function UserMenu({ workspace }: { workspace: Workspace }) {
  const p = PERSONAS[workspace];
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-left text-white hover:bg-white/10 focus-visible:outline-white">
            <span className="flex size-8 items-center justify-center rounded-full bg-white/15 text-xs font-semibold ring-1 ring-white/30">{p.initials}</span>
            <span className="hidden leading-tight xl:block">
              <span className="block text-sm font-medium">{p.name}</span>
              <span className="block text-[11px] text-white/75">{p.role}</span>
            </span>
            <ChevronDown className="size-4 text-white/70" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <div className="text-sm font-semibold">{p.name}</div>
            <div className="text-xs font-normal text-ink-2">
              {p.role} · {p.unit}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/">
              <LayoutGrid aria-hidden /> Switch workspace
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setConfirm(true)}>
            <RotateCcw aria-hidden /> Reset demo data
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset demo data?</DialogTitle>
            <DialogDescription>
              Clears all four workspace stores (1st line, 2nd line, library, audit) in this browser and reloads the seed data. The pilot returns to Stage 3 with 10 rows accepted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={resetDemoData}>
              <RotateCcw aria-hidden /> Reset demo data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function WorkspaceShell({ workspace, children }: { workspace: Workspace; children: React.ReactNode }) {
  const ws = WS[workspace];
  const path = usePathname();
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className={cn('no-print sticky top-0 z-40 text-white shadow-sm', ws.header)}>
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 lg:px-6">
          <Link href="/" className="flex items-center gap-2.5 rounded-md focus-visible:outline-white" aria-label="Model Compliance Workbench — choose workspace">
            <LogoMark />
            <span className="hidden text-[15px] font-semibold tracking-tight md:block">Model Compliance Workbench</span>
          </Link>
          <span className="mx-1 hidden h-6 w-px bg-white/25 md:block" aria-hidden />
          <span className="flex items-center gap-2">
            <span className="text-sm font-medium text-white/95">{ws.name}</span>
            <LineBadge line={workspace} />
          </span>
          <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Workspace">
            {ws.nav.map((n) => {
              const active = n.exact ? path === n.href : path.startsWith(n.href);
              return (
                <Link key={n.href} href={n.href} className={cn('rounded-md px-2.5 py-1.5 text-sm text-white/85 hover:bg-white/10 hover:text-white', active && 'bg-white/15 text-white')}>
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2.5">
            <PrototypeFlag className="hidden sm:inline-flex" />
            <AiProviderBadge />
            <UserMenu workspace={workspace} />
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden" aria-label="Workspace (compact)">
          {ws.nav.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-md px-2.5 py-1 text-sm text-white/90 hover:bg-white/10">
              {n.label}
            </Link>
          ))}
          <PrototypeFlag className="sm:hidden" />
        </nav>
      </header>
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 lg:px-6">{children}</main>
      <footer className="no-print border-t border-line bg-white/60 py-3 text-center text-xs text-ink-3">
        Model Compliance Workbench — prototype with illustrative, fictional data. Not affiliated with any bank. AI drafts; humans decide.
      </footer>
    </div>
  );
}
