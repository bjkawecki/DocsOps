import { Extension } from '@tiptap/core';
import type { Mark as ProseMirrorMark } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { EditorState } from '@tiptap/pm/state';
import type { Transaction } from '@tiptap/pm/state';
import { randomId } from '../lib/randomId.js';

export type AuthorSuggestionModeOptions = {
  authorId: string;
  enabled: boolean;
};

function hasSuggestionMark(marks: readonly { type: { name: string } }[], name: string): boolean {
  return marks.some((m) => m.type.name === name);
}

function isCanonText(marks: readonly { type: { name: string } }[]): boolean {
  return (
    !hasSuggestionMark(marks, 'suggestionInsert') && !hasSuggestionMark(marks, 'suggestionDelete')
  );
}

function ownInsertMark(
  marks: readonly ProseMirrorMark[],
  authorId: string
): ProseMirrorMark | null {
  return (
    marks.find((m) => m.type.name === 'suggestionInsert' && m.attrs.authorId === authorId) ?? null
  );
}

function createInsertMark(
  schema: EditorState['schema'],
  authorId: string,
  existing?: ProseMirrorMark | null
) {
  const insertMarkType = schema.marks.suggestionInsert;
  if (!insertMarkType) return null;
  if (existing) return existing;
  return insertMarkType.create({
    suggestionId: randomId(),
    authorId,
    createdAt: new Date().toISOString(),
  });
}

function createDeleteMark(schema: EditorState['schema'], authorId: string) {
  const deleteMarkType = schema.marks.suggestionDelete;
  if (!deleteMarkType) return null;
  return deleteMarkType.create({
    suggestionId: randomId(),
    authorId,
    createdAt: new Date().toISOString(),
  });
}

/** Reuse insert mark when typing at span boundaries (inclusive marks + neighbors). */
function resolveExistingInsertMark(
  state: EditorState,
  pos: number,
  authorId: string
): ProseMirrorMark | null {
  const $pos = state.doc.resolve(pos);

  const fromMarks = ownInsertMark($pos.marks(), authorId);
  if (fromMarks) return fromMarks;

  if (state.storedMarks) {
    const stored = ownInsertMark(state.storedMarks, authorId);
    if (stored) return stored;
  }

  const nodeBefore = $pos.nodeBefore;
  if (nodeBefore?.isText) {
    const before = ownInsertMark(nodeBefore.marks, authorId);
    if (before) return before;
  }

  const nodeAfter = $pos.nodeAfter;
  if (nodeAfter?.isText) {
    const after = ownInsertMark(nodeAfter.marks, authorId);
    if (after) return after;
  }

  return null;
}

/** True when `pos` sits inside or adjacent to own pending insert text. */
function positionTouchesOwnInsert(state: EditorState, pos: number, authorId: string): boolean {
  if (resolveExistingInsertMark(state, pos, authorId)) return true;

  const $pos = state.doc.resolve(pos);
  if (pos > 0) {
    const $before = state.doc.resolve(pos - 1);
    if (ownInsertMark($before.marks(), authorId)) return true;
    const nodeAt = $before.nodeAfter;
    if (nodeAt?.isText && ownInsertMark(nodeAt.marks, authorId)) return true;
  }

  const nodeAfter = $pos.nodeAfter;
  if (nodeAfter?.isText && ownInsertMark(nodeAfter.marks, authorId)) return true;

  return false;
}

type SegmentKind = 'ownInsert' | 'canon' | 'foreign' | 'deleteMark';

function classifySegment(marks: readonly ProseMirrorMark[], authorId: string): SegmentKind {
  if (marks.some((m) => m.type.name === 'suggestionDelete')) return 'deleteMark';
  const own = ownInsertMark(marks, authorId);
  if (own) return 'ownInsert';
  if (marks.some((m) => m.type.name === 'suggestionInsert')) return 'foreign';
  return 'canon';
}

type Segment = { from: number; to: number; kind: SegmentKind };

/** Split [from,to) into contiguous segments by suggestion kind. */
function segmentsInRange(
  state: EditorState,
  from: number,
  to: number,
  authorId: string
): Segment[] {
  const segments: Segment[] = [];
  state.doc.nodesBetween(from, to, (node, pos) => {
    if (!node.isText) return;
    const segFrom = Math.max(from, pos);
    const segTo = Math.min(to, pos + node.nodeSize);
    if (segFrom >= segTo) return;
    const kind = classifySegment(node.marks, authorId);
    const last = segments[segments.length - 1];
    if (last && last.kind === kind && last.to === segFrom) {
      last.to = segTo;
    } else {
      segments.push({ from: segFrom, to: segTo, kind });
    }
  });
  return segments;
}

