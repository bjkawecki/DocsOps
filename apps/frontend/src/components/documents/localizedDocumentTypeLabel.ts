import type { DocumentTypeDto } from './documentTypeTypes.js';

/**
 * Display label for a document type: prefers `deLabel` when the active locale is German.
 */
export function localizedDocumentTypeLabel(
  type: Pick<DocumentTypeDto, 'label' | 'deLabel'>,
  locale: string
): string {
  if (locale.toLowerCase().startsWith('de') && type.deLabel?.trim()) {
    return type.deLabel.trim();
  }
  return type.label;
}
