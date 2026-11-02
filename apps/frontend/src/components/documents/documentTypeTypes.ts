export type TemplateSection = {
  heading: string;
  prompts: string[];
};

export type DocumentTypeDto = {
  id: string;
  source: 'builtin' | 'custom';
  label: string;
  deLabel: string | null;
  whenToUse: string;
  deWhenToUse: string | null;
  oftenUsedIn: 'process' | 'project' | null;
  documentTypeKey: string;
  defaultTemplateId: string | null;
  exampleTitle: string | null;
  deExampleTitle: string | null;
  sections: TemplateSection[];
  deSections: TemplateSection[] | null;
  scope: { type: string; [key: string]: string } | null;
};

export type DocumentTypeSelection = {
  /** Apply template structure on create when set. */
  templateId: string | null;
  /** Type metadata only when templateId is null. */
  typeId: string | null;
  /** Prefill title from example when user hasn't typed yet. */
  exampleTitle: string | null;
};

export const BLANK_DOCUMENT_SELECTION: DocumentTypeSelection = {
  templateId: null,
  typeId: null,
  exampleTitle: null,
};