/**
 * Author delete/cut on selection:
 * - own pending inserts → remove text
 * - canon → delete suggestion mark
 * Returns null to defer to default handling (e.g. all foreign/delete-mark).
 */
function buildAuthorDeleteSelectionTransaction(
  state: EditorState,
  from: number,
  to: number,
  authorId: string
): Transaction | null {
  const segments = segmentsInRange(state, from, to, authorId);
  if (segments.length === 0) return null;

  const hasOwnInsert = segments.some((s) => s.kind === 'ownInsert');
  const hasCanon = segments.some((s) => s.kind === 'canon');
  if (!hasOwnInsert && !hasCanon) return null;
  if (hasOwnInsert && !hasCanon) return null;

  const deleteMark = createDeleteMark(state.schema, authorId);
  if (!deleteMark) return null;

  let tr = state.tr;
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    if (!seg) continue;
    if (seg.kind === 'ownInsert') {
      tr = tr.delete(seg.from, seg.to);
    } else if (seg.kind === 'canon') {
      tr = tr.addMark(seg.from, seg.to, deleteMark);
    }
  }
  return tr;
}

export const AuthorSuggestionModeExtension = Extension.create<AuthorSuggestionModeOptions>({
  name: 'authorSuggestionMode',

  addOptions() {
    return {
      authorId: '',
      enabled: false,
    };
  },

  addProseMirrorPlugins() {
    const readOptions = (): AuthorSuggestionModeOptions => ({
      authorId: this.options.authorId,
      enabled: this.options.enabled,
    });

    return [
      new Plugin({
        key: new PluginKey('authorSuggestionMode'),
        props: {
          handleTextInput(view, from, to, text) {
            const { authorId, enabled } = readOptions();
            if (!enabled || !authorId) return false;

            const { state } = view;
            const existingInsert = resolveExistingInsertMark(state, from, authorId);
            const marksBefore = state.doc.resolve(from).marks();

            if (!existingInsert && !isCanonText(marksBefore)) return false;

            const mark = createInsertMark(state.schema, authorId, existingInsert);
            if (!mark) return false;

            let tr = state.tr.insertText(text, from, to);
            tr = tr.addMark(from, from + text.length, mark);
            tr = tr.setStoredMarks([mark]);
            view.dispatch(tr);
            return true;
          },
          handleKeyDown(view, event) {
            const { authorId, enabled } = readOptions();
            if (!enabled || !authorId) return false;

            const { state } = view;
            if (!state.schema.marks.suggestionDelete) return false;

            const isCut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'x';
            const isDeleteKey = event.key === 'Backspace' || event.key === 'Delete';

            if (!isDeleteKey && !isCut) return false;

            const { from, to, empty } = state.selection;

            if (!empty) {
              const tr = buildAuthorDeleteSelectionTransaction(state, from, to, authorId);
              if (!tr) return false;
              if (isCut) {
                const plain = state.doc.textBetween(from, to);
                void navigator.clipboard.writeText(plain).catch(() => {});
              }
              view.dispatch(tr);
              event.preventDefault();
              return true;
            }

            if (event.key === 'Backspace' && from > 0) {
              const deleteFrom = from - 1;
              if (positionTouchesOwnInsert(state, deleteFrom, authorId)) return false;
              const $pos = state.doc.resolve(deleteFrom);
              const marks = $pos.marks();
              if (!isCanonText(marks)) return false;
              const mark = createDeleteMark(state.schema, authorId);
              if (!mark) return false;
              view.dispatch(state.tr.addMark(deleteFrom, from, mark));
              event.preventDefault();
              return true;
            }

            if (event.key === 'Delete' && to < state.doc.content.size) {
              if (positionTouchesOwnInsert(state, from, authorId)) return false;
              const deleteTo = from + 1;
              const $pos = state.doc.resolve(from);
              const marks = $pos.marks();
              if (!isCanonText(marks)) return false;
              const mark = createDeleteMark(state.schema, authorId);
              if (!mark) return false;
              view.dispatch(state.tr.addMark(from, deleteTo, mark));
              event.preventDefault();
              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});
