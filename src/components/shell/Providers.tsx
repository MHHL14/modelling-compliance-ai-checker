'use client';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { RunProgressOverlay } from '@/components/common/RunProgressOverlay';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useProvider } from '@/lib/ai/provider';

/** Stores persist in localStorage; render only after mount to avoid hydration mismatches. */
export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const check = useProvider((s) => s.check);
  useEffect(() => {
    setMounted(true);
    check();
  }, [check]);
  return (
    <TooltipProvider delayDuration={200}>
      {mounted ? children : <div className="min-h-screen bg-bg" aria-busy="true" />}
      <RunProgressOverlay />
      <Toaster position="bottom-right" richColors closeButton toastOptions={{ style: { fontFamily: 'inherit' } }} />
    </TooltipProvider>
  );
}
