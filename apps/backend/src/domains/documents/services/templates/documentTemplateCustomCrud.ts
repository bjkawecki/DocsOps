import type { PrismaClient } from '../../../../../generated/prisma/client.js';
import {
  customTypeKey,
  type OftenUsedIn,
  type TemplateSection,
} from '../../templates/builtinDocumentTemplates.js';
import {
  canManageDocumentTemplates,
  type TemplateManageScope,
} from '../../permissions/templatePermissions.js';
import {
  DocumentTemplateForbiddenError,
  DocumentTemplateNotFoundError,
  DocumentTemplateValidationError,
  parseSectionsJson,
  templateSectionsSchema,
  type DocumentTypePublic,
} from './documentTemplateSchemas.js';
import { scopeFromCustomRow } from './documentTemplateQuery.js';

function parseScopeBody(body: {
  scopeType: 'platform' | 'company' | 'department' | 'team';
  scopeId?: string | null;
}): {
  manageScope: TemplateManageScope;
  companyId: string | null;
  departmentId: string | null;
  teamId: string | null;
} {
  if (body.scopeType === 'platform') {
    return {
      manageScope: { type: 'platform' },
      companyId: null,
      departmentId: null,
      teamId: null,
    };
  }
  if (!body.scopeId) {
    throw new DocumentTemplateValidationError('scopeId is required for non-platform scope');
  }
  if (body.scopeType === 'company') {
    return {
      manageScope: { type: 'company', companyId: body.scopeId },
      companyId: body.scopeId,
      departmentId: null,
      teamId: null,
    };
  }
  if (body.scopeType === 'department') {
    return {
      manageScope: { type: 'department', departmentId: body.scopeId },
      companyId: null,
      departmentId: body.scopeId,
      teamId: null,
    };
  }
  return {
    manageScope: { type: 'team', teamId: body.scopeId },
    companyId: null,
    departmentId: null,
    teamId: body.scopeId,
  };
}

export async function createCustomDocumentType(
  prisma: PrismaClient,
  userId: string,
  body: {
    label: string;
    whenToUse: string;
    oftenUsedIn?: OftenUsedIn | null;
    deLabel?: string | null;
    scopeType: 'platform' | 'company' | 'department' | 'team';
    scopeId?: string | null;
    exampleTitle: string;
    sections: TemplateSection[];
  }
): Promise<DocumentTypePublic> {
  const scope = parseScopeBody(body);
  if (!(await canManageDocumentTemplates(prisma, userId, scope.manageScope))) {
    throw new DocumentTemplateForbiddenError('Not allowed to manage document templates');
  }
  const sections = templateSectionsSchema.parse(body.sections);

  const created = await prisma.customDocumentType.create({
    data: {
      label: body.label,
      whenToUse: body.whenToUse,
      oftenUsedIn: body.oftenUsedIn ?? null,
      deLabel: body.deLabel ?? null,
      companyId: scope.companyId,
      departmentId: scope.departmentId,
      teamId: scope.teamId,
      createdById: userId,
      templates: {
        create: {
          exampleTitle: body.exampleTitle,
          whenToUse: body.whenToUse,
          sections,
          isDefault: true,
        },
      },
    },
    include: { templates: { where: { isDefault: true }, take: 1 } },
  });

  const tmpl = created.templates[0];
  if (!tmpl) {
    throw new DocumentTemplateValidationError('Default template missing after create');
  }
  return {
    id: created.id,
    source: 'custom',
    label: created.label,
    deLabel: created.deLabel,
    whenToUse: created.whenToUse,
    deWhenToUse: null,
    oftenUsedIn:
      created.oftenUsedIn === 'process' || created.oftenUsedIn === 'project'
        ? created.oftenUsedIn
        : null,
    documentTypeKey: customTypeKey(created.id),
    defaultTemplateId: tmpl.id,
    exampleTitle: tmpl.exampleTitle,
    deExampleTitle: null,
    sections,
    deSections: null,
    scope: scope.manageScope,
  };
}

