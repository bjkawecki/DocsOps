import type { Editor } from '@tiptap/core';
import {
  blockDocumentToTiptapJson,
  tiptapJsonToBlockDocument,
} from '../lib/blockDocumentTiptap.js';

type MarkRange = {
  from: number;
  to: number;
  kind: 'insert' | 'delete';
};

function collectMarkRanges(editor: Editor, suggestionId: string): MarkRange[] {
  const ranges: MarkRange[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (!node.isText) return;
    for (const mark of node.marks) {
      if (mark.type.name !== 'suggestionInsert' && mark.type.name !== 'suggestionDelete') continue;
      if (mark.attrs.suggestionId !== suggestionId) continue;
      ranges.push({
        from: pos,
        to: pos + node.nodeSize,
        kind: mark.type.name === 'suggestionInsert' ? 'insert' : 'delete',
      });
    }
  });
  return ranges;
}

/** Remove an unsaved suggestion from the editor without calling the API. */
export function withdrawLocalSuggestionInEditor(editor: Editor, suggestionId: string): boolean {
  const ranges = collectMarkRanges(editor, suggestionId);
  if (ranges.length === 0) return false;

  const { state } = editor;
  const deleteMarkType = state.schema.marks.suggestionDelete;
  let tr = state.tr;

  for (let i = ranges.length - 1; i >= 0; i--) {
    const range = ranges[i];
    if (!range) continue;
    if (range.kind === 'insert') {
      tr = tr.delete(range.from, range.to);
    } else if (deleteMarkType) {
      tr = tr.removeMark(range.from, range.to, deleteMarkType);
    }
  }

  editor.view.dispatch(tr);

  const normalized = tiptapJsonToBlockDocument(editor.getJSON());
  editor.commands.setContent(blockDocumentToTiptapJson(normalized), false);
  return true;
}
