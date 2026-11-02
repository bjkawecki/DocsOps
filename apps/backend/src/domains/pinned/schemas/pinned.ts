import { z } from 'zod';
import { cuidSchema } from '../../../infrastructure/validation/cuidSchema.js';

export const pinnedScopeTypeSchema = z.enum(['team', 'department', 'company']);

/** Query: GET /pinned – optional filter by scope. */
export const listPinnedQuerySchema = z.object({
  scopeType: pinnedScopeTypeSchema.optional(),
  scopeId: z.string().min(1).optional(),
});

/** Params: pinned item id. */
export const pinnedIdParamSchema = z.object({
  id: cuidSchema,
});

/** Body: Document in Scope anpinnen. */
export const createPinnedBodySchema = z.object({
  scopeType: pinnedScopeTypeSchema,
  scopeId: z.string().min(1),
  documentId: cuidSchema,
  order: z.number().int().min(0).optional(),
});
