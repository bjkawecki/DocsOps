/**
 * Built-in document types and default templates (ADR 008 / §28b).
 * IDs: type `builtin:<slug>`, default template uses the same id.
 */

export type {
  TemplateSection,
  OftenUsedIn,
  BuiltinDocumentType,
} from './builtinDocumentTemplateTypes.js';
export { localizeBuiltinDocumentType } from './builtinDocumentTemplateTypes.js';

export const BUILTIN_TYPE_PREFIX = 'builtin:';
export const CUSTOM_TYPE_PREFIX = 'custom:';

export function builtinTypeId(slug: string): string {
  return `${BUILTIN_TYPE_PREFIX}${slug}`;
}

export function builtinTemplateId(slug: string): string {
  return builtinTypeId(slug);
}

export function customTypeKey(typeId: string): string {
  return `${CUSTOM_TYPE_PREFIX}${typeId}`;
}

export function parseBuiltinSlug(id: string): string | null {
  if (!id.startsWith(BUILTIN_TYPE_PREFIX)) return null;
  const slug = id.slice(BUILTIN_TYPE_PREFIX.length);
  return slug.length > 0 ? slug : null;
}

export function parseCustomTypeId(key: string): string | null {
  if (!key.startsWith(CUSTOM_TYPE_PREFIX)) return null;
  const id = key.slice(CUSTOM_TYPE_PREFIX.length);
  return id.length > 0 ? id : null;
}

export { BUILTIN_DOCUMENT_TYPES } from './builtinDocumentTemplatesCatalog.js';

import type { BuiltinDocumentType, OftenUsedIn } from './builtinDocumentTemplateTypes.js';
import { BUILTIN_DOCUMENT_TYPES as CATALOG } from './builtinDocumentTemplatesCatalog.js';

const BY_SLUG = new Map(CATALOG.map((entry) => [entry.slug, entry]));

export function getBuiltinDocumentType(slug: string): BuiltinDocumentType | undefined {
  return BY_SLUG.get(slug);
}

export function listBuiltinDocumentTypes(oftenUsedIn?: OftenUsedIn | null): BuiltinDocumentType[] {
  if (oftenUsedIn == null) return [...CATALOG];
  return CATALOG.filter((entry) => entry.oftenUsedIn === oftenUsedIn);
}
