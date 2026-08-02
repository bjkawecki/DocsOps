import type { Prisma, PrismaClient } from '../../../../../generated/prisma/client.js';
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
} from '../../templates/builtinDocumentTemplates.js';
import { templateSectionsToDraftBlocks } from '../../templates/templateSectionsToDraftBlocks.js';
import { canAccessDocumentTemplatesManageUi } from '../../permissions/templatePermissions.js';
import {
  DocumentTemplateNotFoundError,
  DocumentTemplateValidationError,
  parseSectionsJson,
  type DocumentTemplatePublic,
  type DocumentTypePublic,
  type ResolveCreateTemplateResult,
} from './documentTemplateSchemas.js';
import type { TemplateManageScope } from '../../permissions/templatePermissions.js';

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

/** Derive the manage-scope of a custom document type row from its owner columns. */
export function scopeFromCustomRow(row: {
  companyId: string | null;
  departmentId: string | null;
  teamId: string | null;
}): TemplateManageScope {
  if (row.teamId) return { type: 'team', teamId: row.teamId };
  if (row.departmentId) return { type: 'department', departmentId: row.departmentId };
  if (row.companyId) return { type: 'company', companyId: row.companyId };
  return { type: 'platform' };
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
