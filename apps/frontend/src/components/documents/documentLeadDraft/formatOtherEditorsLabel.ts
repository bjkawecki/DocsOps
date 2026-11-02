import type { DraftPresenceEditor } from './useDocumentLeadDraftPanelState.js';

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export function formatOtherEditorsLabel(
  editors: DraftPresenceEditor[],
  t: TranslateFn
): string | null {
  if (editors.length === 0) return null;
  if (editors.length === 1) {
    return t('leadDraft.othersEditingOne', {
      name: editors[0]?.name ?? t('leadDraft.someoneFallback'),
    });
  }
  return t('leadDraft.othersEditingMany', { names: editors.map((e) => e.name).join(', ') });
}
