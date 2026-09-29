'use client';
import { Bot } from 'lucide-react';
import { useProvider } from '@/lib/ai/provider';

export function AiProviderBadgeLight() {
  const live = useProvider((s) => s.live);
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue">
      <Bot className="size-3" aria-hidden /> AI: {live ? 'live' : 'simulated'}
    </span>
  );
}
