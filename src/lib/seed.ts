import modelsJson from '../../data/models.json';
import documentsJson from '../../data/documents.json';
import pilotJson from '../../data/pilot_seed.json';
import type { LibraryDocument, Model, PilotSeed, Requirement } from './types';

export const MODELS = modelsJson as unknown as Model[];
export const DOCUMENTS = documentsJson as unknown as LibraryDocument[];
export const PILOT = pilotJson as unknown as PilotSeed;

export const PILOT_MODEL_ID = 'MDL-01';
export const PILOT_RS_ID = 'RS-2027-014';
export const LIBRARY_BASE_VERSION = '3.2';

export const getModel = (id: string) => MODELS.find((m) => m.id === id);
export const getDocument = (id: string) => DOCUMENTS.find((d) => d.id === id);

export const PILOT_SHARED_REQS: Requirement[] = PILOT.requirements.filter((r) => r.layer === 'shared');
export const PILOT_VAL_REQS: Requirement[] = PILOT.requirements.filter((r) => r.layer === '2lod');

export function requirementSetIdFor(modelId: string) {
  if (modelId === PILOT_MODEL_ID) return PILOT_RS_ID;
  const n = parseInt(modelId.replace(/\D/g, ''), 10);
  return `RS-2027-${String(20 + n).padStart(3, '0')}`;
}

export const PERSONAS = {
  '1lod': { name: 'Sanne de Vries', role: 'Model Developer', unit: 'Retail Credit Risk Modelling', initials: 'SV' },
  '2lod': { name: 'Pieter Bakker', role: 'Validator', unit: 'Model Validation – Credit Risk', initials: 'PB' },
  library: { name: 'Fatima El Amrani', role: 'Library Owner', unit: 'Model Risk Management', initials: 'FA' },
  audit: { name: 'Internal Audit', role: '3rd line', unit: 'Internal Audit', initials: 'IA' },
} as const;

/** Evidence text made available when these files are uploaded (spec 13.3). */
export const UPLOAD_EVIDENCE: Record<string, { docId: string; title: string; version: string; sections: { section: string; heading: string; text: string }[] }> = {
  'MDD PD-MORT-NL v4.pdf': {
    docId: 'EVD-01-MDD',
    title: 'Model Development Document PD-MORT-NL v4',
    version: '4.0',
    sections: [
      {
        section: '7.2',
        heading: 'Margin of Conservatism',
        text: 'The approximation of the default flag for 2012–2015 is treated as a category A data deficiency. A MoC of +6% relative is applied to the long-run average default rate.',
      },
    ],
  },
  'DoD implementation memo.pdf': {
    docId: 'EVD-01-DODMEMO',
    title: 'Definition of Default implementation memo',
    version: '1.0',
    sections: [
      {
        section: '3',
        heading: 'Probation',
        text: 'After cure, a facility remains in probation for 3 months (12 months for distressed restructurings) before returning to non-default status.',
      },
    ],
  },
};

/** Group label for a requirement in assessment queues: its source document. */
export function sourceGroup(r: Requirement | undefined): string {
  if (!r) return 'Other';
  if (r.layer === 'model_specific') return 'Model-specific requirements';
  return getDocument(r.source_doc)?.title ?? r.source_doc;
}
