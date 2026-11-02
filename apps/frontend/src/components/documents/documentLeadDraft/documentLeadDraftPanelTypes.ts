export type DocumentLeadDraftPanelHandle = {
  saveDraft: () => Promise<boolean>;
  loadLatestServerDraft: () => void;
  openRawJson: () => void;
};
