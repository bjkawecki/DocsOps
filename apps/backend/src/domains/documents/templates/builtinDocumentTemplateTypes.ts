/** Types for the built-in document template catalog (shared by catalog + API helpers). */
export type TemplateSection = {
  heading: string;
  prompts: string[];
};

export type OftenUsedIn = 'process' | 'project';

export type BuiltinDocumentType = {
  slug: string;
  label: string;
  deLabel: string;
  whenToUse: string;
  deWhenToUse: string;
  oftenUsedIn: OftenUsedIn;
  exampleTitle: string;
  deExampleTitle: string;
  sections: TemplateSection[];
  deSections: TemplateSection[];
};

/** Pick EN or DE fields for a built-in type based on locale (`de*` when locale starts with `de`). */
export function localizeBuiltinDocumentType(
  type: BuiltinDocumentType,
  locale: string | null | undefined
): {
  label: string;
  whenToUse: string;
  exampleTitle: string;
  sections: TemplateSection[];
} {
  const useDe = (locale ?? '').toLowerCase().startsWith('de');
  if (!useDe) {
    return {
      label: type.label,
      whenToUse: type.whenToUse,
      exampleTitle: type.exampleTitle,
      sections: type.sections,
    };
  }
  return {
    label: type.deLabel,
    whenToUse: type.deWhenToUse,
    exampleTitle: type.deExampleTitle,
    sections: type.deSections,
  };
}
