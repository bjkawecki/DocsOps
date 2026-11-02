import { Mark, mergeAttributes } from '@tiptap/core';

export type SuggestionMarkAttrs = {
  suggestionId: string;
  authorId: string;
  createdAt: string;
};

function suggestionAttrs(attrs: SuggestionMarkAttrs) {
  return {
    'data-suggestion-id': attrs.suggestionId,
    'data-author-id': attrs.authorId,
    'data-created-at': attrs.createdAt,
  };
}

export const SuggestionInsertMark = Mark.create({
  name: 'suggestionInsert',
  /** true so continued typing reuses the same insert span (ADR 004). */
  inclusive: true,
  excludes: 'suggestionDelete',
  addAttributes() {
    return {
      suggestionId: { default: null, parseHTML: (el) => el.getAttribute('data-suggestion-id') },
      authorId: { default: null, parseHTML: (el) => el.getAttribute('data-author-id') },
      createdAt: { default: null, parseHTML: (el) => el.getAttribute('data-created-at') },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-suggestion-insert]' }];
  },
  renderHTML({ HTMLAttributes, mark }) {
    const attrs = mark.attrs as SuggestionMarkAttrs;
    return [
      'span',
      mergeAttributes(HTMLAttributes, suggestionAttrs(attrs), {
        'data-suggestion-insert': '',
        class: 'suggestion-insert',
      }),
      0,
    ];
  },
});

export const SuggestionDeleteMark = Mark.create({
  name: 'suggestionDelete',
  inclusive: false,
  excludes: 'suggestionInsert',
  addAttributes() {
    return {
      suggestionId: { default: null, parseHTML: (el) => el.getAttribute('data-suggestion-id') },
      authorId: { default: null, parseHTML: (el) => el.getAttribute('data-author-id') },
      createdAt: { default: null, parseHTML: (el) => el.getAttribute('data-created-at') },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-suggestion-delete]' }];
  },
  renderHTML({ HTMLAttributes, mark }) {
    const attrs = mark.attrs as SuggestionMarkAttrs;
    return [
      'span',
      mergeAttributes(HTMLAttributes, suggestionAttrs(attrs), {
        'data-suggestion-delete': '',
        class: 'suggestion-delete',
      }),
      0,
    ];
  },
});

export { suggestionAttrs };
