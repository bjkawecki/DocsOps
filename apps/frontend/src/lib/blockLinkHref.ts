import {
  docsopsDocHrefToken,
  isDocsopsDocHref,
  parseDocsopsDocHrefToken,
} from './docsopsDocLink.js';

/** External / hash hrefs (ADR 005) – mirrors backend `isAllowedLinkHref`. */
export function isAllowedLinkHref(href: string): boolean {
  if (/^https?:\/\//i.test(href)) return true;
  if (/^#[^\s#]+$/.test(href)) return true;
  return false;
}

/** TipTap Link.validate: ADR 005 hrefs plus `docsops-doc:` tokens (ADR 006). */
export function isAllowedEditorLinkHref(href: string): boolean {
  return isAllowedLinkHref(href) || isDocsopsDocHref(href);
}

export type BlockTextLink = { href: string } | { documentId: string };

/**
 * Read structured `meta.link` (ADR 005 / 006).
 * Malformed objects (both keys, neither, extra) return null.
 */
export function readTextNodeLink(meta: Record<string, unknown> | undefined): BlockTextLink | null {
  const link = meta?.link;
  if (link == null || typeof link !== 'object' || Array.isArray(link)) return null;
  const record = link as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== 1) return null;
  if (typeof record.href === 'string' && isAllowedLinkHref(record.href)) {
    return { href: record.href };
  }
  if (typeof record.documentId === 'string' && record.documentId.length > 0) {
    return { documentId: record.documentId };
  }
  return null;
}

/** Read `meta.link.href` when present (href variant only); otherwise null. */
export function readTextNodeLinkHref(meta: Record<string, unknown> | undefined): string | null {
  const link = readTextNodeLink(meta);
  return link != null && 'href' in link ? link.href : null;
}

/** Read `meta.link.documentId` when present; otherwise null. */
export function readTextNodeLinkDocumentId(
  meta: Record<string, unknown> | undefined
): string | null {
  const link = readTextNodeLink(meta);
  return link != null && 'documentId' in link ? link.documentId : null;
}

/** TipTap mark href ↔ block `meta.link`. */
export function editorHrefFromBlockLink(link: BlockTextLink): string {
  return 'documentId' in link ? docsopsDocHrefToken(link.documentId) : link.href;
}

export function blockLinkFromEditorHref(href: string): BlockTextLink | null {
  const documentId = parseDocsopsDocHrefToken(href);
  if (documentId != null) return { documentId };
  if (isAllowedLinkHref(href)) return { href };
  return null;
}
