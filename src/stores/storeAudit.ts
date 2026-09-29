'use client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { nowISO } from '@/lib/clock';
import { PERSONAS } from '@/lib/seed';
import { uid } from '@/lib/rng';
import type { AuditEvent, Line } from '@/lib/types';

// Historical events so the audit trail is never empty (spec 8.14).
const SEED_EVENTS: AuditEvent[] = [
  // MDL-02 — annual validation 2026 (completed)
  { id: 'AE-0001', at: '2026-05-04T09:00:00', line: '1lod', actor: 'Sanne de Vries', modelId: 'MDL-02', type: 'Use case created', detail: 'LGD Residential Mortgages NL · Full model · Annual validation 2026.' },
  { id: 'AE-0002', at: '2026-05-11T11:30:00', line: '1lod', actor: 'Sanne de Vries', modelId: 'MDL-02', type: 'Requirement set locked', detail: 'RS-2027-022 locked · library v3.2.' },
  { id: 'AE-0003', at: '2026-06-12T10:15:00', line: '1lod', actor: 'Sanne de Vries', modelId: 'MDL-02', type: 'Submission package exported', detail: 'SUB-MDL-02-20260612 frozen and exported.' },
  { id: 'AE-0004', at: '2026-06-19T09:00:00', line: '2lod', actor: 'Pieter Bakker', modelId: 'MDL-02', type: 'Blind assessment run', detail: 'Blind 2nd line run on SUB-MDL-02-20260612 (1st line conclusions: not provided).' },
  { id: 'AE-0005', at: '2026-06-26T11:00:00', line: '2lod', actor: 'Pieter Bakker', modelId: 'MDL-02', type: 'Reveal 1st line matrix', detail: '1st line matrix revealed after blind assessment (blind assessments locked).' },
  { id: 'AE-0006', at: '2026-07-10T14:00:00', line: '2lod', actor: 'Pieter Bakker', modelId: 'MDL-02', type: 'Validation opinion issued', detail: 'Opinion “fit with conditions” issued for SUB-MDL-02-20260612.' },
  { id: 'AE-0007', at: '2026-09-18T15:30:00', line: '2lod', actor: 'Pieter Bakker', modelId: 'MDL-02', type: 'Finding closed', detail: 'All findings for SUB-MDL-02-20260612 closed after verification of remediation.' },
  // MDL-07 — annual review 2026 (completed)
  { id: 'AE-0008', at: '2026-09-01T09:10:00', line: '1lod', actor: 'Sanne de Vries', modelId: 'MDL-07', type: 'Use case created', detail: 'IFRS 9 ECL – Residential Mortgages · Full model · Annual review 2026.' },
  { id: 'AE-0009', at: '2026-09-30T11:00:00', line: '1lod', actor: 'Sanne de Vries', modelId: 'MDL-07', type: 'Submission package exported', detail: 'SUB-MDL-07-20260930 frozen and exported.' },
  { id: 'AE-0010', at: '2026-10-07T09:30:00', line: '2lod', actor: 'Pieter Bakker', modelId: 'MDL-07', type: 'Blind assessment run', detail: 'Blind 2nd line run on SUB-MDL-07-20260930 (1st line conclusions: not provided).' },
  { id: 'AE-0011', at: '2026-10-14T10:00:00', line: '2lod', actor: 'Pieter Bakker', modelId: 'MDL-07', type: 'Reveal 1st line matrix', detail: '1st line matrix revealed after blind assessment (blind assessments locked).' },
  { id: 'AE-0012', at: '2026-11-05T14:00:00', line: '2lod', actor: 'Pieter Bakker', modelId: 'MDL-07', type: 'Validation opinion issued', detail: 'Opinion “fit with conditions” issued for SUB-MDL-07-20260930.' },
  { id: 'AE-0013', at: '2026-12-02T15:00:00', line: '2lod', actor: 'Pieter Bakker', modelId: 'MDL-07', type: 'Finding closed', detail: 'All findings for SUB-MDL-07-20260930 closed after verification of remediation.' },
  // MDL-04 — initial validation 2027 (in progress)
  { id: 'AE-0014', at: '2027-03-01T09:00:00', line: '1lod', actor: 'Sanne de Vries', modelId: 'MDL-04', type: 'Use case created', detail: 'PD Retail SME (gradient boosting) · Full model · Initial validation 2027.' },
  { id: 'AE-0015', at: '2027-03-15T10:00:00', line: '1lod', actor: 'Sanne de Vries', modelId: 'MDL-04', type: 'Requirement set locked', detail: 'RS-2027-024 locked · library v3.2.' },
  { id: 'AE-0016', at: '2027-04-22T11:05:00', line: '1lod', actor: 'Sanne de Vries', modelId: 'MDL-04', type: 'Submission package exported', detail: 'SUB-MDL-04-20270422 frozen and exported.' },
  { id: 'AE-0017', at: '2027-04-22T14:40:00', line: '2lod', actor: 'Pieter Bakker', modelId: 'MDL-04', type: 'Submission package imported', detail: 'SUB-MDL-04-20270422 imported · integrity verified · RS-2027-024 · library v3.2.' },
  { id: 'AE-0018', at: '2027-05-06T08:55:00', line: '2lod', actor: 'Pieter Bakker', modelId: 'MDL-04', type: 'Blind assessment run', detail: 'Blind 2nd line run on SUB-MDL-04-20270422 (1st line conclusions: not provided).' },
  // Library and audit
  { id: 'AE-0019', at: '2027-04-18T09:12:00', line: 'library', actor: 'Fatima El Amrani', type: 'Library version published', detail: 'Requirement library v3.2 published (trigger: EBA/GL/2025/01 ESG, internal MRM-POL-001 v5.0).' },
  { id: 'AE-0020', at: '2027-05-20T11:18:00', line: 'library', actor: 'Fatima El Amrani', type: 'Candidate requirement approved', detail: 'Candidate from “Supervisory letter IRB roll-out 2027” approved as library requirement REQ-G07.' },
  { id: 'AE-0021', at: '2027-06-13T11:20:00', line: 'audit', actor: 'Internal Audit', type: 'Audit trail reviewed', detail: 'Quarterly sample review of model compliance audit trail (Q2 2027).' },
  { id: 'AE-0022', at: '2027-06-13T16:52:00', line: 'library', actor: 'Fatima El Amrani', type: 'Library change drafted', detail: 'Draft v3.3 prepared: ECB guide to internal models v4.0 (credit risk chapter) and CRR3.' },
];

interface AuditState {
  events: AuditEvent[];
  append: (e: { line: Line; modelId?: string; type: string; detail: string; actor?: string }) => void;
}

export const useAudit = create<AuditState>()(
  persist(
    (set) => ({
      events: SEED_EVENTS,
      append: (e) =>
        set((s) => ({
          events: [
            ...s.events,
            { id: uid('AE'), at: nowISO(), actor: e.actor ?? PERSONAS[e.line].name, line: e.line, modelId: e.modelId, type: e.type, detail: e.detail },
          ],
        })),
    }),
    { name: 'mcw-storeAudit', version: 2, storage: createJSONStorage(() => localStorage) },
  ),
);

/** Write-only helper for the line workspaces. */
export const logAudit = (e: Parameters<AuditState['append']>[0]) => useAudit.getState().append(e);
