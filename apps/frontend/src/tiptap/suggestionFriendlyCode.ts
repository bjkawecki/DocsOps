import Code from '@tiptap/extension-code';

/**
 * Inline code that can coexist with suggestionInsert (default TipTap code excludes all marks).
 */
export const SuggestionFriendlyCode = Code.extend({
  name: 'code',
  excludes: 'suggestionDelete',
});
