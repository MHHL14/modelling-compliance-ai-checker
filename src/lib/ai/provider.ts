'use client';
// AI provider interface. SimulatedProvider is the default; the live provider (Anthropic, via the
// /api/ai route handler) is only used for free-text generation and always falls back to simulated.
import { create } from 'zustand';
import { sleep } from '../rng';

export const PROMPT_TEMPLATE = `SYSTEM: You assess one regulatory requirement against model documentation.
Use ONLY the passages provided. Quote evidence verbatim. If no passage addresses
the requirement, return verdict "not_found". Do not invent numbers.
Return JSON: {verdict, citations[{section, quote}], factors{match,coverage,location,
consistency,verifiability}, factor_notes, rationale, mitigation{type,text}}.
REQUIREMENT: {requirement.id} — {requirement.text} (source: {requirement.article})
PASSAGES: {top-k passages with section ids}`;

// ---- provider status (AI: simulated / AI: live) ----
interface ProviderState {
  live: boolean;
  model?: string;
  checked: boolean;
  check: () => Promise<void>;
}
export const useProvider = create<ProviderState>((set, get) => ({
  live: false,
  checked: false,
  check: async () => {
    if (get().checked) return;
    try {
      const r = await fetch('/api/ai', { method: 'GET' });
      const j = (await r.json()) as { live: boolean; model?: string };
      set({ live: !!j.live, model: j.model, checked: true });
    } catch {
      set({ live: false, checked: true });
    }
  },
}));

export type LiveAction = 'generate_section' | 'extract_requirements' | 'draft_finding' | 'ask_row';

/** Free-text generation: live when configured, otherwise (or on any error) the simulated fallback. */
export async function generateText(action: LiveAction, prompt: string, fallback: () => string): Promise<{ text: string; provider: 'live' | 'simulated' }> {
  if (useProvider.getState().live) {
    try {
      const r = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, prompt }),
      });
      if (r.ok) {
        const j = (await r.json()) as { text?: string };
        if (j.text && j.text.trim()) return { text: j.text.trim(), provider: 'live' };
      }
    } catch {
      /* fall back */
    }
  }
  await sleep(900 + Math.random() * 700);
  return { text: fallback(), provider: 'simulated' };
}

// ---- run progress overlay ----
export interface RunProgressState {
  open: boolean;
  title: string;
  step: string;
  pct: number;
  set: (p: Partial<Omit<RunProgressState, 'set'>>) => void;
}
export const useRunProgress = create<RunProgressState>((set) => ({
  open: false,
  title: '',
  step: '',
  pct: 0,
  set: (p) => set(p),
}));

/** Simulated run mechanics (spec 9.1): 2–4 s with streaming-like progress. */
export async function simulateRun(opts: { title: string; total: number; scripts?: number; label?: string }) {
  const ui = useRunProgress.getState().set;
  const total = Math.max(1, opts.total);
  const budget = 2000 + Math.random() * 1600;
  ui({ open: true, title: opts.title, step: 'Loading requirement set…', pct: 3 });
  await sleep(budget * 0.12);
  ui({ step: 'Retrieving passages…', pct: 12 });
  await sleep(budget * 0.18);
  const per = (budget * 0.55) / total;
  for (let k = 1; k <= total; k++) {
    ui({ step: `${opts.label ?? 'Assessing requirement'} ${k}/${total}…`, pct: 15 + Math.round((k / total) * 70) });
    await sleep(per);
  }
  if (opts.scripts) {
    ui({ step: `Running script checks (${opts.scripts})…`, pct: 90 });
    await sleep(budget * 0.12);
  }
  ui({ step: 'Done', pct: 100 });
  await sleep(250);
  ui({ open: false });
}

export async function simulateShort(title: string, steps: string[], ms = 1400) {
  const ui = useRunProgress.getState().set;
  ui({ open: true, title, step: steps[0], pct: 5 });
  for (let i = 0; i < steps.length; i++) {
    ui({ step: steps[i], pct: Math.round(((i + 1) / steps.length) * 100) });
    await sleep(ms / steps.length);
  }
  ui({ open: false });
}
