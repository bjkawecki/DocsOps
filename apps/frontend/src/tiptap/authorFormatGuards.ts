import type { Editor } from '@tiptap/core';
import type { Mark, MarkType } from '@tiptap/pm/model';
import type { EditorState, Transaction } from '@tiptap/pm/state';
import { TextSelection } from '@tiptap/pm/state';
import { authorCanApplyInlineFormat } from './authorSuggestionMode.js';

type AuthorInlineMark = 'bold' | 'italic' | 'code';

const SUGGESTION_MARK_NAMES = new Set(['suggestionInsert', 'suggestionDelete']);

/**
 * True when the current selection is safe for author inline formatting (bold/italic/code).
 */
export function authorSelectionAllowsInlineFormat(editor: Editor, authorId: string): boolean {
  if (!authorId) return false;
  return authorCanApplyInlineFormat(editor.state, authorId);
}

/** Replace all marks on [from,to) with the given set (clears removed marks too). */
function replaceMarksOnRange(
  tr: Transaction,
  from: number,
  to: number,
  marks: readonly Mark[]
): void {
  const typesToClear = new Set<MarkType>();
  tr.doc.nodesBetween(from, to, (node, pos) => {
    if (!node.isText) return;
    const sliceFrom = Math.max(from, pos);
    const sliceTo = Math.min(to, pos + node.nodeSize);
    if (sliceFrom >= sliceTo) return;
    for (const mark of node.marks) {
      typesToClear.add(mark.type);
    }
  });
  for (const type of typesToClear) {
    tr.removeMark(from, to, type);
  }
  for (const mark of marks) {
    tr.addMark(from, to, mark);
  }
}

/** Toggle a format mark without dropping suggestionInsert/Delete (PM addToSet strips them for code). */
export function toggleMarksPreservingSuggestions(
  marks: readonly Mark[],
  markType: MarkType,
  enable: boolean
): Mark[] {
  const suggestionMarks = marks.filter((m) => SUGGESTION_MARK_NAMES.has(m.type.name));
  const other = marks.filter(
    (m) => !SUGGESTION_MARK_NAMES.has(m.type.name) && m.type.name !== markType.name
  );
  if (enable) {
    if (markType.name === 'code') {
      // Inline code replaces other format marks but keeps suggestion spans.
      return [markType.create(), ...suggestionMarks];
    }
    return [...other, markType.create(), ...suggestionMarks];
  }
  return [...other, ...suggestionMarks];
}

/** Whether the mark is active for the next typed char or on adjacent text at the cursor. */
function markActiveAtCursor(state: EditorState, markType: MarkType): boolean {
  const { from, empty } = state.selection;
  if (!empty) return false;
  if (state.storedMarks && markType.isInSet(state.storedMarks)) return true;
  const $pos = state.doc.resolve(from);
  if (markType.isInSet($pos.marks())) return true;
  const before = $pos.nodeBefore;
  if (before?.isText && markType.isInSet(before.marks)) return true;
  const after = $pos.nodeAfter;
  if (after?.isText && markType.isInSet(after.marks)) return true;
  return false;
}

/** Expand to contiguous text nodes that carry `markType` at/around the cursor. */
function expandMarkRangeAtCursor(
  state: EditorState,
  markType: MarkType
): { from: number; to: number } | null {
  const { from } = state.selection;
  const $pos = state.doc.resolve(from);
  if (!$pos.parent.isTextblock) return null;

  let anchor = from;
  if (!markType.isInSet($pos.marks())) {
    const before = $pos.nodeBefore;
    if (before?.isText && markType.isInSet(before.marks)) {
      anchor = from - before.nodeSize;
    } else {
      const after = $pos.nodeAfter;
      if (!after?.isText || !markType.isInSet(after.marks)) return null;
    }
  }

  const parentStart = $pos.start();
  const parentEnd = $pos.end();
  let rangeFrom = anchor;
  let rangeTo = anchor;

  while (rangeFrom > parentStart) {
    const $from = state.doc.resolve(rangeFrom);
    const node = $from.nodeBefore;
    if (!node?.isText || !markType.isInSet(node.marks)) break;
    rangeFrom -= node.nodeSize;
  }
  while (rangeTo < parentEnd) {
    const $to = state.doc.resolve(rangeTo);
    const node = $to.nodeAfter;
    if (!node?.isText || !markType.isInSet(node.marks)) break;
    rangeTo += node.nodeSize;
  }

  if (rangeFrom >= rangeTo) return null;
  return { from: rangeFrom, to: rangeTo };
}

function applyMarkToggleOnRange(
  state: EditorState,
  tr: Transaction,
  rangeFrom: number,
  rangeTo: number,
  markType: MarkType
): readonly Mark[] | null {
  const has = state.doc.rangeHasMark(rangeFrom, rangeTo, markType);
  let storedAtEnd: readonly Mark[] | null = null;

  state.doc.nodesBetween(rangeFrom, rangeTo, (node, pos) => {
    if (!node.isText) return;
    const sliceFrom = Math.max(rangeFrom, pos);
    const sliceTo = Math.min(rangeTo, pos + node.nodeSize);
    if (sliceFrom >= sliceTo) return;
    const nextMarks = toggleMarksPreservingSuggestions(node.marks, markType, !has);
    replaceMarksOnRange(tr, sliceFrom, sliceTo, nextMarks);
    if (sliceTo === rangeTo) {
      storedAtEnd = nextMarks;
    }
  });

  return storedAtEnd;
}

/**
 * Toggle inline mark on author suggestion text while keeping suggestionInsert/Delete.
 * TipTap/PM mark commands drop suggestionInsert when toggling code/bold/italic.
 */
export function toggleAuthorInlineMark(editor: Editor, markName: AuthorInlineMark): boolean {
  const markType = editor.state.schema.marks[markName];
  if (!markType) return false;

  const { state, view } = editor;
  const { from, to, empty } = state.selection;

  if (empty) {
    const cursorPos = from;
    const stored = state.storedMarks ?? state.doc.resolve(from).marks();
    const has = markActiveAtCursor(state, markType);

    if (has) {
      const expanded = expandMarkRangeAtCursor(state, markType);
      if (expanded) {
        const tr = state.tr;
        const storedAtEnd = applyMarkToggleOnRange(state, tr, expanded.from, expanded.to, markType);
        if (storedAtEnd) {
          tr.setStoredMarks(storedAtEnd);
        }
        tr.setSelection(TextSelection.create(tr.doc, cursorPos, cursorPos));
        view.dispatch(tr);
        return true;
      }
    }

    const next = toggleMarksPreservingSuggestions(stored, markType, !has);
    view.dispatch(state.tr.setStoredMarks(next));
    return true;
  }

  const tr = state.tr;
  const storedAtEnd = applyMarkToggleOnRange(state, tr, from, to, markType);

  if (storedAtEnd) {
    tr.setStoredMarks(storedAtEnd);
  }

  view.dispatch(tr);
  return true;
}
