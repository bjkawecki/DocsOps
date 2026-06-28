import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { initialsFromName } from '../lib/formatPresence.js';

export type SuggestionHoverTarget = {
  suggestionId: string;
  authorId: string;
  createdAt: string;
  kind: 'insert' | 'delete';
  anchorRect: DOMRect;
};

export type SuggestionHoverExtensionOptions = {
  authorNameById: Record<string, string>;
  onHoverChange: (target: SuggestionHoverTarget | null) => void;
  onHoverLeave: () => void;
};

const pluginKey = new PluginKey('suggestionHover');
const BADGE_CLASS = 'suggestion-initials-badge';

type SpanEnd = {
  pos: number;
  suggestionId: string;
  authorId: string;
  createdAt: string;
  kind: 'insert' | 'delete';
};

function readSuggestionFromMark(mark: {
  type: { name: string };
  attrs: Record<string, unknown>;
}): Omit<SpanEnd, 'pos'> | null {
  if (mark.type.name !== 'suggestionInsert' && mark.type.name !== 'suggestionDelete') return null;
  const suggestionId = mark.attrs.suggestionId;
  const authorId = mark.attrs.authorId;
  const createdAt = mark.attrs.createdAt;
  if (
    typeof suggestionId !== 'string' ||
    typeof authorId !== 'string' ||
    typeof createdAt !== 'string'
  ) {
    return null;
  }
  return {
    suggestionId,
    authorId,
    createdAt,
    kind: mark.type.name === 'suggestionInsert' ? 'insert' : 'delete',
  };
}

function collectSuggestionSpanEnds(doc: ProseMirrorNode): SpanEnd[] {
  const result: SpanEnd[] = [];
  let open: SpanEnd | null = null;

  const flush = () => {
    if (open) {
      result.push(open);
      open = null;
    }
  };

  doc.descendants((node, pos) => {
    if (!node.isText) return;

    const suggMark = node.marks.find(
      (m) => m.type.name === 'suggestionInsert' || m.type.name === 'suggestionDelete'
    );
    if (!suggMark) {
      flush();
      return;
    }

    const meta = readSuggestionFromMark(suggMark);
    if (!meta) {
      flush();
      return;
    }

    const endPos = pos + node.nodeSize;
    if (open && open.suggestionId === meta.suggestionId) {
      open.pos = endPos;
    } else {
      flush();
      open = { pos: endPos, ...meta };
    }
  });
  flush();
  return result;
}

function buildInitialsDecorations(
  doc: ProseMirrorNode,
  authorNameById: Record<string, string>,
  onHover: (target: SuggestionHoverTarget) => void,
  onLeave: () => void
): Decoration[] {
  const spans = collectSuggestionSpanEnds(doc);
  return spans.map((span) => {
    const name = authorNameById[span.authorId] ?? '?';
    const initials = initialsFromName(name);
    return Decoration.widget(
      span.pos,
      () => {
        const el = document.createElement('span');
        el.className = BADGE_CLASS;
        el.textContent = initials;
        el.title = name;
        el.dataset.suggestionId = span.suggestionId;
        el.dataset.authorId = span.authorId;
        el.dataset.createdAt = span.createdAt;
        el.dataset.suggestionKind = span.kind;
        el.addEventListener('mouseenter', () => {
          onHover({
            suggestionId: span.suggestionId,
            authorId: span.authorId,
            createdAt: span.createdAt,
            kind: span.kind,
            anchorRect: el.getBoundingClientRect(),
          });
        });
        el.addEventListener('mouseleave', () => {
          onLeave();
        });
        return el;
      },
      { side: 1, key: `sugg-badge-${span.suggestionId}` }
    );
  });
}

export const SuggestionHoverExtension = Extension.create<SuggestionHoverExtensionOptions>({
  name: 'suggestionHover',

  addOptions() {
    return {
      authorNameById: {},
      onHoverChange: () => {},
      onHoverLeave: () => {},
    };
  },

  addProseMirrorPlugins() {
    const readOptions = (): SuggestionHoverExtensionOptions => ({
      authorNameById: this.options.authorNameById,
      onHoverChange: this.options.onHoverChange,
      onHoverLeave: this.options.onHoverLeave,
    });

    return [
      new Plugin({
        key: pluginKey,
        state: {
          init: (_, state) => {
            const opts = readOptions();
            return DecorationSet.create(
              state.doc,
              buildInitialsDecorations(
                state.doc,
                opts.authorNameById,
                (t) => opts.onHoverChange(t),
                () => opts.onHoverLeave()
              )
            );
          },
          apply(tr, old, _oldState, newState) {
            if (!tr.docChanged && !tr.getMeta(pluginKey) && !tr.getMeta('suggestionHoverRefresh')) {
              return old.map(tr.mapping, tr.doc);
            }
            const opts = readOptions();
            return DecorationSet.create(
              newState.doc,
              buildInitialsDecorations(
                newState.doc,
                opts.authorNameById,
                (t) => opts.onHoverChange(t),
                () => opts.onHoverLeave()
              )
            );
          },
        },
        props: {
          decorations(state) {
            return pluginKey.getState(state) as DecorationSet | undefined;
          },
        },
      }),
    ];
  },
});
