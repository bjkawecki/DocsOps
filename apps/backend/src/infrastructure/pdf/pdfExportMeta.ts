import type { PrismaClient } from '../../../generated/prisma/client.js';

/**
 * Resolve scope-lead display names for the document's owner unit at export time.
 * Personal owner → that user; org owner → leads of company/department/team.
 */
export async function resolveDocumentPdfResponsibleNames(
  prisma: PrismaClient,
  documentId: string
): Promise<string[]> {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, deletedAt: null },
    select: {
      context: {
        select: {
          process: {
            select: {
              owner: {
                select: {
                  ownerUserId: true,
                  companyId: true,
                  departmentId: true,
                  teamId: true,
                  ownerUser: { select: { name: true } },
                },
              },
            },
          },
          project: {
            select: {
              owner: {
                select: {
                  ownerUserId: true,
                  companyId: true,
                  departmentId: true,
                  teamId: true,
                  ownerUser: { select: { name: true } },
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
                      ownerUserId: true,
                      companyId: true,
                      departmentId: true,
                      teamId: true,
                      ownerUser: { select: { name: true } },
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
  if (!owner) return [];

  if (owner.ownerUserId != null) {
    const name = owner.ownerUser?.name?.trim();
    return name ? [name] : [];
  }

  if (owner.teamId) {
    const leads = await prisma.teamLead.findMany({
      where: { teamId: owner.teamId },
      select: { user: { select: { name: true } } },
      orderBy: { user: { name: 'asc' } },
    });
    return leads.map((l) => l.user.name.trim()).filter(Boolean);
  }

  if (owner.departmentId) {
    const leads = await prisma.departmentLead.findMany({
      where: { departmentId: owner.departmentId },
      select: { user: { select: { name: true } } },
      orderBy: { user: { name: 'asc' } },
    });
    return leads.map((l) => l.user.name.trim()).filter(Boolean);
  }

  if (owner.companyId) {
    const leads = await prisma.companyLead.findMany({
      where: { companyId: owner.companyId },
      select: { user: { select: { name: true } } },
      orderBy: { user: { name: 'asc' } },
    });
    return leads.map((l) => l.user.name.trim()).filter(Boolean);
  }

  return [];
}

export type PdfMetaLocale = 'en' | 'de';

/** Explicit preference locale, or null when unset. */
export function localeFromPreferences(preferences: unknown): PdfMetaLocale | null {
  if (preferences != null && typeof preferences === 'object' && !Array.isArray(preferences)) {
    const locale = (preferences as { locale?: unknown }).locale;
    if (locale === 'de' || locale === 'en') return locale;
  }
  return null;
}

/** First supported tag in an Accept-Language header, or null. */
export function localeFromAcceptLanguage(header: string | undefined | null): PdfMetaLocale | null {
  if (header == null || header.trim() === '') return null;
  for (const part of header.split(',')) {
    const tag = part.split(';')[0]?.trim().toLowerCase();
    if (!tag) continue;
    const base = tag.split('-')[0];
    if (base === 'de' || base === 'en') return base;
  }
  return null;
}

/**
 * Locale for PDF meta line at enqueue time.
 * Order matches UI: request body → preferences → Accept-Language → en.
 */
export function resolvePdfExportLocale(input: {
  bodyLocale?: string | null;
  preferences?: unknown;
  acceptLanguage?: string | null;
}): PdfMetaLocale {
  if (input.bodyLocale === 'de' || input.bodyLocale === 'en') return input.bodyLocale;
  const fromPref = localeFromPreferences(input.preferences);
  if (fromPref != null) return fromPref;
  const fromHeader = localeFromAcceptLanguage(input.acceptLanguage);
  if (fromHeader != null) return fromHeader;
  return 'en';
}

/** Locale for PDF meta line from user preferences; default English. */
export function resolvePdfMetaLocale(preferences: unknown): PdfMetaLocale {
  return localeFromPreferences(preferences) ?? 'en';
}

/** Format publish date for the PDF meta line (UTC calendar day). */
export function formatPdfMetaDate(publishedAt: Date, locale: PdfMetaLocale): string {
  if (locale === 'de') {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(publishedAt);
  }
  return publishedAt.toISOString().slice(0, 10);
}

/** Visible PDF meta line under the title: name(s), date, version. */
export function buildPdfResponsibleMetaLine(args: {
  responsibleNames: string[];
  versionNumber: number;
  publishedAt: Date;
  /** User preference locale at export time; default `en`. */
  locale?: PdfMetaLocale;
}): string {
  const locale = args.locale ?? 'en';
  const date = formatPdfMetaDate(args.publishedAt, locale);
  const parts: string[] = [];
  if (args.responsibleNames.length > 0) {
    parts.push(args.responsibleNames.join(', '));
  }
  parts.push(date);
  parts.push(`Version ${args.versionNumber}`);
  return parts.join(', ');
}
