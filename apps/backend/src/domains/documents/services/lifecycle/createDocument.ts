import type { PrismaClient } from '../../../../../generated/prisma/client.js';
import { emptyBlockDocumentJson } from '../blocks/documentBlocksBackfill.js';
import { documentMarkdownFromRow } from '../query/documentMarkdownSnapshot.js';
import {
  resolveTemplateForCreate,
  DocumentTemplateNotFoundError,
  DocumentTemplateValidationError,
} from '../templates/documentTemplateService.js';

const DOCUMENT_CREATE_SELECT = {
  id: true,
  title: true,
  draftBlocks: true,
  documentTypeKey: true,
  publishedAt: true,
  pdfUrl: true,
  contextId: true,
  createdAt: true,
  updatedAt: true,
  description: true,
  createdById: true,
  createdBy: { select: { name: true } },
  documentTags: { include: { tag: { select: { id: true, name: true } } } },
  currentPublishedVersion: { select: { blocks: true } },
} as const;

export type CreateDocumentInput = {
  title: string;
  contextId?: string | null;
  tagIds?: string[];
  description?: string | null;
  typeId?: string | null;
  templateId?: string | null;
  createdById: string;
  /** User preference locale for built-in template seed language. */
  locale?: string | null;
};

export type CreatedDocumentResponse = {
  id: string;
  title: string;
  draftBlocks: unknown;
  documentTypeKey: string | null;
  publishedAt: Date | null;
  pdfUrl: string | null;
  contextId: string | null;
  createdAt: Date;
  updatedAt: Date;
  description: string | null;
  createdById: string | null;
  createdBy: { name: string } | null;
  createdByName: string | null;
  documentTags: { tag: { id: string; name: string } }[];
  content: string;
  writers: { users: []; teams: []; departments: [] };
};

/**
 * Create a draft document. Template seeds draftBlocks only when templateId is set.
 * Built-in template language follows the creator's preference locale when set.
 */
export async function createDocument(
  prisma: PrismaClient,
  input: CreateDocumentInput
): Promise<CreatedDocumentResponse> {
  let locale = input.locale ?? null;
  if (locale == null) {
    const user = await prisma.user.findUnique({
      where: { id: input.createdById },
      select: { preferences: true },
    });
    const prefs = user?.preferences;
    if (prefs != null && typeof prefs === 'object' && !Array.isArray(prefs)) {
      const raw = (prefs as { locale?: unknown }).locale;
      if (raw === 'en' || raw === 'de') locale = raw;
    }
  }

  const resolved = await resolveTemplateForCreate(prisma, {
    typeId: input.typeId,
    templateId: input.templateId,
    contextId: input.contextId,
    locale,
  });

  const draftBlocks = resolved.draftBlocks ?? emptyBlockDocumentJson();
  const title = input.title.trim();

  const doc = await prisma.document.create({
    data: {
      title,
      draftBlocks,
      documentTypeKey: resolved.documentTypeKey,
      contextId: input.contextId ?? null,
      description: input.description ?? null,
      publishedAt: null,
      createdById: input.createdById,
    },
  });

  const tagIds = input.tagIds ?? [];
  if (tagIds.length > 0 && input.contextId) {
    await prisma.documentTag.createMany({
      data: tagIds.map((tagId) => ({ documentId: doc.id, tagId })),
      skipDuplicates: true,
    });
  }

  const created = await prisma.document.findUniqueOrThrow({
    where: { id: doc.id },
    select: DOCUMENT_CREATE_SELECT,
  });

  return {
    ...created,
    content: documentMarkdownFromRow({
      publishedAt: created.publishedAt,
      draftBlocks: created.draftBlocks,
      currentPublishedVersion: created.currentPublishedVersion,
    }),
    createdByName: created.createdBy?.name ?? null,
    writers: { users: [], teams: [], departments: [] },
  };
}

export { DocumentTemplateNotFoundError, DocumentTemplateValidationError };
