export {
  readBlockSuggestion,
  countPendingSuggestions,
  collectPendingSuggestionMeta,
  findSuggestionSpan,
  summarizePendingSuggestions,
  type SuggestionSpanLocation,
  type PendingSuggestionSummary,
} from './draftInlineSuggestionQuery.js';

export {
  SuggestionDeleteOverlapError,
  assertNoOverlappingPendingDeletes,
} from './draftInlineSuggestionOverlap.js';

export {
  acceptSuggestionInDocument,
  declineSuggestionInDocument,
  withdrawSuggestionInDocument,
  patchSuggestionTextInDocument,
  stripSuggestionsForPublished,
  withdrawPendingDeletesAffectedByLeadEdit,
} from './draftInlineSuggestionTransforms.js';

export {
  AuthorDraftPatchInvalidError,
  validateAuthorDraftPatch,
} from './draftAuthorPatchValidation.js';
