import { describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { SuggestionFriendlyCode } from './suggestionFriendlyCode.js';
import { SuggestionDeleteMark, SuggestionInsertMark } from './suggestionMarks.js';
import { toggleAuthorInlineMark } from './authorFormatGuards.js';

function createAuthorEditor(content: Record<string, unknown>) {
  return new Editor({
    extensions: [
      StarterKit.configure({ code: false }),
      SuggestionFriendlyCode,
      SuggestionInsertMark,
      SuggestionDeleteMark,
    ],
    content,
  });
}

function leafMarks(editor: Editor) {
  const leaf = editor.getJSON().content?.[0]?.content?.[0];
  return (leaf?.marks ?? []).map((m) => m.type).sort();
}

describe('toggleAuthorInlineMark (editor)', () => {
  it('removes bold from selected suggestion text on second toggle', () => {
    const editor = createAuthorEditor({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'hello',
              marks: [
                { type: 'bold' },
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
    });

    editor.commands.setTextSelection({ from: 1, to: 6 });
    toggleAuthorInlineMark(editor, 'bold');

    expect(leafMarks(editor)).toEqual(['suggestionInsert']);
    editor.destroy();
  });

  it('removes bold at cursor inside suggestion text on second toggle', () => {
    const editor = createAuthorEditor({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'hello',
              marks: [
                { type: 'bold' },
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
    });

    editor.commands.setTextSelection({ from: 4, to: 4 });
    toggleAuthorInlineMark(editor, 'bold');

    expect(leafMarks(editor)).toEqual(['suggestionInsert']);
    editor.destroy();
  });

  it('keeps suggestionInsert when toggling inline code on', () => {
    const editor = createAuthorEditor({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'fn',
              marks: [
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
    });

    editor.commands.setTextSelection({ from: 1, to: 3 });
    toggleAuthorInlineMark(editor, 'code');

    expect(leafMarks(editor)).toEqual(['code', 'suggestionInsert']);
    editor.destroy();
  });
});
