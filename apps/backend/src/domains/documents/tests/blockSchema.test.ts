import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PrismaClient } from '../../../../generated/prisma/client.js';
import {
  exampleBlockDocumentV0,
  parseBlockDocumentV0,
  safeParseBlockDocumentV0,
  safeParseBlockDocument,
  normalizeBlockDocumentSchemaVersion,
  blockDocumentUsesInlineMarks,
  isAllowedLinkHref,
  assertBlockDocumentLinksValid,
  assertBlockDocumentImagesValid,
  assertBlockDocumentCalloutsValid,
  InvalidBlockCalloutError,
  InvalidBlockLinkHrefError,
  InvalidBlockDocumentLinkError,
  InvalidBlockImageError,
} from '../services/blocks/blockSchema.js';
import { canRead } from '../permissions/canRead.js';

vi.mock('../permissions/canRead.js', () => ({
  canRead: vi.fn(),
}));

function makePrisma(opts: { documentExists: boolean }): PrismaClient {
  return {
    document: {
      findFirst: vi.fn().mockResolvedValue(opts.documentExists ? { id: 'doc_target' } : null),
    },
  } as unknown as PrismaClient;
}

describe('blockSchema v0', () => {
  it('parses the bundled example', () => {
    const parsed = parseBlockDocumentV0(exampleBlockDocumentV0);
    expect(parsed.schemaVersion).toBe(0);
    expect(parsed.blocks).toHaveLength(2);
    expect(parsed.blocks[0]?.type).toBe('heading');
  });

  it('rejects wrong schemaVersion for v0-only parser', () => {
    const bad = { schemaVersion: 1, blocks: [] };
    const r = safeParseBlockDocumentV0(bad);
    expect(r.success).toBe(false);
  });

  it('rejects empty block id', () => {
    const bad = { schemaVersion: 0, blocks: [{ id: '', type: 'paragraph' }] };
    const r = safeParseBlockDocumentV0(bad);
    expect(r.success).toBe(false);
  });
});

describe('blockSchema v1', () => {
  it('accepts v1 documents via union parser', () => {
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
              meta: { text: 'Hello', marks: ['bold'] },
            },
          ],
        },
      ],
    };
    const r = safeParseBlockDocument(doc);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.schemaVersion).toBe(1);
  });

  it('normalizes to v1 when marks are present', () => {
    const doc = {
      schemaVersion: 0 as const,
      blocks: [
        {
          id: 'p1',
          type: 'paragraph',
          content: [{ id: 't1', type: 'text', meta: { text: 'x', marks: ['italic'] } }],
        },
      ],
    };
    expect(blockDocumentUsesInlineMarks(doc)).toBe(true);
    const normalized = normalizeBlockDocumentSchemaVersion(doc);
    expect(normalized.schemaVersion).toBe(1);
  });

  it('keeps v0 when no marks', () => {
    const normalized = normalizeBlockDocumentSchemaVersion(exampleBlockDocumentV0);
    expect(normalized.schemaVersion).toBe(0);
  });

  it('normalizes to v1 when meta.link is present', () => {
    const doc = {
      schemaVersion: 0 as const,
      blocks: [
        {
          id: 'p1',
          type: 'paragraph',
          content: [
            {
              id: 't1',
              type: 'text',
              meta: { text: 'docs', link: { href: 'https://example.com' } },
            },
          ],
        },
      ],
    };
    expect(blockDocumentUsesInlineMarks(doc)).toBe(true);
    expect(normalizeBlockDocumentSchemaVersion(doc).schemaVersion).toBe(1);
  });
});

