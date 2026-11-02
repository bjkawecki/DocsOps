import type { DocumentTypeDto, TemplateSection } from './documentTypeTypes.js';

function preferDe(locale: string): boolean {
  return locale.toLowerCase().startsWith('de');
}

/**
 * Display label for a document type: prefers `deLabel` when the active locale is German.
 */
export function localizedDocumentTypeLabel(
  type: Pick<DocumentTypeDto, 'label' | 'deLabel'>,
  locale: string
): string {
  if (preferDe(locale) && type.deLabel?.trim()) {
    return type.deLabel.trim();
  }
  return type.label;
}

/** When-to-use blurb for picker preview and template detail. */
export function localizedDocumentTypeWhenToUse(
  type: Pick<DocumentTypeDto, 'whenToUse' | 'deWhenToUse'>,
  locale: string
): string {
  if (preferDe(locale) && type.deWhenToUse?.trim()) {
    return type.deWhenToUse.trim();
  }
  return type.whenToUse;
}

/** Example title used to prefill new documents. */
export function localizedDocumentTypeExampleTitle(
  type: Pick<DocumentTypeDto, 'exampleTitle' | 'deExampleTitle'>,
  locale: string
): string | null {
  if (preferDe(locale) && type.deExampleTitle?.trim()) {
    return type.deExampleTitle.trim();
  }
  return type.exampleTitle;
}

/** Section headings/prompts for template preview. */
export function localizedDocumentTypeSections(
  type: Pick<DocumentTypeDto, 'sections' | 'deSections'>,
  locale: string
): TemplateSection[] {
  if (preferDe(locale) && type.deSections != null && type.deSections.length > 0) {
    return type.deSections;
  }
  return type.sections;
}

/** Localized display fields for built-in (and custom) document types. */
export function localizedDocumentTypeContent(
  type: DocumentTypeDto,
  locale: string
): {
  label: string;
  whenToUse: string;
  exampleTitle: string | null;
  sections: TemplateSection[];
} {
  return {
    label: localizedDocumentTypeLabel(type, locale),
    whenToUse: localizedDocumentTypeWhenToUse(type, locale),
    exampleTitle: localizedDocumentTypeExampleTitle(type, locale),
    sections: localizedDocumentTypeSections(type, locale),
  };
}
