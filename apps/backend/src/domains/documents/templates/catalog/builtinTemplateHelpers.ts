import type {
  BuiltinDocumentType,
  OftenUsedIn,
  TemplateSection,
} from '../builtinDocumentTemplateTypes.js';

/** Build a built-in document type catalog entry (EN + DE fields). */
export function t(
  slug: string,
  label: string,
  deLabel: string,
  whenToUse: string,
  deWhenToUse: string,
  oftenUsedIn: OftenUsedIn,
  exampleTitle: string,
  deExampleTitle: string,
  sections: TemplateSection[],
  deSections: TemplateSection[]
): BuiltinDocumentType {
  return {
    slug,
    label,
    deLabel,
    whenToUse,
    deWhenToUse,
    oftenUsedIn,
    exampleTitle,
    deExampleTitle,
    sections,
    deSections,
  };
}
