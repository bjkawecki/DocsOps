/* eslint-disable max-lines -- template list/resolve + custom CRUD (ADR 008) */
import { z } from 'zod';
import type { Prisma, PrismaClient } from '../../../../../generated/prisma/client.js';
import type { ScopeRef } from '../../../organisation/permissions/scopeResolution.js';
import {
  BUILTIN_TYPE_PREFIX,
  builtinTemplateId,
  builtinTypeId,
  customTypeKey,
  getBuiltinDocumentType,
  listBuiltinDocumentTypes,
  localizeBuiltinDocumentType,
  parseBuiltinSlug,
  parseCustomTypeId,
  type OftenUsedIn,
  type TemplateSection,
} from '../../templates/builtinDocumentTemplates.js';
import { templateSectionsToDraftBlocks } from '../../templates/templateSectionsToDraftBlocks.js';
import {
  canAccessDocumentTemplatesManageUi,
  canManageDocumentTemplates,
  type TemplateManageScope,
} from '../../permissions/templatePermissions.js';

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

type OwnerChain = {
  companyId: string | null;
  departmentId: string | null;
  teamId: string | null;
};

/** Owner scope chain for a context (process/project/subcontext). */
export async function resolveOwnerChainForContext(
  prisma: PrismaClient,
  contextId: string
): Promise<OwnerChain | null> {
  const ctx = await prisma.context.findUnique({
    where: { id: contextId },
    select: {
      process: {
        select: {
          owner: {
            select: {
              companyId: true,
              departmentId: true,
              teamId: true,
              ownerUserId: true,
              department: { select: { companyId: true } },
              team: { select: { department: { select: { companyId: true, id: true } } } },
            },
          },
        },
      },
      project: {
        select: {
          owner: {
            select: {
              companyId: true,
              departmentId: true,
              teamId: true,
              ownerUserId: true,
              department: { select: { companyId: true } },
              team: { select: { department: { select: { companyId: true, id: true } } } },
            },
          },
        },
      },
      subcontext: {
        select: {
          project: {
            select: {
              owner: {
                select: {
                  companyId: true,
                  departmentId: true,
                  teamId: true,
                  ownerUserId: true,
                  department: { select: { companyId: true } },
                  team: { select: { department: { select: { companyId: true, id: true } } } },
                },
              },
            },
          },
        },
      },
    },
  });
  const owner =
    ctx?.process?.owner ?? ctx?.project?.owner ?? ctx?.subcontext?.project?.owner ?? null;
  if (!owner || owner.ownerUserId != null) {
    return { companyId: null, departmentId: null, teamId: null };
  }
  const teamId = owner.teamId;
  const departmentId = owner.departmentId ?? owner.team?.department?.id ?? null;
  const companyId =
    owner.companyId ?? owner.department?.companyId ?? owner.team?.department?.companyId ?? null;
  return { companyId, departmentId, teamId };
}

function customTypeWhereForVisibility(
  chain: OwnerChain | null
): Prisma.CustomDocumentTypeWhereInput {
  const or: Prisma.CustomDocumentTypeWhereInput[] = [
    { companyId: null, departmentId: null, teamId: null },
  ];
  if (chain?.companyId) or.push({ companyId: chain.companyId });
  if (chain?.departmentId) or.push({ departmentId: chain.departmentId });
  if (chain?.teamId) or.push({ teamId: chain.teamId });
  return { deletedAt: null, OR: or };
}

function scopeFromCustomRow(row: {
  companyId: string | null;
  departmentId: string | null;
  teamId: string | null;
}): TemplateManageScope {
  if (row.teamId) return { type: 'team', teamId: row.teamId };
  if (row.departmentId) return { type: 'department', departmentId: row.departmentId };
  if (row.companyId) return { type: 'company', companyId: row.companyId };
  return { type: 'platform' };
}

function parseSectionsJson(value: unknown): TemplateSection[] {
  const parsed = templateSectionsSchema.safeParse(value);
  if (!parsed.success) return [];
  return parsed.data;
}

export async function listDocumentTypes(
  prisma: PrismaClient,
  options: { contextId?: string | null; oftenUsedIn?: OftenUsedIn | null } = {}
): Promise<DocumentTypePublic[]> {
  const chain =
    options.contextId != null ? await resolveOwnerChainForContext(prisma, options.contextId) : null;

  const builtins = listBuiltinDocumentTypes(options.oftenUsedIn ?? null).map((b) => {
    const id = builtinTypeId(b.slug);
    return {
      id,
      source: 'builtin' as const,
      label: b.label,
      deLabel: b.deLabel,
      whenToUse: b.whenToUse,
      deWhenToUse: b.deWhenToUse,
      oftenUsedIn: b.oftenUsedIn,
      documentTypeKey: id,
      defaultTemplateId: builtinTemplateId(b.slug),
      exampleTitle: b.exampleTitle,
      deExampleTitle: b.deExampleTitle,
      sections: b.sections,
      deSections: b.deSections,
      scope: null,
    };
  });

  const visibility = customTypeWhereForVisibility(chain);
  const customRows = await prisma.customDocumentType.findMany({
    where: {
      AND: [
        visibility,
        options.oftenUsedIn
          ? {
              OR: [{ oftenUsedIn: options.oftenUsedIn }, { oftenUsedIn: null }],
            }
          : {},
      ],
    },
    include: {
      templates: { where: { isDefault: true }, take: 1 },
    },
    orderBy: { label: 'asc' },
  });

  const customs: DocumentTypePublic[] = customRows.map((row) => {
    const tmpl = row.templates[0] ?? null;
    const sections = tmpl ? parseSectionsJson(tmpl.sections) : [];
    return {
      id: row.id,
      source: 'custom',
      label: row.label,
      deLabel: row.deLabel,
      whenToUse: row.whenToUse,
      deWhenToUse: null,
      oftenUsedIn:
        row.oftenUsedIn === 'process' || row.oftenUsedIn === 'project' ? row.oftenUsedIn : null,
      documentTypeKey: customTypeKey(row.id),
      defaultTemplateId: tmpl?.id ?? null,
      exampleTitle: tmpl?.exampleTitle ?? null,
      deExampleTitle: null,
      sections,
      deSections: null,
      scope: scopeFromCustomRow(row),
    };
  });

  return [...builtins, ...customs];
}

