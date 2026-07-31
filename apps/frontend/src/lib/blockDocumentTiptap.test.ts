import { describe, expect, it } from 'vitest';
import {
  blockDocumentToTiptapJson,
  ensureUniqueBlockIdsInDocument,
  tiptapJsonToBlockDocument,
} from './blockDocumentTiptap.js';
import type { BlockDocument, BlockDocumentV0 } from '../api/document-types';

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

  it('preserves bold/italic/code marks as schema v1', () => {
    const doc = tiptapJsonToBlockDocument({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { blockId: 'p1' },
          content: [
            { type: 'text', text: 'Hello ' },
            { type: 'text', text: 'world', marks: [{ type: 'bold' }] },
          ],
        },
      ],
    });
    expect(doc.schemaVersion).toBe(1);
    const textNodes = doc.blocks[0]?.content ?? [];
    expect(
      textNodes.some((n) => Array.isArray(n.meta?.marks) && n.meta.marks.includes('bold'))
    ).toBe(true);
  });

  it('roundtrips marks through tiptap json', () => {
    const source: BlockDocument = {
      schemaVersion: 1,
      blocks: [
        {
          id: 'p1',
          type: 'paragraph',
          content: [
            { id: 't1', type: 'text', meta: { text: 'bold bit', marks: ['bold'] } },
            { id: 't2', type: 'text', meta: { text: ' normal' } },
          ],
        },
      ],
    };
    const json = blockDocumentToTiptapJson(source);
    const back = tiptapJsonToBlockDocument(json);
    expect(back.schemaVersion).toBe(1);
    expect(back.blocks[0]?.content?.[0]?.meta?.marks).toEqual(['bold']);
  });

  it('roundtrips link with bold through tiptap json (ADR 005)', () => {
    const source: BlockDocument = {
      schemaVersion: 1,
      blocks: [
        {
          id: 'p1',
          type: 'paragraph',
          content: [
            {
              id: 't1',
              type: 'text',
              meta: { text: 'Docs', marks: ['bold'], link: { href: 'https://example.com' } },
            },
            { id: 't2', type: 'text', meta: { text: ' ', link: { href: '#intro' } } },
          ],
        },
      ],
    };
    const json = blockDocumentToTiptapJson(source);
    const back = tiptapJsonToBlockDocument(json);
    expect(back.schemaVersion).toBe(1);
    const leaves = back.blocks[0]?.content ?? [];
    expect(leaves[0]?.meta?.marks).toEqual(['bold']);
    expect(leaves[0]?.meta?.link).toEqual({ href: 'https://example.com' });
    expect(leaves[1]?.meta?.link).toEqual({ href: '#intro' });
  });

  it('drops disallowed link schemes when importing from tiptap', () => {
    const doc = tiptapJsonToBlockDocument({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { blockId: 'p1' },
          content: [
            {
              type: 'text',
              text: 'bad',
              marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
            },
          ],
        },
      ],
    });
    const leaf = doc.blocks[0]?.content?.[0];
    expect(leaf?.meta?.link).toBeUndefined();
    expect(leaf?.meta?.text).toBe('bad');
  });

  it('roundtrips code mark on pending insert suggestion', () => {
    const source: BlockDocument = {
      schemaVersion: 1,
      blocks: [
        {
          id: 'p1',
          type: 'paragraph',
          content: [
            {
              id: 't1',
              type: 'text',
              meta: {
                text: 'fn',
                marks: ['code'],
                suggestion: {
                  id: 's1',
                  kind: 'insert',
                  authorId: 'author-a',
                  status: 'pending',
                  createdAt: '2026-06-16T10:00:00.000Z',
                },
              },
            },
          ],
        },
      ],
    };
    const json = blockDocumentToTiptapJson(source);
    const back = tiptapJsonToBlockDocument(json);
    const leaf = back.blocks[0]?.content?.[0];
    expect(leaf?.meta?.marks).toEqual(['code']);
    expect(leaf?.meta?.suggestion).toMatchObject({ id: 's1', kind: 'insert' });
  });

  it('roundtrips canon with pending insert suggestion without changing block ids', () => {
    const source: BlockDocument = {
      schemaVersion: 1,
      blocks: [
        {
          id: 'p1',
          type: 'paragraph',
          content: [
            { id: 't1', type: 'text', meta: { text: 'Hello' } },
            {
              id: 't2',
              type: 'text',
              meta: {
                text: ' world',
                suggestion: {
                  id: 's1',
                  kind: 'insert',
                  authorId: 'author-a',
                  status: 'pending',
                  createdAt: '2026-06-16T10:00:00.000Z',
                },
              },
            },
          ],
        },
      ],
    };
    const json = blockDocumentToTiptapJson(source);
    const back = tiptapJsonToBlockDocument(json);
    expect(back.blocks.map((b) => b.id)).toEqual(['p1']);
    expect(back.blocks[0]?.content?.[0]?.meta?.text).toBe('Hello');
    expect(back.blocks[0]?.content?.[1]?.meta?.suggestion).toMatchObject({
      id: 's1',
      kind: 'insert',
      authorId: 'author-a',
      status: 'pending',
    });
    expect(back.blocks[0]?.content?.[0]?.meta?.suggestion).toBeUndefined();
  });

  it('roundtrips ordered list, blockquote and horizontal rule', () => {
    const source: BlockDocument = {
      schemaVersion: 0,
      blocks: [
        {
          id: 'ol1',
          type: 'ordered_list',
          content: [
            {
              id: 'li1',
              type: 'list_item',
              content: [
                {
                  id: 'p1',
                  type: 'paragraph',
                  content: [{ id: 't1', type: 'text', meta: { text: 'First' } }],
                },
              ],
            },
            {
              id: 'li2',
              type: 'list_item',
              content: [
                {
                  id: 'p2',
                  type: 'paragraph',
                  content: [{ id: 't2', type: 'text', meta: { text: 'Second' } }],
                },
              ],
            },
          ],
        },
        {
          id: 'bq1',
          type: 'blockquote',
          content: [
            {
              id: 'p3',
              type: 'paragraph',
              content: [{ id: 't3', type: 'text', meta: { text: 'Quoted' } }],
            },
          ],
        },
        { id: 'hr1', type: 'horizontal_rule', attrs: {} },
      ],
    };
    const json = blockDocumentToTiptapJson(source);
    expect(json.content?.map((n) => n.type)).toEqual([
      'orderedList',
      'blockquote',
      'horizontalRule',
    ]);
    const back = tiptapJsonToBlockDocument(json);
    expect(back.blocks.map((b) => b.type)).toEqual([
      'ordered_list',
      'blockquote',
      'horizontal_rule',
    ]);
    expect(back.blocks[0]?.content?.[0]?.content?.[0]?.content?.[0]?.meta?.text).toBe('First');
    expect(back.blocks[1]?.content?.[0]?.content?.[0]?.meta?.text).toBe('Quoted');
    expect(back.blocks[2]?.id).toBe('hr1');
  });

  it('roundtrips table with header and body cells', () => {
    const source: BlockDocument = {
      schemaVersion: 0,
      blocks: [
        {
          id: 'tbl1',
          type: 'table',
          content: [
            {
              id: 'r1',
              type: 'table_row',
              content: [
                {
                  id: 'h1',
                  type: 'table_header',
                  content: [
                    {
                      id: 'p1',
                      type: 'paragraph',
                      content: [{ id: 't1', type: 'text', meta: { text: 'Name' } }],
                    },
                  ],
                },
                {
                  id: 'h2',
                  type: 'table_header',
                  content: [
                    {
                      id: 'p2',
                      type: 'paragraph',
                      content: [{ id: 't2', type: 'text', meta: { text: 'Role' } }],
                    },
                  ],
                },
              ],
            },
            {
              id: 'r2',
              type: 'table_row',
              content: [
                {
                  id: 'c1',
                  type: 'table_cell',
                  content: [
                    {
                      id: 'p3',
                      type: 'paragraph',
                      content: [{ id: 't3', type: 'text', meta: { text: 'Ada' } }],
                    },
                  ],
                },
                {
                  id: 'c2',
                  type: 'table_cell',
                  content: [
                    {
                      id: 'p4',
                      type: 'paragraph',
                      content: [{ id: 't4', type: 'text', meta: { text: 'Lead' } }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const json = blockDocumentToTiptapJson(source);
    expect(json.content?.[0]?.type).toBe('table');
    const back = tiptapJsonToBlockDocument(json);
    expect(back.blocks[0]?.type).toBe('table');
    expect(back.blocks[0]?.content?.[0]?.content?.[0]?.type).toBe('table_header');
    expect(back.blocks[0]?.content?.[1]?.content?.[0]?.content?.[0]?.content?.[0]?.meta?.text).toBe(
      'Ada'
    );
  });

  it('round-trips image blocks with attachmentId and caption (§28a)', () => {
    const source: BlockDocument = {
      schemaVersion: 0,
      blocks: [
        {
          id: 'img1',
          type: 'image',
          attrs: { attachmentId: 'att_abc', caption: 'Overview', alt: 'Diagram' },
        },
      ],
    };
    const json = blockDocumentToTiptapJson(source, { documentId: 'doc1' });
    expect(json.content?.[0]?.type).toBe('image');
    expect(json.content?.[0]?.attrs?.attachmentId).toBe('att_abc');
    expect(json.content?.[0]?.attrs?.src).toBe('/api/v1/documents/doc1/attachments/att_abc');
    const back = tiptapJsonToBlockDocument(json);
    expect(back.blocks[0]?.type).toBe('image');
    expect(back.blocks[0]?.attrs?.attachmentId).toBe('att_abc');
    expect(back.blocks[0]?.attrs?.caption).toBe('Overview');
    expect(back.blocks[0]?.attrs?.alt).toBe('Diagram');
    expect(back.blocks[0]?.attrs?.src).toBeUndefined();
  });

  it('round-trips callout blocks with variant (§28a)', () => {
    const source: BlockDocument = {
      schemaVersion: 0,
      blocks: [
        {
          id: 'c1',
          type: 'callout',
          attrs: { variant: 'warning' },
          content: [
            {
              id: 'p1',
              type: 'paragraph',
              content: [{ id: 't1', type: 'text', meta: { text: 'Watch disk space' } }],
            },
          ],
        },
      ],
    };
    const json = blockDocumentToTiptapJson(source);
    expect(json.content?.[0]?.type).toBe('callout');
    expect(json.content?.[0]?.attrs?.variant).toBe('warning');
    expect(json.content?.[0]?.attrs?.blockId).toBe('c1');
    const back = tiptapJsonToBlockDocument(json);
    expect(back.blocks[0]?.type).toBe('callout');
    expect(back.blocks[0]?.id).toBe('c1');
    expect(back.blocks[0]?.attrs?.variant).toBe('warning');
    expect(back.blocks[0]?.content?.[0]?.content?.[0]?.meta?.text).toBe('Watch disk space');
  });

  it('round-trips mermaid blocks (§28a)', () => {
    const source: BlockDocument = {
      schemaVersion: 0,
      blocks: [
        {
          id: 'm1',
          type: 'mermaid',
          attrs: {},
          content: [{ id: 't1', type: 'text', meta: { text: 'flowchart LR\n  A --> B' } }],
        },
      ],
    };
    const json = blockDocumentToTiptapJson(source);
    expect(json.content?.[0]?.type).toBe('mermaid');
    expect(json.content?.[0]?.attrs?.blockId).toBe('m1');
    expect(json.content?.[0]?.content?.[0]?.text).toBe('flowchart LR\n  A --> B');
    const back = tiptapJsonToBlockDocument(json);
    expect(back.blocks[0]?.type).toBe('mermaid');
    expect(back.blocks[0]?.id).toBe('m1');
    expect(back.blocks[0]?.content?.[0]?.meta?.text).toBe('flowchart LR\n  A --> B');
  });

  it('omits empty paragraphs without suggestions from export', () => {
    const doc = tiptapJsonToBlockDocument({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { blockId: 'p1' },
          content: [{ type: 'text', text: 'Hello' }],
        },
        { type: 'paragraph', attrs: { blockId: 'p-empty' }, content: [] },
        {
          type: 'paragraph',
          attrs: { blockId: 'p2' },
          content: [
            {
              type: 'text',
              text: 'New',
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
    expect(doc.blocks.map((b) => b.id)).toEqual(['p1', 'p2']);
    expect(doc.blocks).toHaveLength(2);
  });
});
