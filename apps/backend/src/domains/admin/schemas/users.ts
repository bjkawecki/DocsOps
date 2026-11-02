import { z } from 'zod';
import { cuidSchema } from '../../../infrastructure/validation/cuidSchema.js';

/** Sortable fields for GET /admin/users (DB columns + relation-based). */
export const adminUsersSortBySchema = z.enum([
  'name',
  'email',
  'isAdmin',
  'deletedAt',
  'role',
  'teams',
  'departments',
]);

/** Query: GET /admin/users – Pagination + Filter + Suche + Sortierung. */
export const listUsersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  includeDeactivated: z.coerce.boolean().optional().default(false),
  search: z.string().min(1).max(255).optional(),
  sortBy: adminUsersSortBySchema.optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

/** Body: POST /admin/users – Nutzer anlegen. */
export const createUserBodySchema = z
  .object({
    name: z.string().min(1).max(255),
    email: z.email(),
    password: z.string().min(8).max(255),
    isAdmin: z.boolean().optional().default(false),
    isKnowledgeManager: z.boolean().optional().default(false),
  })
  .superRefine((body, ctx) => {
    if (body.isAdmin && body.isKnowledgeManager) {
      ctx.addIssue({
        code: 'custom',
        message: 'A user cannot be both platform administrator and knowledge manager.',
        path: ['isKnowledgeManager'],
      });
    }
  });

/** Body: PATCH /admin/users/:userId – Nutzer bearbeiten / Deaktivierung / Reaktivierung. */
export const updateUserBodySchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    email: z.email().nullable().optional(),
    isAdmin: z.boolean().optional(),
    isKnowledgeManager: z.boolean().optional(),
    deletedAt: z.union([z.iso.datetime(), z.null()]).optional(),
  })
  .superRefine((body, ctx) => {
    if (body.isAdmin === true && body.isKnowledgeManager === true) {
      ctx.addIssue({
        code: 'custom',
        message: 'A user cannot be both platform administrator and knowledge manager.',
        path: ['isKnowledgeManager'],
      });
    }
  });

/** Body: PUT /admin/users/:userId/knowledge-manager-scopes – replace assigned scopes. */
export const knowledgeManagerScopesBodySchema = z.object({
  companyIds: z.array(cuidSchema).default([]),
  departmentIds: z.array(cuidSchema).default([]),
  teamIds: z.array(cuidSchema).default([]),
});

/** Body: POST /admin/users/:userId/reset-password. */
export const resetPasswordBodySchema = z.object({
  newPassword: z.string().min(8).max(255),
});

/** Params: userId. */
export const userIdParamSchema = z.object({
  userId: cuidSchema,
});

/** Query: GET /admin/users/:userId/documents – Pagination + optional search. */
export const listUserDocumentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().min(1).max(255).optional(),
});
