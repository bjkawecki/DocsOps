import { z } from 'zod';
import {
  PDF_BRANDING_MARGIN_MM_MAX,
  PDF_BRANDING_MARGIN_MM_MIN,
  PDF_LOGO_POSITIONS,
  isValidPdfPrimaryColor,
} from '../../../infrastructure/pdf/pdfBrandingTheme.js';

/** Query: Pagination (limit, offset). */
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Body: Company anlegen. */
export const createCompanyBodySchema = z.object({
  name: z.string().min(1).max(255),
});

/** Body: Company aktualisieren. */
export const updateCompanyBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
});

const pdfPrimaryColorField = z
  .string()
  .refine(isValidPdfPrimaryColor, { message: 'pdfPrimaryColor must be #RRGGBB' });

/** Body: Company PDF branding (ADR 007). Null clears to platform default. */
export const updateCompanyPdfBrandingBodySchema = z
  .object({
    pdfPrimaryColor: pdfPrimaryColorField.nullable().optional(),
    pdfMarginMm: z
      .number()
      .int()
      .min(PDF_BRANDING_MARGIN_MM_MIN)
      .max(PDF_BRANDING_MARGIN_MM_MAX)
      .nullable()
      .optional(),
    pdfLogoPosition: z.enum(PDF_LOGO_POSITIONS).nullable().optional(),
    /** When true, clears stored logo (object deleted by service). */
    clearPdfLogo: z.boolean().optional(),
  })
  .refine(
    (body) =>
      body.pdfPrimaryColor !== undefined ||
      body.pdfMarginMm !== undefined ||
      body.pdfLogoPosition !== undefined ||
      body.clearPdfLogo === true,
    { message: 'At least one branding field is required' }
  );

export type UpdateCompanyPdfBrandingBody = z.infer<typeof updateCompanyPdfBrandingBodySchema>;

/** Body: Department anlegen. */
export const createDepartmentBodySchema = z.object({
  name: z.string().min(1).max(255),
});

/** Body: Department aktualisieren. */
export const updateDepartmentBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
});

/** Body: Team anlegen. */
export const createTeamBodySchema = z.object({
  name: z.string().min(1).max(255),
});

/** Body: Team aktualisieren (Name und/oder Abteilung wechseln). */
export const updateTeamBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  departmentId: z.cuid().optional(),
});

/** Params: companyId. */
export const companyIdParamSchema = z.object({
  companyId: z.cuid(),
});

/** Params: departmentId. */
export const departmentIdParamSchema = z.object({
  departmentId: z.cuid(),
});

/** Params: teamId. */
export const teamIdParamSchema = z.object({
  teamId: z.cuid(),
});
