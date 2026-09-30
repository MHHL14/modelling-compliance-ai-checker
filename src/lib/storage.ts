// Browser storage for the workspace stores. With hundreds of requirements per model the stores exceed the
// ~5 MB localStorage quota, so they live in IndexedDB (one key per store). Writes are debounced and flushed
// when the page is hidden. Falls back to localStorage where IndexedDB is not available (tests).
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

const DB = 'mcw';
const STORE = 'kv';
let dbPromise: Promise<IDBDatabase> | null = null;
let blocked = false;
const pending = new Map<string, string>();
let timer: ReturnType<typeof setTimeout> | null = null;

const hasIdb = () => typeof indexedDB !== 'undefined';

function db(): Promise<IDBDatabase> {
  if (!dbPromise)
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return db().then(
    (d) =>
      new Promise((resolve, reject) => {
        const t = d.transaction(STORE, mode);
        const r = fn(t.objectStore(STORE));
        t.oncomplete = () => resolve(r ? r.result : undefined);
        t.onerror = () => reject(t.error);
      }),
  );
}

function flush(): Promise<void> {
  if (timer) clearTimeout(timer);
  timer = null;
  if (blocked || !pending.size) return Promise.resolve();
  const batch = [...pending];
  pending.clear();
  return tx('readwrite', (s) => {
    for (const [k, v] of batch) s.put(v, k);
  }).then(() => undefined);
}

if (typeof window !== 'undefined' && hasIdb()) {
  const onHide = () => void flush();
  window.addEventListener('pagehide', onHide);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && onHide());
}

const idbStorage: StateStorage = {
  getItem: async (name) => (pending.has(name) ? pending.get(name)! : ((await tx<string>('readonly', (s) => s.get(name))) ?? null)),
  setItem: (name, value) => {
    if (blocked) return;
    pending.set(name, value);
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void flush(), 400);
  },
  removeItem: async (name) => {
    pending.delete(name);
    await tx('readwrite', (s) => s.delete(name));
  },
};

export const workspaceStorage = createJSONStorage(() => (hasIdb() ? idbStorage : localStorage));

/** Clears every workspace store (IndexedDB and any legacy localStorage keys). */
export async function clearWorkspaceStorage() {
  blocked = true;
  pending.clear();
  if (timer) clearTimeout(timer);
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith('mcw-')) localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
  if (hasIdb()) await tx('readwrite', (s) => s.clear()).catch(() => undefined);
}
