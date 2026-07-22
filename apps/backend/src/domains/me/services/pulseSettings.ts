export type PulseSettings = {
  showDrafts: boolean;
  showReviews: boolean;
  showNewDocuments: boolean;
  showUpdatedDocuments: boolean;
  showComments: boolean;
};

/** Defaults: all pulse kinds enabled. */
export function resolvePulseSettings(raw: unknown): PulseSettings {
  const p =
    raw != null && typeof raw === 'object'
      ? (raw as Partial<Record<keyof PulseSettings, unknown>>)
      : {};
  const bool = (key: keyof PulseSettings): boolean =>
    typeof p[key] === 'boolean' ? p[key] === true : true;
  return {
    showDrafts: bool('showDrafts'),
    showReviews: bool('showReviews'),
    showNewDocuments: bool('showNewDocuments'),
    showUpdatedDocuments: bool('showUpdatedDocuments'),
    showComments: bool('showComments'),
  };
}
