import { describe, expect, it } from 'vitest';
import {
  blockDocumentToTiptapJson,
  ensureUniqueBlockIdsInDocument,
  tiptapJsonToBlockDocument,
} from './blockDocumentTiptap.js';
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

describe('ensureUniqueBlockIdsInDocument', () => {
  it('assigns new ids for duplicate top-level blocks', () => {
    const doc: BlockDocumentV0 = {
      schemaVersion: 0,
      blocks: [
        {
          id: 'dup',
          type: 'paragraph',
          content: [{ id: 't1', type: 'text', meta: { text: 'A' } }],
        },
        {
          id: 'dup',
          type: 'paragraph',
          content: [{ id: 't2', type: 'text', meta: { text: 'B' } }],
        },
      ],
    };
    const fixed = ensureUniqueBlockIdsInDocument(doc);
    const ids = fixed.blocks.map((b) => b.id);
    expect(new Set(ids).size).toBe(2);
    expect(ids[0]).toBe('dup');
    expect(ids[1]).not.toBe('dup');
  });
});

describe('tiptapJsonToBlockDocument', () => {
  it('deduplicates blockIds copied by ProseMirror split', () => {
    const sharedId = 'e01a04be-6e45-4e5d-81c9-700b507324c4';
    const doc = tiptapJsonToBlockDocument({
      type: 'doc',
      content: [
        { type: 'paragraph', attrs: { blockId: sharedId }, content: [{ type: 'text', text: 'A' }] },
        { type: 'paragraph', attrs: { blockId: sharedId }, content: [{ type: 'text', text: 'B' }] },
      ],
    });
    const ids = doc.blocks.map((b) => b.id);
    expect(new Set(ids).size).toBe(2);
  });
});