export async function listDocumentTemplates(
  prisma: PrismaClient,
  options: { contextId?: string | null; oftenUsedIn?: OftenUsedIn | null } = {}
): Promise<DocumentTemplatePublic[]> {
  const types = await listDocumentTypes(prisma, options);
  const out: DocumentTemplatePublic[] = [];
  for (const type of types) {
    if (!type.defaultTemplateId) continue;
    out.push({
      id: type.defaultTemplateId,
      source: type.source,
      typeId: type.id,
      documentTypeKey: type.documentTypeKey,
      label: type.label,
      whenToUse: type.whenToUse,
      exampleTitle: type.exampleTitle ?? type.label,
      sections: type.sections,
      isDefault: true,
    });
  }
  return out;
}

/**
 * Resolve type/template for document create.
 * draftBlocks only when templateId is set.
 */
export async function resolveTemplateForCreate(
  prisma: PrismaClient,
  input: {
    typeId?: string | null;
    templateId?: string | null;
    contextId?: string | null;
    /** User preference locale (`en` | `de`); selects built-in DE catalog fields when `de`. */
    locale?: string | null;
  }
): Promise<ResolveCreateTemplateResult> {
  const templateId = input.templateId?.trim() || null;
  const typeId = input.typeId?.trim() || null;

  if (templateId == null && typeId == null) {
    return { documentTypeKey: null, exampleTitle: null, draftBlocks: null };
  }

  const chain =
    input.contextId != null ? await resolveOwnerChainForContext(prisma, input.contextId) : null;

  if (templateId != null) {
    const builtinSlug = parseBuiltinSlug(templateId);
    if (builtinSlug != null) {
      const builtin = getBuiltinDocumentType(builtinSlug);
      if (!builtin) throw new DocumentTemplateNotFoundError(`Unknown template: ${templateId}`);
      if (typeId != null && typeId !== builtinTypeId(builtinSlug)) {
        throw new DocumentTemplateValidationError('templateId does not match typeId');
      }
      const localized = localizeBuiltinDocumentType(builtin, input.locale);
      return {
        documentTypeKey: builtinTypeId(builtinSlug),
        exampleTitle: localized.exampleTitle,
        draftBlocks: templateSectionsToDraftBlocks(localized.sections),
      };
    }

    const tmpl = await prisma.customDocumentTemplate.findFirst({
      where: {
        id: templateId,
        type: { deletedAt: null, ...customTypeWhereForVisibility(chain) },
      },
      include: { type: true },
    });
    if (!tmpl) throw new DocumentTemplateNotFoundError(`Unknown template: ${templateId}`);
    if (typeId != null && typeId !== tmpl.typeId) {
      throw new DocumentTemplateValidationError('templateId does not match typeId');
    }
    const sections = parseSectionsJson(tmpl.sections);
    if (sections.length === 0) {
      throw new DocumentTemplateValidationError('Template sections are invalid');
    }
    return {
      documentTypeKey: customTypeKey(tmpl.typeId),
      exampleTitle: tmpl.exampleTitle,
      draftBlocks: templateSectionsToDraftBlocks(sections),
    };
  }

  // typeId only – metadata, no seed
  const key = await resolveDocumentTypeKey(prisma, typeId, chain);
  return { documentTypeKey: key, exampleTitle: null, draftBlocks: null };
}

export async function resolveDocumentTypeKey(
  prisma: PrismaClient,
  typeId: string | null,
  chain: OwnerChain | null = null
): Promise<string | null> {
  if (typeId == null || typeId === '') return null;

  const builtinSlug = parseBuiltinSlug(typeId);
  if (builtinSlug != null) {
    const builtin = getBuiltinDocumentType(builtinSlug);
    if (!builtin) throw new DocumentTemplateNotFoundError(`Unknown type: ${typeId}`);
    return builtinTypeId(builtinSlug);
  }

  // Accept either raw cuid or custom:<cuid>
  const customId =
    parseCustomTypeId(typeId) ?? (typeId.startsWith(BUILTIN_TYPE_PREFIX) ? null : typeId);
  if (!customId) throw new DocumentTemplateNotFoundError(`Unknown type: ${typeId}`);

  const row = await prisma.customDocumentType.findFirst({
    where: { id: customId, deletedAt: null, ...customTypeWhereForVisibility(chain) },
    select: { id: true },
  });
  if (!row) throw new DocumentTemplateNotFoundError(`Unknown type: ${typeId}`);
  return customTypeKey(row.id);
}

export async function getDocumentTemplatesManageAccess(
  prisma: PrismaClient,
  userId: string
): Promise<{ canManage: boolean }> {
  return { canManage: await canAccessDocumentTemplatesManageUi(prisma, userId) };
}

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

export { canManageDocumentTemplates };
export type { ScopeRef, TemplateManageScope };
