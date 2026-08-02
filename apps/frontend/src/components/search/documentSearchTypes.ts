export const DOCUMENT_SEARCH_DEBOUNCE_MS = 280;
export const DOCUMENT_SEARCH_MIN_CHARS = 2;
export const DOCUMENT_SEARCH_MODAL_LIMIT = 8;
export const SEARCH_HIT_TITLE_ICON = 18;
export const SEARCH_HIT_CONTEXT_ICON = 15;

export type DocumentSearchItem = {
  id: string;
  title: string;
  contextName: string | null;
  contextType: 'process' | 'project' | 'subcontext' | null;
  snippet: string | null;
  updatedAt: string;
  rank: number;
};

export type DocumentSearchResponse = {
  items: DocumentSearchItem[];
  total: number;
  limit: number;
  offset: number;
};

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export function documentSearchContextSubtitle(
  doc: DocumentSearchItem,
  t: TranslateFn
): string | null {
  const name = doc.contextName?.trim();
  if (name) return name;
  if (doc.contextType === 'process') return t('documents:breadcrumbs.process');
  if (doc.contextType === 'project') return t('documents:breadcrumbs.project');
  if (doc.contextType === 'subcontext') return t('documents:breadcrumbs.subcontext');
  return null;
}
