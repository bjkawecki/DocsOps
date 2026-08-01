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
  oftenUsedIn: OftenUsedIn;
  exampleTitle: string;
  sections: TemplateSection[];
};
