/** Shared figure label for preview, markdown, and PDF (EN product UI). */
export function formatFigureCaption(n: number, caption?: string | null): string {
  const trimmed = typeof caption === 'string' ? caption.trim() : '';
  if (trimmed.length === 0) return `Figure ${n}`;
  return `Figure ${n}: ${trimmed}`;
}

/** Markdown / PDF token for an attachment-backed image (resolved later for PDF). */
export const ATTACHMENT_HREF_PREFIX = 'docsops-attachment:';

export function attachmentHrefToken(attachmentId: string): string {
  return `${ATTACHMENT_HREF_PREFIX}${attachmentId}`;
}

export function parseAttachmentHrefToken(href: string): string | null {
  if (!href.startsWith(ATTACHMENT_HREF_PREFIX)) return null;
  const id = href.slice(ATTACHMENT_HREF_PREFIX.length).trim();
  return id.length > 0 ? id : null;
}
