'use client';
import { useEffect } from 'react';
import { use2lod } from '@/stores/store2lod';

/** Seeds the 2nd line store with the already-imported MDL-04 package (needs async SHA-256). */
export function Seed2lod() {
  const ensure = use2lod((s) => s.ensureSeed);
  useEffect(() => {
    ensure();
  }, [ensure]);
  return null;
}
