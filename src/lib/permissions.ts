// Separation of lines (spec 4.2). Every page and store selector checks `can()`.
export type Workspace = '1lod' | '2lod' | 'library' | 'audit';

export type Action =
  | 'read:store1lod'
  | 'write:store1lod'
  | 'read:store2lod'
  | 'write:store2lod'
  | 'read:library'
  | 'write:library'
  | 'propose:library'
  | 'append:audit'
  | 'read:audit'
  | 'export:submission'
  | 'import:submission'
  | 'export:findings'
  | 'import:findings'
  | 'export:response'
  | 'import:response';

const MATRIX: Record<Workspace, Action[]> = {
  '1lod': [
    'read:store1lod',
    'write:store1lod',
    'read:library',
    'propose:library',
    'append:audit',
    'export:submission',
    'import:findings',
    'export:response',
  ],
  '2lod': [
    'read:store2lod',
    'write:store2lod',
    'read:library',
    'append:audit',
    'import:submission',
    'export:findings',
    'import:response',
  ],
  library: ['read:library', 'write:library', 'append:audit'],
  audit: ['read:audit', 'read:library'],
};

export function can(workspace: Workspace, action: Action): boolean {
  return MATRIX[workspace].includes(action);
}

export class SeparationError extends Error {}

export function assertCan(workspace: Workspace, action: Action) {
  if (!can(workspace, action)) {
    throw new SeparationError(`Workspace "${workspace}" is not allowed to perform "${action}" (separation of lines).`);
  }
}

export const INDEPENDENCE_TOOLTIP =
  'Files, not a shared system: the validator works on a frozen copy that the 1st line can no longer change, and nothing flows back except what the 2nd line explicitly exports.';
