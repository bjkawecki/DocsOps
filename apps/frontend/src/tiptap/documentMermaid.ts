import { Node, mergeAttributes, type CommandProps } from '@tiptap/core';
import { NodeSelection, Plugin, PluginKey, type EditorState } from '@tiptap/pm/state';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { DocumentMermaidNodeView } from '../components/documents/DocumentMermaidNodeView.js';
import { randomId } from '../lib/randomId.js';

const DEFAULT_MERMAID_SOURCE = 'flowchart LR\n  A --> B';

const mermaidDeleteGuardKey = new PluginKey('documentMermaidDeleteGuard');

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mermaid: {
      /** Always insert a new Mermaid block (does not toggle/remove). */
      insertMermaid: (source?: string) => ReturnType;
    };
  }
}

function selectionCrossesOrCoversMermaid(state: EditorState, from: number, to: number): boolean {
  if (from === to) return false;
  let found = false;
  state.doc.nodesBetween(from, to, (node, pos) => {
    if (node.type.name !== 'mermaid') return;
    const nodeStart = pos;
    const nodeEnd = pos + node.nodeSize;
    const coversWhole = from <= nodeStart && to >= nodeEnd;
    const crossesStart = from < nodeStart && to > nodeStart;
    const crossesEnd = from < nodeEnd && to > nodeEnd;
    if (coversWhole || crossesStart || crossesEnd) {
      found = true;
      return false;
    }
    return undefined;
  });
  return found;
}

function backspaceOrDeleteWouldRemoveMermaid(
  state: EditorState,
  key: 'Backspace' | 'Delete'
): boolean {
  const { selection } = state;
  if (selection instanceof NodeSelection && selection.node.type.name === 'mermaid') {
    return true;
  }
  if (!selection.empty) {
    return selectionCrossesOrCoversMermaid(state, selection.from, selection.to);
  }

  const $from = selection.$from;
  let mermaidDepth = -1;
  for (let d = $from.depth; d > 0; d -= 1) {
    if ($from.node(d).type.name === 'mermaid') {
      mermaidDepth = d;
      break;
    }
  }

  if (mermaidDepth >= 0) {
    const mermaid = $from.node(mermaidDepth);
    const mermaidPos = $from.before(mermaidDepth);
    const contentStart = mermaidPos + 1;
    const contentEnd = mermaidPos + mermaid.nodeSize - 1;
    if (mermaid.content.size === 0) return true;
    if (key === 'Backspace' && selection.from <= contentStart) return true;
    if (key === 'Delete' && selection.from >= contentEnd) return true;
    return false;
  }

  if (key === 'Backspace' && $from.nodeBefore?.type.name === 'mermaid') return true;
  if (key === 'Delete' && $from.nodeAfter?.type.name === 'mermaid') return true;
  return false;
}

/**
 * Mermaid diagram block (§28a): editable source in the editor (no live render).
 * Accidental keyboard/cut deletion of the block is blocked – remove only via the NodeView X control.
 */
export const DocumentMermaid = Node.create({
  name: 'mermaid',
  group: 'block',
  content: 'text*',
  marks: '',
  code: true,
  defining: true,

  addAttributes() {
    return {
      blockId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-block-id'),
        renderHTML: (attributes) => {
          const id = attributes.blockId as string | null | undefined;
          if (!id) return {};
          return { 'data-block-id': id };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'pre[data-mermaid]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'pre',
      mergeAttributes({ 'data-mermaid': '' }, HTMLAttributes),
      ['code', { spellcheck: 'false' }, 0],
    ];
  },

  addCommands() {
    return {
      insertMermaid:
        (source = DEFAULT_MERMAID_SOURCE) =>
        ({ commands }: CommandProps) =>
          commands.insertContent({
            type: this.name,
            attrs: { blockId: randomId() },
            content: source.length > 0 ? [{ type: 'text', text: source }] : [],
          }),
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: mermaidDeleteGuardKey,
        props: {
          handleKeyDown(view, event) {
            if (event.key !== 'Backspace' && event.key !== 'Delete') return false;
            if (!backspaceOrDeleteWouldRemoveMermaid(view.state, event.key)) return false;
            event.preventDefault();
            return true;
          },
          handleDOMEvents: {
            cut(view, event) {
              const { from, to } = view.state.selection;
              if (!selectionCrossesOrCoversMermaid(view.state, from, to)) return false;
              event.preventDefault();
              return true;
            },
          },
          handleTextInput(view) {
            const { selection } = view.state;
            if (selection instanceof NodeSelection && selection.node.type.name === 'mermaid') {
              return true;
            }
            if (
              !selection.empty &&
              selectionCrossesOrCoversMermaid(view.state, selection.from, selection.to)
            ) {
              return true;
            }
            return false;
          },
        },
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DocumentMermaidNodeView);
  },
});

export { DEFAULT_MERMAID_SOURCE };
