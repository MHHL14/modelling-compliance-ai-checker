'use client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { nowISO } from '@/lib/clock';
import { PERSONAS } from '@/lib/seed';
import { uid } from '@/lib/rng';
import type { AuditEvent, Line } from '@/lib/types';

// Historical events so the audit trail is never empty (spec 8.14).
const SEED_EVENTS: AuditEvent[] = [
  { id: 'AE-0001', at: '2027-04-18T09:12:00', line: 'library', actor: 'Fatima El Amrani', type: 'Library version published', detail: 'Requirement library v3.2 published (trigger: EBA/GL/2025/01 ESG, internal MRM-POL-001 v5.0).' },
  { id: 'AE-0002', at: '2027-04-22T14:40:00', line: '2lod', actor: 'Pieter Bakker', modelId: 'MDL-04', type: 'Submission package imported', detail: 'SUB-MDL-04-20270422 imported · integrity verified · RS-2027-024 · library v3.2.' },
  { id: 'AE-0003', at: '2027-05-02T10:03:00', line: '1lod', actor: 'Sanne de Vries', modelId: 'MDL-01', type: 'Requirement set proposed', detail: 'AI generated requirement set RS-2027-014 for component “RDS documentation”: 18 proposed, 7 not applicable.' },
  { id: 'AE-0004', at: '2027-05-02T10:26:00', line: '1lod', actor: 'Sanne de Vries', modelId: 'MDL-01', type: 'Requirements accepted', detail: '14 high-confidence requirements accepted after opening a sample of 3.' },
  { id: 'AE-0005', at: '2027-05-06T08:55:00', line: '2lod', actor: 'Pieter Bakker', modelId: 'MDL-04', type: 'Blind assessment run', detail: 'Blind 2nd line assessment run on SUB-MDL-04-20270422 (1st line conclusions: not provided).' },
  { id: 'AE-0006', at: '2027-05-14T15:31:00', line: '1lod', actor: 'Sanne de Vries', modelId: 'MDL-01', type: 'Draft check run', detail: 'Sandbox draft check on RDS v0.5 (no status, no sign-off).' },
  { id: 'AE-0007', at: '2027-05-20T11:18:00', line: 'library', actor: 'Fatima El Amrani', type: 'Candidate requirement approved', detail: 'Candidate from “Supervisory letter IRB roll-out 2027” approved as library requirement REQ-G07.' },
  { id: 'AE-0008', at: '2027-05-28T13:47:00', line: '1lod', actor: 'Sanne de Vries', modelId: 'MDL-01', type: 'Draft check run', detail: 'Sandbox draft check on RDS v0.7: 2 gaps (REQ-D12b, REQ-D12c).' },
  { id: 'AE-0009', at: '2027-06-03T09:30:00', line: '2lod', actor: 'Pieter Bakker', modelId: 'MDL-04', type: 'Reveal 1st line matrix', detail: '1st line matrix revealed after blind assessment (blind assessments locked).' },
  { id: 'AE-0010', at: '2027-06-12T15:02:00', line: '1lod', actor: 'Sanne de Vries', modelId: 'MDL-01', type: 'Document version registered', detail: 'RDS documentation v1.0 registered (approved 12 June 2027 by Head of Retail Credit Risk Modelling).' },
  { id: 'AE-0011', at: '2027-06-12T16:05:00', line: '1lod', actor: 'Sanne de Vries', modelId: 'MDL-01', type: 'Assessment run', detail: 'Self-assessment run RUN-1L-0412 on RDS v1.0 · RS-2027-014 · library v3.2 · provider simulated · 18 requirements.' },
  { id: 'AE-0012', at: '2027-06-13T09:41:00', line: '1lod', actor: 'Sanne de Vries', modelId: 'MDL-01', type: 'Rows accepted', detail: '10 rows accepted (REQ-D01, D08, D12a, D12b, D19, D22, D25, D26, D30, G01).' },
  { id: 'AE-0013', at: '2027-06-13T11:20:00', line: 'audit', actor: 'Internal Audit', type: 'Audit trail reviewed', detail: 'Quarterly sample review of model compliance audit trail (Q2 2027).' },
  { id: 'AE-0014', at: '2027-06-13T14:08:00', line: '2lod', actor: 'Pieter Bakker', modelId: 'MDL-04', type: 'Finding drafted', detail: 'Draft finding on monotonic-constraint evidence for SHAP explanations (not issued).' },
  { id: 'AE-0015', at: '2027-06-13T16:52:00', line: 'library', actor: 'Fatima El Amrani', type: 'Library change drafted', detail: 'Draft v3.3 prepared: ECB guide to internal models v4.0 (credit risk chapter) and CRR3.' },
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
    { name: 'mcw-storeAudit', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);

/** Write-only helper for the line workspaces. */
export const logAudit = (e: Parameters<AuditState['append']>[0]) => useAudit.getState().append(e);
