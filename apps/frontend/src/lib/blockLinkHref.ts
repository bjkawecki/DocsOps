/** Allowed TipTap / block link hrefs (ADR 005) – mirrors backend `isAllowedLinkHref`. */
export function isAllowedLinkHref(href: string): boolean {
  if (/^https?:\/\//i.test(href)) return true;
  if (/^#[^\s#]+$/.test(href)) return true;
  return false;
}

export function readTextNodeLinkHref(meta: Record<string, unknown> | undefined): string | null {
  const link = meta?.link;
  if (link == null || typeof link !== 'object' || Array.isArray(link)) return null;
  const href = (link as Record<string, unknown>).href;
  return typeof href === 'string' ? href : null;
}
