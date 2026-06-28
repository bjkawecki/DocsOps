import { describe, it, expect } from 'vitest';
import type { BlockDocument } from '../services/blocks/blockSchema.js';
import {
  acceptSuggestionInDocument,
  assertNoOverlappingPendingDeletes,
  AuthorDraftPatchInvalidError,
  countPendingSuggestions,
  declineSuggestionInDocument,
  stripSuggestionsForPublished,
  validateAuthorDraftPatch,
  withdrawPendingDeletesAffectedByLeadEdit,
  withdrawSuggestionInDocument,
} from '../services/collaboration/draftInlineSuggestions.js';

function para(
  id: string,
  leaves: BlockDocument['blocks'][0]['content']
): BlockDocument['blocks'][0] {
  return { id, type: 'paragraph', content: leaves ?? [] };
}

function insertLeaf(
  text: string,
  suggestionId: string,
  authorId: string,
  createdAt = '2026-06-16T10:00:00.000Z'
) {
  return {
    id: `leaf-${suggestionId}`,
    type: 'text' as const,
    attrs: {},
    meta: {
      text,
      suggestion: {
        id: suggestionId,
        kind: 'insert' as const,
        authorId,
        status: 'pending' as const,
        createdAt,
      },
    },
  };
}

function deleteLeaf(
  text: string,
  suggestionId: string,
  authorId: string,
  createdAt = '2026-06-16T10:00:00.000Z'
) {
  return {
    id: `leaf-${suggestionId}`,
    type: 'text' as const,
    attrs: {},
    meta: {
      text,
      suggestion: {
        id: suggestionId,
        kind: 'delete' as const,
        authorId,
        status: 'pending' as const,
        createdAt,
      },
    },
  };
}

function canonLeaf(text: string) {
  return { id: `leaf-${text}`, type: 'text' as const, attrs: {}, meta: { text } };
}

