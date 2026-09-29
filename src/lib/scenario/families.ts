import type { Model } from '../types';

export interface FamilyProfile {
  repo: (m: Model) => string;
  scriptId: string;
  scriptLabel: string;
  scriptFailDetail: string;
  evidenceFile: (m: Model) => string;
  evidenceHeading: string;
  replicationDetail: string;
  findingTitle: string;
  findingImpact: string;
  findingChallenge: string;
}

export const shortName = (m: Model) => m.name.replace(/\s*\(.*\)\s*$/, '').trim();

export const FAMILY: Record<Model['model_family'], FamilyProfile> = {
  statistical: {
    repo: (m) => `${m.id.toLowerCase()}-build`,
    scriptId: 'CC-03',
    scriptLabel: 'threshold and segmentation parameters in the build code',
    scriptFailDetail: 'build.py L187: MIN_OBS_SEGMENT = 50 (documented: 100)',
    evidenceFile: (m) => `${shortName(m)} – calibration memo.pdf`,
    evidenceHeading: 'Calibration and conservatism',
    replicationDetail: 'rows and target counts reproduced within 0.2%',
    findingTitle: 'Parameter in build code differs from the documented methodology',
    findingImpact: 'Model outcomes are produced with a parameter that differs from the approved documentation.',
    findingChallenge: 'Since when has the implemented value been used, and which model runs are affected?',
  },
  ml: {
    repo: (m) => `${m.id.toLowerCase()}-training`,
    scriptId: 'CC-07',
    scriptLabel: 'monotonic constraints in the training pipeline',
    scriptFailDetail: 'train.py L96: monotone_constraints missing for "months_in_arrears" (documented: increasing)',
    evidenceFile: (m) => `${shortName(m)} – explainability report.pdf`,
    evidenceHeading: 'Explainability and feature attribution',
    replicationDetail: 'training data reproduced; AUC within 0.3 percentage points',
    findingTitle: 'Monotonic constraint documented but not implemented',
    findingImpact: 'Predictions can move in a direction that contradicts the documented risk logic.',
    findingChallenge: 'Which features lack the documented constraint, and what is the effect on predictions?',
  },
  genai: {
    repo: (m) => `${m.id.toLowerCase()}-assistant`,
    scriptId: 'CC-11',
    scriptLabel: 'guardrail configuration of the deployed assistant',
    scriptFailDetail: 'guardrails.yaml L42: numeric_claims_check = disabled (documented: enabled)',
    evidenceFile: (m) => `${shortName(m)} – guardrail test report.pdf`,
    evidenceHeading: 'Guardrail and groundedness testing',
    replicationDetail: 'evaluation set re-run; groundedness 0.94 against documented 0.95',
    findingTitle: 'Numeric-claims guardrail documented but disabled in deployment',
    findingImpact: 'Drafted credit memos can contain figures that are not grounded in client files.',
    findingChallenge: 'When was the guardrail disabled, and which memos were produced without it?',
  },
  expert: {
    repo: (m) => `${m.id.toLowerCase()}-scoring`,
    scriptId: 'CC-05',
    scriptLabel: 'risk-factor weights in the scoring code',
    scriptFailDetail: 'scoring.sql L63: weight_geography = 0.30 (documented: 0.25)',
    evidenceFile: (m) => `${shortName(m)} – expert panel minutes.pdf`,
    evidenceHeading: 'Expert judgement and approval',
    replicationDetail: 'scores reproduced for all sampled clients',
    findingTitle: 'Risk-factor weight in code differs from the approved methodology',
    findingImpact: 'Risk classification deviates from the approved methodology.',
    findingChallenge: 'Which weights were changed, by whom and with what approval?',
  },
};
