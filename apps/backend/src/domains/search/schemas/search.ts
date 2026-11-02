import { z } from 'zod';
import { cuidSchema } from '../../../infrastructure/validation/cuidSchema.js';
import { paginationQuerySchema } from '../../organisation/schemas/organisation.js';

export const searchDocumentsQuerySchema = paginationQuerySchema.extend({
  q: z.string().min(1).max(300),
  contextType: z.enum(['process', 'project']).optional(),
  companyId: cuidSchema.optional(),
  departmentId: cuidSchema.optional(),
  teamId: cuidSchema.optional(),
});