export async function updateCustomDocumentType(
  prisma: PrismaClient,
  userId: string,
  typeId: string,
  body: {
    label?: string;
    whenToUse?: string;
    oftenUsedIn?: OftenUsedIn | null;
    deLabel?: string | null;
    exampleTitle?: string;
    sections?: TemplateSection[];
  }
): Promise<DocumentTypePublic> {
  const existing = await prisma.customDocumentType.findFirst({
    where: { id: typeId, deletedAt: null },
    include: { templates: { where: { isDefault: true }, take: 1 } },
  });
  if (!existing) throw new DocumentTemplateNotFoundError(`Unknown type: ${typeId}`);

  const manageScope = scopeFromCustomRow(existing);
  if (!(await canManageDocumentTemplates(prisma, userId, manageScope))) {
    throw new DocumentTemplateForbiddenError('Not allowed to manage document templates');
  }

  const sections =
    body.sections !== undefined ? templateSectionsSchema.parse(body.sections) : undefined;

  const updated = await prisma.customDocumentType.update({
    where: { id: typeId },
    data: {
      ...(body.label !== undefined ? { label: body.label } : {}),
      ...(body.whenToUse !== undefined ? { whenToUse: body.whenToUse } : {}),
      ...(body.oftenUsedIn !== undefined ? { oftenUsedIn: body.oftenUsedIn } : {}),
      ...(body.deLabel !== undefined ? { deLabel: body.deLabel } : {}),
    },
    include: { templates: { where: { isDefault: true }, take: 1 } },
  });

  const tmpl = updated.templates[0];
  if (
    tmpl &&
    (sections !== undefined || body.exampleTitle !== undefined || body.whenToUse !== undefined)
  ) {
    await prisma.customDocumentTemplate.update({
      where: { id: tmpl.id },
      data: {
        ...(body.exampleTitle !== undefined ? { exampleTitle: body.exampleTitle } : {}),
        ...(body.whenToUse !== undefined ? { whenToUse: body.whenToUse } : {}),
        ...(sections !== undefined ? { sections } : {}),
      },
    });
  }

  const refreshed = await prisma.customDocumentType.findUniqueOrThrow({
    where: { id: typeId },
    include: { templates: { where: { isDefault: true }, take: 1 } },
  });
  const defaultTmpl = refreshed.templates[0];
  if (!defaultTmpl) {
    throw new DocumentTemplateValidationError('Default template missing');
  }
  const parsedSections = parseSectionsJson(defaultTmpl.sections);
  return {
    id: refreshed.id,
    source: 'custom',
    label: refreshed.label,
    deLabel: refreshed.deLabel,
    whenToUse: refreshed.whenToUse,
    deWhenToUse: null,
    oftenUsedIn:
      refreshed.oftenUsedIn === 'process' || refreshed.oftenUsedIn === 'project'
        ? refreshed.oftenUsedIn
        : null,
    documentTypeKey: customTypeKey(refreshed.id),
    defaultTemplateId: defaultTmpl.id,
    exampleTitle: defaultTmpl.exampleTitle,
    deExampleTitle: null,
    sections: parsedSections,
    deSections: null,
    scope: manageScope,
  };
}

export async function deleteCustomDocumentType(
  prisma: PrismaClient,
  userId: string,
  typeId: string
): Promise<void> {
  const existing = await prisma.customDocumentType.findFirst({
    where: { id: typeId, deletedAt: null },
  });
  if (!existing) throw new DocumentTemplateNotFoundError(`Unknown type: ${typeId}`);
  const manageScope = scopeFromCustomRow(existing);
  if (!(await canManageDocumentTemplates(prisma, userId, manageScope))) {
    throw new DocumentTemplateForbiddenError('Not allowed to manage document templates');
  }
  await prisma.customDocumentType.update({
    where: { id: typeId },
    data: { deletedAt: new Date() },
  });
}
