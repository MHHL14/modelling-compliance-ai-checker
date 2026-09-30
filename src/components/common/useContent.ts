'use client';
import { useEffect, useState } from 'react';
import { libraryLoaded, loadContent, modelDocsLoaded } from '@/lib/content';

/** Loads the requirement library and the documentation of the given models; returns true when ready. */
export function useContent(modelIds: string[]): boolean {
  const key = [...modelIds].sort().join(',');
  const isReady = () => libraryLoaded() && modelIds.every(modelDocsLoaded);
  const [ready, setReady] = useState(isReady);
  useEffect(() => {
    let alive = true;
    if (isReady()) {
      setReady(true);
      return;
    }
    setReady(false);
    loadContent(key ? key.split(',') : []).then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return ready;
}
