'use client';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { RunProgressOverlay } from '@/components/common/RunProgressOverlay';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useProvider } from '@/lib/ai/provider';
import { use1lod } from '@/stores/store1lod';
import { use2lod } from '@/stores/store2lod';
import { useAudit } from '@/stores/storeAudit';
import { useLibrary } from '@/stores/storeLibrary';

const STORES = [use1lod, use2lod, useAudit, useLibrary];

/** Stores persist in IndexedDB (async); render only after every store has hydrated. */
export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const check = useProvider((s) => s.check);
  useEffect(() => {
    check();
    const done = () => STORES.every((st) => st.persist.hasHydrated());
    if (done()) {
      setMounted(true);
      return;
    }
    const unsubs = STORES.map((st) => st.persist.onFinishHydration(() => done() && setMounted(true)));
    return () => unsubs.forEach((u) => u());
  }, [check]);
  return (
    <TooltipProvider delayDuration={200}>
      {mounted ? children : <div className="min-h-screen bg-bg" aria-busy="true" />}
      <RunProgressOverlay />
      <Toaster position="bottom-right" richColors closeButton toastOptions={{ style: { fontFamily: 'inherit' } }} />
    </TooltipProvider>
  );
}
