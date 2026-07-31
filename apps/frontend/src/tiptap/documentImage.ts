import Image from '@tiptap/extension-image';
import { NodeSelection, Plugin, PluginKey, type EditorState } from '@tiptap/pm/state';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { DocumentImageNodeView } from '../components/documents/DocumentImageNodeView.js';

const imageDeleteGuardKey = new PluginKey('documentImageDeleteGuard');

function rangeIncludesImage(state: EditorState, from: number, to: number): boolean {
  let found = false;
  state.doc.nodesBetween(from, to, (node) => {
    if (node.type.name === 'image') {
      found = true;
      return false;
    }
    return undefined;
  });
  return found;
}

function backspaceOrDeleteWouldRemoveImage(
  state: EditorState,
  key: 'Backspace' | 'Delete'
): boolean {
  const { selection } = state;
  if (selection instanceof NodeSelection && selection.node.type.name === 'image') {
    return true;
  }
  if (!selection.empty) {
    return rangeIncludesImage(state, selection.from, selection.to);
  }
  if (key === 'Backspace' && selection.$from.nodeBefore?.type.name === 'image') {
    return true;
  }
  if (key === 'Delete' && selection.$from.nodeAfter?.type.name === 'image') {
    return true;
  }
  return false;
}

/**
 * Block image (§28a): atom node with attachmentId + optional caption/alt.
 * `src` is display-only (API proxy URL); persistence uses attachmentId.
 * Accidental keyboard/cut deletion is blocked – remove only via the NodeView X control.
 */
export const DocumentImage = Image.extend({
  name: 'image',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      blockId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-block-id'),
        renderHTML: (attributes) => {
          const id = attributes.blockId as string | null | undefined;
          if (!id) return {};
          return { 'data-block-id': id };
        },
      },
      attachmentId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-attachment-id'),
        renderHTML: (attributes) => {
          const id = attributes.attachmentId as string | null | undefined;
          if (!id) return {};
          return { 'data-attachment-id': id };
        },
      },
      caption: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-caption') ?? '',
        renderHTML: (attributes) => {
          const caption = attributes.caption as string | null | undefined;
          if (!caption) return {};
          return { 'data-caption': caption };
        },
      },
      alt: {
        default: '',
      },
      src: {
        default: null,
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      ...(this.parent?.() ?? []),
      new Plugin({
        key: imageDeleteGuardKey,
        props: {
          handleKeyDown(view, event) {
            if (event.key !== 'Backspace' && event.key !== 'Delete') return false;
            if (!backspaceOrDeleteWouldRemoveImage(view.state, event.key)) return false;
            event.preventDefault();
            return true;
          },
          handleDOMEvents: {
            cut(view, event) {
              const { from, to } = view.state.selection;
              if (!rangeIncludesImage(view.state, from, to)) return false;
              event.preventDefault();
              return true;
            },
          },
          handleTextInput(view) {
            const { selection } = view.state;
            if (selection instanceof NodeSelection && selection.node.type.name === 'image') {
              return true;
            }
            if (!selection.empty && rangeIncludesImage(view.state, selection.from, selection.to)) {
              return true;
            }
            return false;
          },
        },
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DocumentImageNodeView);
  },
});
