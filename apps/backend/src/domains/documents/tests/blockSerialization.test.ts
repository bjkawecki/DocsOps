import { describe, it, expect } from 'vitest';
import { parseBlockDocumentV0 } from '../services/blocks/blockSchema.js';
import { markdownToBlockDocumentV0 } from '../services/blocks/markdownToBlocks.js';
import { blockDocumentV0ToMarkdown } from '../services/blocks/blocksToMarkdown.js';
import { blockDocumentV0ToSearchableText } from '../services/blocks/blocksPlaintext.js';
import { exampleBlockDocumentV0 } from '../services/blocks/blockSchema.js';

describe('block serialization (EPIC-2)', () => {
  it('PR-2a: markdown round-trip output parses as v0 document', () => {
    const md = [
      '# Titel',
      '',
      'Ein Absatz.',
      '',
      '- Punkt a',
      '- Punkt b',
      '',
      '```ts',
      'const x = 1',
      '```',
    ].join('\n');
    const doc = markdownToBlockDocumentV0(md);
    expect(() => parseBlockDocumentV0(doc)).not.toThrow();
    const again = blockDocumentV0ToMarkdown(doc);
    const round = markdownToBlockDocumentV0(again);
    expect(round.schemaVersion).toBe(0);
    expect(round.blocks.length).toBeGreaterThanOrEqual(1);
  });

  it('PR-2b: heading and paragraph survive round-trip semantically', () => {
    const md = '# Hello\n\nWorld line.';
    const doc = markdownToBlockDocumentV0(md);
    const out = blockDocumentV0ToMarkdown(doc);
    expect(out).toContain('# Hello');
    expect(out).toContain('World line.');
  });

  it('PR-2c: searchable text includes visible words', () => {
    const text = blockDocumentV0ToSearchableText(exampleBlockDocumentV0);
    expect(text).toContain('Titel');
    expect(text).toContain('Absatztext');
  });

  it('exports inline marks to markdown', () => {
    const doc = {
      schemaVersion: 1 as const,
      blocks: [
        {
          id: 'p1',
          type: 'paragraph',
          content: [
            { id: 't1', type: 'text', meta: { text: 'bold', marks: ['bold'] } },
            { id: 't2', type: 'text', meta: { text: ' text' } },
          ],
        },
      ],
    };
    const md = blockDocumentV0ToMarkdown(doc);
    expect(md).toContain('**bold**');
    expect(md).toContain(' text');
  });

  it('exports inline links to markdown (ADR 005)', () => {
    const doc = {
      schemaVersion: 1 as const,
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
            { id: 't2', type: 'text', meta: { text: ' and ' } },
            { id: 't3', type: 'text', meta: { text: 'intro', link: { href: '#intro' } } },
          ],
        },
      ],
    };
    const md = blockDocumentV0ToMarkdown(doc);
    expect(md).toContain('[**Docs**](https://example.com)');
    expect(md).toContain('[intro](#intro)');
  });

  it('exports cross-document links as docsops-doc tokens (ADR 006)', () => {
    const doc = {
      schemaVersion: 1 as const,
      blocks: [
        {
          id: 'p1',
          type: 'paragraph',
          content: [
            {
              id: 't1',
              type: 'text',
              meta: { text: 'Related', link: { documentId: 'clxxxxxxxxxxxxxxxxxx' } },
            },
          ],
        },
      ],
    };
    const md = blockDocumentV0ToMarkdown(doc);
    expect(md).toContain('[Related](docsops-doc:clxxxxxxxxxxxxxxxxxx)');
  });

  it('exports image blocks with Figure numbering (§28a)', () => {
    const doc = {
      schemaVersion: 0 as const,
      blocks: [
        {
          id: 'i1',
          type: 'image',
          attrs: { attachmentId: 'att_a', caption: 'Overview' },
        },
        {
          id: 'i2',
          type: 'image',
          attrs: { attachmentId: 'att_b' },
        },
      ],
    };
    const md = blockDocumentV0ToMarkdown(doc);
    expect(md).toContain('![Figure 1: Overview](docsops-attachment:att_a)');
    expect(md).toContain('![Figure 2](docsops-attachment:att_b)');
  });

  it('exports and imports ordered list, blockquote and horizontal rule', () => {
    const md = ['1. First', '2. Second', '', '> Quoted line', '', '---'].join('\n');
    const doc = markdownToBlockDocumentV0(md);
    expect(doc.blocks.map((b) => b.type)).toEqual([
      'ordered_list',
      'blockquote',
      'horizontal_rule',
    ]);
    const out = blockDocumentV0ToMarkdown(doc);
    expect(out).toContain('1. First');
    expect(out).toContain('2. Second');
    expect(out).toContain('> Quoted line');
    expect(out).toContain('---');
  });

  it('exports and imports GFM alert callouts (§28a)', () => {
    const md = [
      '> [!WARNING]',
      '> Watch the disk',
      '',
      '> [!NOTE]',
      '> Info body',
      '',
      '> [!TIP]',
      '> Tip body',
    ].join('\n');
    const doc = markdownToBlockDocumentV0(md);
    expect(doc.blocks.map((b) => b.type)).toEqual(['callout', 'callout', 'callout']);
    expect(doc.blocks.map((b) => b.attrs?.variant)).toEqual(['warning', 'info', 'tip']);
    const out = blockDocumentV0ToMarkdown(doc);
    expect(out).toContain('> [!WARNING]');
    expect(out).toContain('> Watch the disk');
    expect(out).toContain('> [!NOTE]');
    expect(out).toContain('> [!TIP]');
    const round = markdownToBlockDocumentV0(out);
    expect(round.blocks.map((b) => b.attrs?.variant)).toEqual(['warning', 'info', 'tip']);
  });

  it('exports and imports mermaid fences (§28a)', () => {
    const md = ['```mermaid', 'flowchart LR', '  A --> B', '```'].join('\n');
    const doc = markdownToBlockDocumentV0(md);
    expect(doc.blocks.map((b) => b.type)).toEqual(['mermaid']);
    expect(doc.blocks[0]?.attrs).toEqual({});
    const out = blockDocumentV0ToMarkdown(doc);
    expect(out).toContain('```mermaid');
    expect(out).toContain('flowchart LR');
    expect(out).toContain('A --> B');
    const round = markdownToBlockDocumentV0(out);
    expect(round.blocks[0]?.type).toBe('mermaid');
  });

  it('exports and imports GFM tables', () => {
    const md = ['| Name | Role |', '| --- | --- |', '| Ada | Lead |'].join('\n');
    const doc = markdownToBlockDocumentV0(md);
    expect(doc.blocks.map((b) => b.type)).toEqual(['table']);
    expect(doc.blocks[0]?.content?.[0]?.content?.[0]?.type).toBe('table_header');
    const out = blockDocumentV0ToMarkdown(doc);
    expect(out).toContain('| Name | Role |');
    expect(out).toContain('| Ada | Lead |');
  });

  it('strips pending suggestions from markdown export', () => {
    const doc = {
      schemaVersion: 1 as const,
      blocks: [
        {
          id: 'p1',
          type: 'paragraph',
          content: [
            { id: 't1', type: 'text', meta: { text: 'Keep' } },
            {
              id: 't2',
              type: 'text',
              meta: {
                text: 'NEW',
                suggestion: {
                  id: 's1',
                  kind: 'insert',
                  authorId: 'author-a',
                  status: 'pending',
                  createdAt: '2026-06-16T10:00:00.000Z',
                },
              },
            },
            {
              id: 't3',
              type: 'text',
              meta: {
                text: 'DROP',
                suggestion: {
                  id: 's2',
                  kind: 'delete',
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
    const md = blockDocumentV0ToMarkdown(doc);
    expect(md).toContain('Keep');
    expect(md).not.toContain('NEW');
    expect(md).not.toContain('DROP');
  });
});
