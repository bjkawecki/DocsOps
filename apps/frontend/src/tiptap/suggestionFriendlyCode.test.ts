import { describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { SuggestionFriendlyCode } from './suggestionFriendlyCode.js';
import { SuggestionDeleteMark, SuggestionInsertMark } from './suggestionMarks.js';

describe('SuggestionFriendlyCode', () => {
  it('coexists with suggestionInsert on the same text node', () => {
    const editor = new Editor({
      extensions: [
        StarterKit.configure({ code: false }),
        SuggestionFriendlyCode,
        SuggestionInsertMark,
        SuggestionDeleteMark,
      ],
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'fn',
                marks: [
                  { type: 'code' },
                  {
                    type: 'suggestionInsert',
                    attrs: {
                      suggestionId: 's1',
                      authorId: 'a1',
                      createdAt: '2026-06-16T10:00:00.000Z',
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const leaf = editor.getJSON().content?.[0]?.content?.[0];
    const markTypes = (leaf?.marks ?? []).map((m) => m.type).sort();
    expect(markTypes).toEqual(['code', 'suggestionInsert']);
    editor.destroy();
  });
});
