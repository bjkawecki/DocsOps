import { describe, expect, it } from 'vitest';
import { authorCanApplyInlineFormat } from './authorSuggestionMode.js';
import { toggleMarksPreservingSuggestions } from './authorFormatGuards.js';
import type { EditorState } from '@tiptap/pm/state';

type MockMark = { type: { name: string }; attrs?: Record<string, unknown> };

function mockState(options: {
  from: number;
  to: number;
  empty: boolean;
  cursorMarks?: MockMark[];
  textNodes?: Array<{ from: number; to: number; marks: MockMark[] }>;
}): EditorState {
  return {
    selection: { from: options.from, to: options.to, empty: options.empty },
    storedMarks: null,
    doc: {
      resolve(pos: number) {
        const nodeBefore =
          options.textNodes?.find((n) => n.to === pos) ??
          options.textNodes?.find((n) => n.from < pos && n.to > pos);
        const marks = () => {
          if (options.empty && options.cursorMarks) return options.cursorMarks;
          if (nodeBefore) return nodeBefore.marks;
          return options.cursorMarks ?? [];
        };
        return {
          marks,
          nodeBefore: nodeBefore?.marks ? { isText: true, marks: nodeBefore.marks } : null,
          nodeAfter: null,
        };
      },
      nodesBetween(
        from: number,
        to: number,
        callback: (node: { isText: boolean; marks: MockMark[] }) => void
      ) {
        for (const segment of options.textNodes ?? []) {
          if (segment.from >= to || segment.to <= from) continue;
          callback({ isText: true, marks: segment.marks });
        }
      },
    },
  } as unknown as EditorState;
}

describe('authorCanApplyInlineFormat', () => {
  it('returns false when cursor is in canon text', () => {
    const state = mockState({ from: 5, to: 5, empty: true, cursorMarks: [] });
    expect(authorCanApplyInlineFormat(state, 'author-a')).toBe(false);
  });

  it('returns true when cursor is in own insert suggestion', () => {
    const state = mockState({
      from: 5,
      to: 5,
      empty: true,
      cursorMarks: [{ type: { name: 'suggestionInsert' }, attrs: { authorId: 'author-a' } }],
    });
    expect(authorCanApplyInlineFormat(state, 'author-a')).toBe(true);
  });

  it('returns true when selection spans only own insert text', () => {
    const state = mockState({
      from: 1,
      to: 6,
      empty: false,
      textNodes: [
        {
          from: 1,
          to: 6,
          marks: [{ type: { name: 'suggestionInsert' }, attrs: { authorId: 'author-a' } }],
        },
      ],
    });
    expect(authorCanApplyInlineFormat(state, 'author-a')).toBe(true);
  });

  it('returns false when selection includes canon text', () => {
    const state = mockState({
      from: 1,
      to: 10,
      empty: false,
      textNodes: [
        {
          from: 1,
          to: 6,
          marks: [{ type: { name: 'suggestionInsert' }, attrs: { authorId: 'author-a' } }],
        },
        { from: 6, to: 10, marks: [] },
      ],
    });
    expect(authorCanApplyInlineFormat(state, 'author-a')).toBe(false);
  });
});

describe('toggleMarksPreservingSuggestions', () => {
  const suggestionInsert = { type: { name: 'suggestionInsert' }, attrs: {} } as const;
  const codeType = {
    name: 'code',
    create: () => ({ type: { name: 'code' }, attrs: {} }),
  };

  it('keeps suggestionInsert when enabling code', () => {
    const next = toggleMarksPreservingSuggestions(
      [suggestionInsert as never],
      codeType as never,
      true
    );
    expect(next.map((m) => m.type.name)).toEqual(['code', 'suggestionInsert']);
  });

  it('keeps suggestionInsert when disabling code', () => {
    const next = toggleMarksPreservingSuggestions(
      [codeType.create() as never, suggestionInsert as never],
      codeType as never,
      false
    );
    expect(next.map((m) => m.type.name)).toEqual(['suggestionInsert']);
  });

  it('drops bold/italic when enabling code but keeps suggestionInsert', () => {
    const bold = { type: { name: 'bold' }, attrs: {} };
    const next = toggleMarksPreservingSuggestions(
      [bold as never, suggestionInsert as never],
      codeType as never,
      true
    );
    expect(next.map((m) => m.type.name)).toEqual(['code', 'suggestionInsert']);
  });
});
