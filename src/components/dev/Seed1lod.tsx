'use client';
import { useEffect } from 'react';
import { use1lod } from '@/stores/store1lod';

/** Seeds the 1st line store with its use-case history (needs async SHA-256). */
export function Seed1lod() {
  const ensure = use1lod((s) => s.ensureSeed);
  useEffect(() => {
    ensure();
  }, [ensure]);
  return null;
}
