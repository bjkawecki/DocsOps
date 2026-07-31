/** Shared figure label for preview and editor (EN product UI). Mirrors backend figureCaption. */
export function formatFigureCaption(n: number, caption?: string | null): string {
  const trimmed = typeof caption === 'string' ? caption.trim() : '';
  if (trimmed.length === 0) return `Figure ${n}`;
  return `Figure ${n}: ${trimmed}`;
}

export function documentAttachmentUrl(documentId: string, attachmentId: string): string {
  return `/api/v1/documents/${documentId}/attachments/${attachmentId}`;
}

export const IMAGE_UPLOAD_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

export function isAllowedImageUploadMime(mime: string): boolean {
  return IMAGE_UPLOAD_MIME_TYPES.has(mime.toLowerCase());
}