describe('blockSchema link href (ADR 005 / 006)', () => {
  beforeEach(() => {
    vi.mocked(canRead).mockReset();
  });

  it('allows http(s) and hash slugs', () => {
    expect(isAllowedLinkHref('https://example.com/path')).toBe(true);
    expect(isAllowedLinkHref('http://example.com')).toBe(true);
    expect(isAllowedLinkHref('#heading-slug')).toBe(true);
  });

  it('rejects javascript, mailto, and relative paths', () => {
    expect(isAllowedLinkHref('javascript:alert(1)')).toBe(false);
    expect(isAllowedLinkHref('mailto:a@b.c')).toBe(false);
    expect(isAllowedLinkHref('/documents/x')).toBe(false);
    expect(isAllowedLinkHref('#')).toBe(false);
    expect(isAllowedLinkHref('#bad slug')).toBe(false);
  });

  it('assertBlockDocumentLinksValid rejects bad href', async () => {
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
              meta: { text: 'x', link: { href: 'javascript:void(0)' } },
            },
          ],
        },
      ],
    };
    await expect(
      assertBlockDocumentLinksValid(makePrisma({ documentExists: true }), 'user_1', doc)
    ).rejects.toThrow(InvalidBlockLinkHrefError);
  });

  it('assertBlockDocumentLinksValid accepts https and hash', async () => {
    const doc = {
      schemaVersion: 1 as const,
      blocks: [
        {
          id: 'p1',
          type: 'paragraph',
          content: [
            { id: 't1', type: 'text', meta: { text: 'a', link: { href: 'https://a.example' } } },
            { id: 't2', type: 'text', meta: { text: 'b', link: { href: '#intro' } } },
          ],
        },
      ],
    };
    await expect(
      assertBlockDocumentLinksValid(makePrisma({ documentExists: true }), 'user_1', doc)
    ).resolves.toBeUndefined();
  });

  it('assertBlockDocumentLinksValid accepts readable documentId', async () => {
    vi.mocked(canRead).mockResolvedValue(true);
    const doc = {
      schemaVersion: 1 as const,
      blocks: [
        {
          id: 'p1',
          type: 'paragraph',
          content: [
            { id: 't1', type: 'text', meta: { text: 'other', link: { documentId: 'doc_target' } } },
          ],
        },
      ],
    };
    await expect(
      assertBlockDocumentLinksValid(makePrisma({ documentExists: true }), 'user_1', doc)
    ).resolves.toBeUndefined();
    expect(canRead).toHaveBeenCalledWith(expect.anything(), 'user_1', 'doc_target');
  });

  it('assertBlockDocumentLinksValid rejects unknown documentId', async () => {
    const doc = {
      schemaVersion: 1 as const,
      blocks: [
        {
          id: 'p1',
          type: 'paragraph',
          content: [
            { id: 't1', type: 'text', meta: { text: 'x', link: { documentId: 'missing' } } },
          ],
        },
      ],
    };
    await expect(
      assertBlockDocumentLinksValid(makePrisma({ documentExists: false }), 'user_1', doc)
    ).rejects.toThrow(InvalidBlockDocumentLinkError);
  });

  it('assertBlockDocumentLinksValid rejects unread documentId', async () => {
    vi.mocked(canRead).mockResolvedValue(false);
    const doc = {
      schemaVersion: 1 as const,
      blocks: [
        {
          id: 'p1',
          type: 'paragraph',
          content: [
            { id: 't1', type: 'text', meta: { text: 'x', link: { documentId: 'doc_target' } } },
          ],
        },
      ],
    };
    await expect(
      assertBlockDocumentLinksValid(makePrisma({ documentExists: true }), 'user_1', doc)
    ).rejects.toThrow(InvalidBlockDocumentLinkError);
  });

  it('assertBlockDocumentLinksValid rejects malformed link meta', async () => {
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
              meta: { text: 'x', link: { href: 'https://a.example', documentId: 'doc_target' } },
            },
          ],
        },
      ],
    };
    await expect(
      assertBlockDocumentLinksValid(makePrisma({ documentExists: true }), 'user_1', doc)
    ).rejects.toThrow(InvalidBlockDocumentLinkError);
  });
});

describe('blockSchema image blocks (§28a)', () => {
  it('assertBlockDocumentImagesValid rejects missing attachmentId', () => {
    const doc = {
      schemaVersion: 0 as const,
      blocks: [{ id: 'i1', type: 'image', attrs: {} }],
    };
    expect(() => assertBlockDocumentImagesValid(doc, new Set())).toThrow(InvalidBlockImageError);
  });

  it('assertBlockDocumentImagesValid rejects unknown attachmentId', () => {
    const doc = {
      schemaVersion: 0 as const,
      blocks: [{ id: 'i1', type: 'image', attrs: { attachmentId: 'att_missing' } }],
    };
    expect(() => assertBlockDocumentImagesValid(doc, new Set(['att_other']))).toThrow(
      InvalidBlockImageError
    );
  });

  it('assertBlockDocumentImagesValid accepts known attachmentId', () => {
    const doc = {
      schemaVersion: 0 as const,
      blocks: [
        {
          id: 'i1',
          type: 'image',
          attrs: { attachmentId: 'att_ok', caption: 'Overview' },
        },
      ],
    };
    expect(() => assertBlockDocumentImagesValid(doc, new Set(['att_ok']))).not.toThrow();
  });
});

describe('blockSchema callout blocks (§28a)', () => {
  it('assertBlockDocumentCalloutsValid rejects missing variant', () => {
    const doc = {
      schemaVersion: 0 as const,
      blocks: [{ id: 'c1', type: 'callout', attrs: {}, content: [] }],
    };
    expect(() => assertBlockDocumentCalloutsValid(doc)).toThrow(InvalidBlockCalloutError);
  });

  it('assertBlockDocumentCalloutsValid rejects invalid variant', () => {
    const doc = {
      schemaVersion: 0 as const,
      blocks: [{ id: 'c1', type: 'callout', attrs: { variant: 'danger' }, content: [] }],
    };
    expect(() => assertBlockDocumentCalloutsValid(doc)).toThrow(InvalidBlockCalloutError);
  });

  it('assertBlockDocumentCalloutsValid accepts info|warning|tip', () => {
    for (const variant of ['info', 'warning', 'tip'] as const) {
      const doc = {
        schemaVersion: 0 as const,
        blocks: [
          {
            id: 'c1',
            type: 'callout',
            attrs: { variant },
            content: [
              {
                id: 'p1',
                type: 'paragraph',
                content: [{ id: 't1', type: 'text', meta: { text: 'Note body' } }],
              },
            ],
          },
        ],
      };
      expect(() => assertBlockDocumentCalloutsValid(doc)).not.toThrow();
    }
  });
});
