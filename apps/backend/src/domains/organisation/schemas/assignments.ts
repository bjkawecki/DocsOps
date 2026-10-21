import { z } from 'zod';
import { cuidSchema } from '../../../infrastructure/validation/cuidSchema.js';

/** Query: Pagination für Zuordnungslisten (limit, offset). Default limit=100. */
export const assignmentListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

/** Params: teamId. */
export const teamIdParamSchema = z.object({
  teamId: cuidSchema,
});

/** Params: companyId. */
export const companyIdParamSchema = z.object({
  companyId: cuidSchema,
});

/** Params: departmentId. */
export const departmentIdParamSchema = z.object({
  departmentId: cuidSchema,
});

/** Params: teamId + userId (z. B. DELETE /teams/:teamId/members/:userId). */
export const teamIdUserIdParamSchema = z.object({
  teamId: cuidSchema,
  userId: cuidSchema,
});

/** Params: companyId + userId (DELETE /companies/:companyId/company-leads/:userId). */
export const companyIdUserIdParamSchema = z.object({
  companyId: cuidSchema,
  userId: cuidSchema,
});

/** Params: departmentId + userId (DELETE /departments/:departmentId/department-leads/:userId). */
export const departmentIdUserIdParamSchema = z.object({
  departmentId: cuidSchema,
  userId: cuidSchema,
});

/** Body: User-Zuordnung (POST members, team-leads, department-leads). */
export const addAssignmentBodySchema = z.object({
  userId: cuidSchema,
});

/** Query: teamId required when demoting a department author back to team member. */
export const demoteDepartmentAuthorQuerySchema = z.object({
  teamId: cuidSchema,
});
