import { z } from 'zod';
import { cuidSchema } from '../../../infrastructure/validation/cuidSchema.js';
import { templateSectionsSchema } from '../services/templates/documentTemplateService.js';

export const listDocumentTypesQuerySchema = z.object({
  contextId: cuidSchema.optional(),
  oftenUsedIn: z.enum(['process', 'project']).optional(),
});

export const createCustomDocumentTypeBodySchema = z.object({
  label: z.string().min(1).max(120),
  whenToUse: z.string().min(1).max(2000),
  oftenUsedIn: z.enum(['process', 'project']).nullable().optional(),
  deLabel: z.string().min(1).max(120).nullable().optional(),
  scopeType: z.enum(['platform', 'company', 'department', 'team']),
  scopeId: cuidSchema.optional().nullable(),
  exampleTitle: z.string().min(1).max(500),
  sections: templateSectionsSchema,
});

export const updateCustomDocumentTypeBodySchema = z
  .object({
    label: z.string().min(1).max(120).optional(),
    whenToUse: z.string().min(1).max(2000).optional(),
    oftenUsedIn: z.enum(['process', 'project']).nullable().optional(),
    deLabel: z.string().min(1).max(120).nullable().optional(),
    exampleTitle: z.string().min(1).max(500).optional(),
    sections: templateSectionsSchema.optional(),
  })
  .refine(
    (body) =>
      body.label !== undefined ||
      body.whenToUse !== undefined ||
      body.oftenUsedIn !== undefined ||
      body.deLabel !== undefined ||
      body.exampleTitle !== undefined ||
      body.sections !== undefined,
    { message: 'At least one field is required' }
  );

export const customDocumentTypeIdParamSchema = z.object({
  typeId: cuidSchema,
});