describe('draftInlineSuggestions', () => {
  it('countPendingSuggestions counts pending marks only', () => {
    const doc: BlockDocument = {
      schemaVersion: 1,
      blocks: [para('p1', [canonLeaf('Hello '), insertLeaf('world', 's1', 'author-a')])],
    };
    expect(countPendingSuggestions(doc)).toBe(1);
  });

  it('accept insert removes suggestion mark', () => {
    const doc: BlockDocument = {
      schemaVersion: 1,
      blocks: [para('p1', [insertLeaf('Hi', 's1', 'a')])],
    };
    const next = acceptSuggestionInDocument(doc, 's1');
    expect(next).not.toBeNull();
    expect(countPendingSuggestions(next!)).toBe(0);
    expect(next!.blocks[0]?.content?.[0]?.meta?.suggestion).toBeUndefined();
    expect(next!.blocks[0]?.content?.[0]?.meta?.text).toBe('Hi');
  });

  it('accept delete removes text leaf', () => {
    const doc: BlockDocument = {
      schemaVersion: 1,
      blocks: [para('p1', [canonLeaf('ab'), deleteLeaf('c', 's1', 'a')])],
    };
    const next = acceptSuggestionInDocument(doc, 's1');
    expect(next!.blocks[0]?.content?.map((l) => l.meta?.text)).toEqual(['ab']);
  });

  it('decline insert removes insert span', () => {
    const doc: BlockDocument = {
      schemaVersion: 1,
      blocks: [para('p1', [canonLeaf('Hi'), insertLeaf(' there', 's1', 'a')])],
    };
    const next = declineSuggestionInDocument(doc, 's1');
    expect(next!.blocks[0]?.content?.map((l) => l.meta?.text)).toEqual(['Hi']);
  });

  it('decline delete restores canon', () => {
    const doc: BlockDocument = {
      schemaVersion: 1,
      blocks: [para('p1', [deleteLeaf('x', 's1', 'a')])],
    };
    const next = declineSuggestionInDocument(doc, 's1');
    expect(countPendingSuggestions(next!)).toBe(0);
    expect(next!.blocks[0]?.content?.[0]?.meta?.suggestion).toBeUndefined();
  });

  it('withdraw equals decline for author', () => {
    const doc: BlockDocument = {
      schemaVersion: 1,
      blocks: [para('p1', [insertLeaf('x', 's1', 'a')])],
    };
    const next = withdrawSuggestionInDocument(doc, 's1');
    expect(next!.blocks).toHaveLength(0);
  });

  it('stripSuggestionsForPublished omits pending inserts and deletes', () => {
    const doc: BlockDocument = {
      schemaVersion: 1,
      blocks: [
        para('p1', [
          canonLeaf('Keep'),
          insertLeaf('NEW', 's1', 'a'),
          deleteLeaf('DROP', 's2', 'a'),
        ]),
      ],
    };
    const stripped = stripSuggestionsForPublished(doc);
    expect(stripped.blocks[0]?.content?.map((l) => l.meta?.text)).toEqual(['Keep']);
  });

  it('assertNoOverlappingPendingDeletes allows adjacent delete spans', () => {
    const doc: BlockDocument = {
      schemaVersion: 1,
      blocks: [
        para('p1', [deleteLeaf('abc', 's1', 'author-a'), deleteLeaf('bc', 's2', 'author-b')]),
      ],
    };
    expect(() => assertNoOverlappingPendingDeletes(doc)).not.toThrow();
  });

  it('assertNoOverlappingPendingDeletes rejects overlapping delete spans from different suggestions', () => {
    const doc: BlockDocument = {
      schemaVersion: 1,
      blocks: [
        para('p1', [
          deleteLeaf('a', 's1', 'author-a'),
          deleteLeaf('b', 's2', 'author-b'),
          deleteLeaf('b', 's1', 'author-a'),
          deleteLeaf('c', 's2', 'author-b'),
        ]),
      ],
    };
    expect(() => assertNoOverlappingPendingDeletes(doc)).toThrow();
  });

  it('validateAuthorDraftPatch rejects canon change', () => {
    const before: BlockDocument = {
      schemaVersion: 0,
      blocks: [para('p1', [canonLeaf('Hello')])],
    };
    const after: BlockDocument = {
      schemaVersion: 0,
      blocks: [para('p1', [canonLeaf('Hello!')])],
    };
    expect(() => validateAuthorDraftPatch(before, after, 'author-a')).toThrow(
      AuthorDraftPatchInvalidError
    );
  });

  it('validateAuthorDraftPatch allows own insert suggestion', () => {
    const before: BlockDocument = {
      schemaVersion: 0,
      blocks: [para('p1', [canonLeaf('Hello')])],
    };
    const after: BlockDocument = {
      schemaVersion: 1,
      blocks: [para('p1', [canonLeaf('Hello'), insertLeaf(' world', 's1', 'author-a')])],
    };
    expect(() => validateAuthorDraftPatch(before, after, 'author-a')).not.toThrow();
  });

  it('validateAuthorDraftPatch allows new paragraph block with insert suggestions only', () => {
    const before: BlockDocument = {
      schemaVersion: 0,
      blocks: [para('p1', [canonLeaf('Hello')])],
    };
    const after: BlockDocument = {
      schemaVersion: 0,
      blocks: [
        para('p1', [canonLeaf('Hello')]),
        para('p2', [insertLeaf('Neuer Absatz', 's1', 'author-a')]),
      ],
    };
    expect(() => validateAuthorDraftPatch(before, after, 'author-a')).not.toThrow();
  });

  it('validateAuthorDraftPatch rejects removing existing blocks', () => {
    const before: BlockDocument = {
      schemaVersion: 0,
      blocks: [para('p1', [canonLeaf('Hello')]), para('p2', [canonLeaf('World')])],
    };
    const after: BlockDocument = {
      schemaVersion: 0,
      blocks: [para('p1', [canonLeaf('Hello')])],
    };
    expect(() => validateAuthorDraftPatch(before, after, 'author-a')).toThrow(
      AuthorDraftPatchInvalidError
    );
  });

  it('validateAuthorDraftPatch allows split canon leaves with same content', () => {
    const before: BlockDocument = {
      schemaVersion: 0,
      blocks: [para('p1', [canonLeaf('Hello world')])],
    };
    const after: BlockDocument = {
      schemaVersion: 1,
      blocks: [
        para('p1', [canonLeaf('Hello'), canonLeaf(' world'), insertLeaf('!', 's1', 'author-a')]),
      ],
    };
    expect(() => validateAuthorDraftPatch(before, after, 'author-a')).not.toThrow();
  });

  it('validateAuthorDraftPatch ignores new empty paragraph blocks', () => {
    const before: BlockDocument = {
      schemaVersion: 0,
      blocks: [para('p1', [canonLeaf('Hello')])],
    };
    const after: BlockDocument = {
      schemaVersion: 0,
      blocks: [
        para('p1', [canonLeaf('Hello')]),
        para('p-empty', [canonLeaf('')]),
        para('p2', [insertLeaf('Neuer Absatz', 's1', 'author-a')]),
      ],
    };
    expect(() => validateAuthorDraftPatch(before, after, 'author-a')).not.toThrow();
  });

  it('withdraw on insert-only block removes empty block', () => {
    const doc: BlockDocument = {
      schemaVersion: 1,
      blocks: [para('p1', [canonLeaf('Hello')]), para('p2', [insertLeaf('New', 's1', 'author-a')])],
    };
    const next = withdrawSuggestionInDocument(doc, 's1');
    expect(next?.blocks.map((b) => b.id)).toEqual(['p1']);
  });

  it('withdrawPendingDeletesAffectedByLeadEdit clears deletes when canon changes', () => {
    const before: BlockDocument = {
      schemaVersion: 1,
      blocks: [para('p1', [canonLeaf('Hello'), deleteLeaf(' world', 's1', 'a')])],
    };
    const after: BlockDocument = {
      schemaVersion: 1,
      blocks: [para('p1', [canonLeaf('Hello!'), deleteLeaf(' world', 's1', 'a')])],
    };
    const next = withdrawPendingDeletesAffectedByLeadEdit(before, after);
    expect(countPendingSuggestions(next)).toBe(0);
    expect(next.blocks[0]?.content?.map((l) => l.meta?.text)).toEqual(['Hello! world']);
  });
});
