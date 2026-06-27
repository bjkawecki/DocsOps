import { describe, it, expect } from 'vitest';
import { exampleBlockDocumentV0 } from '../services/blocks/blockSchema.js';
import {
  applyDraftOpsToDocument,
  computeDraftOpsFromDocuments,
  draftOpsArraySchema,
  DRAFT_OPS_ROOT_ANCHOR,
} from '../services/collaboration/documentDraftOps.js';

describe('documentDraftOps', () => {
  it('draftOpsArraySchema rejects empty array', () => {
    expect(() => draftOpsArraySchema.parse([])).toThrow();
  });

  it('deleteBlock removes top-level block', () => {
    const doc = structuredClone(exampleBlockDocumentV0);
    const r = applyDraftOpsToDocument(doc, [
      { op: 'deleteBlock', blockId: '550e8400-e29b-41d4-a716-446655440002' },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.document.blocks.map((b) => b.id)).not.toContain(
      '550e8400-e29b-41d4-a716-446655440002'
    );
    expect(r.document.blocks.length).toBe(1);
  });

  it('insertAfter appends after block', () => {
    const doc = structuredClone(exampleBlockDocumentV0);
    const r = applyDraftOpsToDocument(doc, [
      {
        op: 'insertAfter',
        afterBlockId: '550e8400-e29b-41d4-a716-446655440000',
        blocks: [
          {
            id: 'new-block-1',
            type: 'paragraph',
            content: [{ id: 'new-text-1', type: 'text', attrs: {}, meta: { text: 'New' } }],
          },
        ],
      },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.document.blocks.map((b) => b.id)).toEqual([
      '550e8400-e29b-41d4-a716-446655440000',
      'new-block-1',
      '550e8400-e29b-41d4-a716-446655440002',
    ]);
  });

  it('insertAfter with ROOT prepends blocks', () => {
    const doc = structuredClone(exampleBlockDocumentV0);
    const r = applyDraftOpsToDocument(doc, [
      {
        op: 'insertAfter',
        afterBlockId: DRAFT_OPS_ROOT_ANCHOR,
        blocks: [
          {
            id: 'first-block',
            type: 'paragraph',
            content: [{ id: 't1', type: 'text', attrs: {}, meta: { text: 'First' } }],
          },
        ],
      },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.document.blocks[0]?.id).toBe('first-block');
  });

  it('replaceBlock replaces top-level block', () => {
    const doc = structuredClone(exampleBlockDocumentV0);
    const replacement = {
      id: '550e8400-e29b-41d4-a716-446655440002',
      type: 'paragraph',
      content: [
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          type: 'text',
          attrs: {},
          meta: { text: 'Replaced.' },
        },
      ],
    };
    const r = applyDraftOpsToDocument(doc, [
      { op: 'replaceBlock', blockId: '550e8400-e29b-41d4-a716-446655440002', block: replacement },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const p = r.document.blocks.find((b) => b.id === '550e8400-e29b-41d4-a716-446655440002');
    expect(p?.content?.[0]?.meta).toEqual({ text: 'Replaced.' });
  });

  it('nested block id fails delete (top-level only)', () => {
    const doc = structuredClone(exampleBlockDocumentV0);
    const r = applyDraftOpsToDocument(doc, [
      { op: 'deleteBlock', blockId: '550e8400-e29b-41d4-a716-446655440003' },
    ]);
    expect(r.ok).toBe(false);
  });

  it('computeDraftOpsFromDocuments returns empty when unchanged', () => {
    const doc = structuredClone(exampleBlockDocumentV0);
    expect(computeDraftOpsFromDocuments(doc, doc)).toEqual([]);
  });

  it('computeDraftOpsFromDocuments emits replaceBlock for content change', () => {
    const before = structuredClone(exampleBlockDocumentV0);
    const after = structuredClone(exampleBlockDocumentV0);
    after.blocks[1] = {
      ...after.blocks[1]!,
      content: [{ id: 't-new', type: 'text', attrs: {}, meta: { text: 'Changed' } }],
    };
    const ops = computeDraftOpsFromDocuments(before, after);
    expect(ops).toHaveLength(1);
    expect(ops[0]?.op).toBe('replaceBlock');
  });

  it('computeDraftOpsFromDocuments bootstraps empty to blocks', () => {
    const before = { schemaVersion: 0 as const, blocks: [] };
    const after = structuredClone(exampleBlockDocumentV0);
    const ops = computeDraftOpsFromDocuments(before, after);
    expect(ops[0]?.op).toBe('insertAfter');
    expect(ops[0]?.afterBlockId).toBe(DRAFT_OPS_ROOT_ANCHOR);
    const applied = applyDraftOpsToDocument(before, ops);
    expect(applied.ok).toBe(true);
    if (applied.ok) expect(applied.document.blocks.length).toBe(after.blocks.length);
  });
});
