import { imageSize } from 'image-size';
import type { PrismaClient } from '../../../../generated/prisma/client.js';
import type { StorageService } from '../../../infrastructure/storage/index.js';
import {
  PDF_LOGO_MAX_BYTES,
  isAllowedPdfLogoContentType,
  isValidPdfLogoAspectRatio,
  logoExtensionForContentType,
  type CompanyPdfBrandingRow,
} from '../../../infrastructure/pdf/pdfBrandingTheme.js';
import type { UpdateCompanyPdfBrandingBody } from '../schemas/organisation.js';

export type CompanyPdfBrandingPublic = {
  pdfPrimaryColor: string | null;
  pdfMarginMm: number | null;
  pdfLogoPosition: 'left' | 'right' | null;
  pdfFontFamily: 'sans' | 'serif' | null;
  hasPdfLogo: boolean;
};

export function toCompanyPdfBrandingPublic(row: CompanyPdfBrandingRow): CompanyPdfBrandingPublic {
  const position =
    row.pdfLogoPosition === 'left' || row.pdfLogoPosition === 'right' ? row.pdfLogoPosition : null;
  const fontFamily =
    row.pdfFontFamily === 'sans' || row.pdfFontFamily === 'serif' ? row.pdfFontFamily : null;
  return {
    pdfPrimaryColor: row.pdfPrimaryColor,
    pdfMarginMm: row.pdfMarginMm,
    pdfLogoPosition: position,
    pdfFontFamily: fontFamily,
    hasPdfLogo: row.pdfLogoObjectKey != null && row.pdfLogoObjectKey.length > 0,
  };
}

export async function getCompanyPdfBrandingRow(
  prisma: PrismaClient,
  companyId: string
): Promise<CompanyPdfBrandingRow | null> {
  return prisma.company.findUnique({
    where: { id: companyId },
    select: {
      pdfPrimaryColor: true,
      pdfMarginMm: true,
      pdfLogoObjectKey: true,
      pdfLogoContentType: true,
      pdfLogoPosition: true,
      pdfFontFamily: true,
    },
  });
}

export async function updateCompanyPdfBranding(
  prisma: PrismaClient,
  storage: StorageService | null,
  companyId: string,
  body: UpdateCompanyPdfBrandingBody
): Promise<CompanyPdfBrandingPublic> {
  const current = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      pdfLogoObjectKey: true,
      pdfLogoContentType: true,
      pdfPrimaryColor: true,
      pdfMarginMm: true,
      pdfLogoPosition: true,
      pdfFontFamily: true,
    },
  });
  if (!current) {
    throw new CompanyPdfBrandingNotFoundError(companyId);
  }

  const data: {
    pdfPrimaryColor?: string | null;
    pdfMarginMm?: number | null;
    pdfLogoPosition?: string | null;
    pdfFontFamily?: string | null;
    pdfLogoObjectKey?: string | null;
    pdfLogoContentType?: string | null;
  } = {};

  if (body.pdfPrimaryColor !== undefined) {
    data.pdfPrimaryColor = body.pdfPrimaryColor == null ? null : body.pdfPrimaryColor.toLowerCase();
  }
  if (body.pdfMarginMm !== undefined) {
    data.pdfMarginMm = body.pdfMarginMm;
  }
  if (body.pdfLogoPosition !== undefined) {
    data.pdfLogoPosition = body.pdfLogoPosition;
  }
  if (body.pdfFontFamily !== undefined) {
    data.pdfFontFamily = body.pdfFontFamily;
  }

  if (body.clearPdfLogo === true) {
    if (current.pdfLogoObjectKey && storage) {
      await storage.deleteObject(current.pdfLogoObjectKey);
    }
    data.pdfLogoObjectKey = null;
    data.pdfLogoContentType = null;
  }

  const updated = await prisma.company.update({
    where: { id: companyId },
    data,
    select: {
      pdfPrimaryColor: true,
      pdfMarginMm: true,
      pdfLogoObjectKey: true,
      pdfLogoContentType: true,
      pdfLogoPosition: true,
      pdfFontFamily: true,
    },
  });
  return toCompanyPdfBrandingPublic(updated);
}

