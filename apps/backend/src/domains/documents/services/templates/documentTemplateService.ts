/**
 * Barrel for document template services (ADR 008). Split across:
 * - `documentTemplateSchemas.ts` – Zod schemas, public types, error classes
 * - `documentTemplateQuery.ts` – owner-chain, list types/templates, resolve create/typeKey, manage-access
 * - `documentTemplateCustomCrud.ts` – create/update/delete custom document types
 *
 * Re-exported here so existing imports of `documentTemplateService.js` keep working.
 */
import type { ScopeRef } from '../../../organisation/permissions/scopeResolution.js';
import {
  canManageDocumentTemplates,
  type TemplateManageScope,
} from '../../permissions/templatePermissions.js';

export {
  templateSectionSchema,
  templateSectionsSchema,
  DocumentTemplateNotFoundError,
  DocumentTemplateForbiddenError,
  DocumentTemplateValidationError,
} from './documentTemplateSchemas.js';
export type {
  DocumentTypePublic,
  DocumentTemplatePublic,
  ResolveCreateTemplateResult,
} from './documentTemplateSchemas.js';

export {
  resolveOwnerChainForContext,
  listDocumentTypes,
  listDocumentTemplates,
  resolveTemplateForCreate,
  resolveDocumentTypeKey,
  getDocumentTemplatesManageAccess,
} from './documentTemplateQuery.js';

export {
  createCustomDocumentType,
  updateCustomDocumentType,
  deleteCustomDocumentType,
} from './documentTemplateCustomCrud.js';

export { canManageDocumentTemplates };
export type { ScopeRef, TemplateManageScope };
