import { useEffect } from 'react';
import type { RefObject } from 'react';
import type { DocumentLeadDraftPanelHandle } from '../../components/documents/DocumentLeadDraftPanel';

type Args = {
  mode: 'view' | 'edit';
  editTab: 'draft' | 'metadata' | 'access';
  leadDraftDirty: boolean;
  leadDraftPanelRef: RefObject<DocumentLeadDraftPanelHandle | null>;
  handleSave: () => Promise<void>;
};

export function useDocumentPageKeyboardEffects({
  mode,
  editTab,
  leadDraftDirty,
  leadDraftPanelRef,
  handleSave,
}: Args): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (mode !== 'edit') return;
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key === 's') {
        event.preventDefault();
        if (editTab === 'draft' && leadDraftDirty) {
          void leadDraftPanelRef.current?.saveDraft();
        } else if (editTab !== 'draft') {
          void handleSave();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editTab, handleSave, leadDraftDirty, leadDraftPanelRef, mode]);
}
