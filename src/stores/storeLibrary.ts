'use client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { nowISO } from '@/lib/clock';
import { LIBRARY_BASE_VERSION } from '@/lib/seed';
import type { Requirement } from '@/lib/types';
import { logAudit } from './storeAudit';

export interface Candidate {
  requirement: Requirement;
  proposedBy: string;
  proposedAt: string;
  fromModel: string;
  fromUpload: string;
  status: 'candidate' | 'approved' | 'rejected';
  rejectReason?: string;
  decidedAt?: string;
}

interface LibraryState {
  version: string;
  publishedAt?: string;
  candidates: Candidate[];
  proposeCandidate: (c: { requirement: Requirement; fromModel: string; fromUpload: string; proposedBy: string }) => void;
  approveCandidate: (id: string) => void;
  rejectCandidate: (id: string, reason: string) => void;
  editCandidate: (id: string, text: string) => void;
  publish: (to: string) => void;
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      version: LIBRARY_BASE_VERSION,
      candidates: [],
      proposeCandidate: ({ requirement, fromModel, fromUpload, proposedBy }) => {
        if (get().candidates.some((c) => c.requirement.id === requirement.id)) return;
        set((s) => ({
          candidates: [
            ...s.candidates,
            { requirement: { ...requirement, status: 'candidate', origin: 'upload' }, proposedBy, proposedAt: nowISO(), fromModel, fromUpload, status: 'candidate' },
          ],
        }));
      },
      approveCandidate: (id) => {
        set((s) => ({
          candidates: s.candidates.map((c) =>
            c.requirement.id === id ? { ...c, status: 'approved', decidedAt: nowISO(), requirement: { ...c.requirement, status: 'approved' } } : c,
          ),
        }));
        logAudit({ line: 'library', type: 'Candidate requirement approved', detail: `${id} approved and added to the library (effective next library version).` });
      },
      rejectCandidate: (id, reason) => {
        set((s) => ({ candidates: s.candidates.map((c) => (c.requirement.id === id ? { ...c, status: 'rejected', rejectReason: reason, decidedAt: nowISO() } : c)) }));
        logAudit({ line: 'library', type: 'Candidate requirement rejected', detail: `${id} rejected: ${reason}` });
      },
      editCandidate: (id, text) => {
        set((s) => ({ candidates: s.candidates.map((c) => (c.requirement.id === id ? { ...c, requirement: { ...c.requirement, text } } : c)) }));
        logAudit({ line: 'library', type: 'Candidate requirement edited', detail: `${id} wording edited by library owner.` });
      },
      publish: (to) => {
        const from = get().version;
        set({ version: to, publishedAt: nowISO() });
        logAudit({ line: 'library', type: 'Library version published', detail: `Requirement library v${from} → v${to} published. Affected rows flagged “Needs review — library changed”.` });
      },
    }),
    { name: 'mcw-storeLibrary', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);
