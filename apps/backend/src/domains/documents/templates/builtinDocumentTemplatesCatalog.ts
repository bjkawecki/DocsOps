import type { BuiltinDocumentType } from './builtinDocumentTemplateTypes.js';
import { PROCESS_BUILTIN_TYPES } from './catalog/processBuiltinTypes.js';
import { PROJECT_BUILTIN_TYPES } from './catalog/projectBuiltinTypes.js';

/** Platform built-in catalog (SSoT for labels/sections, EN + DE). */
export const BUILTIN_DOCUMENT_TYPES: readonly BuiltinDocumentType[] = [
  ...PROCESS_BUILTIN_TYPES,
  ...PROJECT_BUILTIN_TYPES,
];
