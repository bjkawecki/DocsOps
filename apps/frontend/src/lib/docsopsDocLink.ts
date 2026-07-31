/** TipTap / Markdown token for a cross-document link (ADR 006). */
export const DOCSOPS_DOC_HREF_PREFIX = 'docsops-doc:';

export function docsopsDocHrefToken(documentId: string): string {
  return `${DOCSOPS_DOC_HREF_PREFIX}${documentId}`;
}

export function parseDocsopsDocHrefToken(href: string): string | null {
  if (!href.startsWith(DOCSOPS_DOC_HREF_PREFIX)) return null;
  const id = href.slice(DOCSOPS_DOC_HREF_PREFIX.length).trim();
  return id.length > 0 ? id : null;
}

export function isDocsopsDocHref(href: string): boolean {
  return parseDocsopsDocHrefToken(href) != null;
}
