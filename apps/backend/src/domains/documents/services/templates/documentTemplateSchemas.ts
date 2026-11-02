import { z } from 'zod';
import type { Prisma } from '../../../../../generated/prisma/client.js';
import type { OftenUsedIn, TemplateSection } from '../../templates/builtinDocumentTemplates.js';
import type { TemplateManageScope } from '../../permissions/templatePermissions.js';

export const templateSectionSchema = z.object({
  heading: z.string().min(1).max(200),
  prompts: z.array(z.string().min(1).max(500)).max(20),
});

export const templateSectionsSchema = z.array(templateSectionSchema).min(1).max(40);

export type DocumentTypePublic = {
  id: string;
  source: 'builtin' | 'custom';
  label: string;
  deLabel: string | null;
  whenToUse: string;
  deWhenToUse: string | null;
  oftenUsedIn: OftenUsedIn | null;
  documentTypeKey: string;
  defaultTemplateId: string | null;
  exampleTitle: string | null;
  deExampleTitle: string | null;
  sections: TemplateSection[];
  deSections: TemplateSection[] | null;
  scope: TemplateManageScope | null;
};

export type DocumentTemplatePublic = {
  id: string;
  source: 'builtin' | 'custom';
  typeId: string;
  documentTypeKey: string;
  label: string;
  whenToUse: string;
  exampleTitle: string;
  sections: TemplateSection[];
  isDefault: boolean;
};

export type ResolveCreateTemplateResult = {
  documentTypeKey: string | null;
  exampleTitle: string | null;
  draftBlocks: Prisma.InputJsonValue | null;
};

export class DocumentTemplateNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DocumentTemplateNotFoundError';
  }
}

export class DocumentTemplateForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DocumentTemplateForbiddenError';
  }
}

export class DocumentTemplateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DocumentTemplateValidationError';
  }
}

/** Parse persisted template sections JSON; invalid/legacy rows fall back to an empty list. */
export function parseSectionsJson(value: unknown): TemplateSection[] {
  const parsed = templateSectionsSchema.safeParse(value);
  if (!parsed.success) return [];
  return parsed.data;
}