export async function uploadCompanyPdfLogo(
  prisma: PrismaClient,
  storage: StorageService,
  companyId: string,
  body: Buffer,
  contentTypeRaw: string
): Promise<CompanyPdfBrandingPublic> {
  const contentType = contentTypeRaw.split(';')[0]?.trim().toLowerCase() ?? '';
  if (!isAllowedPdfLogoContentType(contentType)) {
    throw new CompanyPdfLogoInvalidError('Only PNG and JPEG logos are allowed');
  }
  if (body.length === 0) {
    throw new CompanyPdfLogoInvalidError('Binary body required');
  }
  if (body.length > PDF_LOGO_MAX_BYTES) {
    throw new CompanyPdfLogoInvalidError('Logo too large (max 2 MB)');
  }

  let dimensions: { width?: number; height?: number };
  try {
    dimensions = imageSize(body);
  } catch {
    throw new CompanyPdfLogoInvalidError('Could not read image dimensions');
  }
  const width = dimensions.width ?? 0;
  const height = dimensions.height ?? 0;
  if (!isValidPdfLogoAspectRatio(width, height)) {
    throw new CompanyPdfLogoInvalidError(
      'Logo aspect ratio must be between 2:1 and 6:1 (width:height); recommended 3:1–5:1'
    );
  }

  const current = await prisma.company.findUnique({
    where: { id: companyId },
    select: { pdfLogoObjectKey: true },
  });
  if (!current) {
    throw new CompanyPdfBrandingNotFoundError(companyId);
  }

  const ext = logoExtensionForContentType(contentType);
  const objectKey = `companies/${companyId}/pdf-logo${ext}`;
  await storage.uploadStream(objectKey, body, contentType);

  if (current.pdfLogoObjectKey && current.pdfLogoObjectKey !== objectKey) {
    await storage.deleteObject(current.pdfLogoObjectKey);
  }

  const updated = await prisma.company.update({
    where: { id: companyId },
    data: {
      pdfLogoObjectKey: objectKey,
      pdfLogoContentType: contentType,
    },
    select: {
      pdfPrimaryColor: true,
      pdfMarginMm: true,
      pdfLogoObjectKey: true,
      pdfLogoContentType: true,
      pdfLogoPosition: true,
      pdfFontFamily: true,
    },
  });
  return toCompanyPdfBrandingPublic(updated);
}

export async function deleteCompanyPdfLogo(
  prisma: PrismaClient,
  storage: StorageService | null,
  companyId: string
): Promise<CompanyPdfBrandingPublic> {
  return updateCompanyPdfBranding(prisma, storage, companyId, { clearPdfLogo: true });
}

export class CompanyPdfBrandingNotFoundError extends Error {
  constructor(companyId: string) {
    super(`Company not found: ${companyId}`);
    this.name = 'CompanyPdfBrandingNotFoundError';
  }
}

export class CompanyPdfLogoInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CompanyPdfLogoInvalidError';
  }
}

/**
 * Resolve company id for PDF branding from a document's owner scope.
 * Personal owners and missing context → null (platform default).
 */
export async function resolvePdfBrandingCompanyIdForDocument(
  prisma: PrismaClient,
  documentId: string
): Promise<string | null> {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, deletedAt: null },
    select: {
      context: {
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
                  team: { select: { department: { select: { companyId: true } } } },
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
                  team: { select: { department: { select: { companyId: true } } } },
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
                      team: { select: { department: { select: { companyId: true } } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const owner =
    doc?.context?.process?.owner ??
    doc?.context?.project?.owner ??
    doc?.context?.subcontext?.project?.owner ??
    null;
  if (!owner || owner.ownerUserId != null) return null;
  if (owner.companyId) return owner.companyId;
  if (owner.department?.companyId) return owner.department.companyId;
  if (owner.team?.department?.companyId) return owner.team.department.companyId;
  return null;
}
