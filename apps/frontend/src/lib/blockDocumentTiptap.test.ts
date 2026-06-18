import { describe, expect, it } from 'vitest';
import { blockDocumentToTiptapJson } from './blockDocumentTiptap.js';
import type { BlockDocumentV0 } from '../api/document-types';

function hasEmptyTextNode(node: unknown): boolean {
  if (!node || typeof node !== 'object') return false;
  const n = node as { type?: string; text?: string; content?: unknown[] };
  if (n.type === 'text' && n.text === '') return true;
  return (n.content ?? []).some((child) => hasEmptyTextNode(child));
}

describe('blockDocumentToTiptapJson', () => {
  it('does not emit empty ProseMirror text nodes', () => {
    const doc: BlockDocumentV0 = {
      schemaVersion: 0,
      blocks: [
        {
          id: 'p1',
          type: 'paragraph',
          content: [{ id: 't1', type: 'text', attrs: {}, meta: { text: '' } }],
        },
        {
          id: 'h1',
          type: 'heading',
          attrs: { level: 2 },
          content: [{ id: 't2', type: 'text', attrs: {}, meta: { text: 'Title' } }],
        },
      ],
    };
    const json = blockDocumentToTiptapJson(doc);
    expect(hasEmptyTextNode(json)).toBe(false);
    const paragraph = json.content?.[0];
    expect(paragraph?.type).toBe('paragraph');
    expect(paragraph?.content).toEqual([]);
  });
});
