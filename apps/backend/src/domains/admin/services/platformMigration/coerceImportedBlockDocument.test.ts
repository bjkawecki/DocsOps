import { describe, expect, it } from 'vitest';
import {
  exampleBlockDocumentV0,
  normalizeBlockDocumentSchemaVersion,
} from '../../../documents/services/blocks/blockSchema.js';
import {
  coerceImportedBlockDocument,
  ImportedBlockDocumentError,
} from './coerceImportedBlockDocument.js';

describe('coerceImportedBlockDocument', () => {
  it('accepts and returns a valid v0 document', () => {
    const result = coerceImportedBlockDocument(exampleBlockDocumentV0, 0, {
      exportId: 'doc-1',
      field: 'blocks',
    });
    expect(result.schemaVersion).toBe(0);
    expect(result.document.schemaVersion).toBe(0);
    expect(result.json).toMatchObject({ schemaVersion: 0 });
  });

  it('wraps a bare blocks array using the column version', () => {
    const result = coerceImportedBlockDocument(exampleBlockDocumentV0.blocks, 0);
    expect(result.schemaVersion).toBe(0);
    expect(result.document.blocks).toHaveLength(exampleBlockDocumentV0.blocks.length);
  });

  it('normalizes v0 with inline marks to schemaVersion 1', () => {
    const withMarks = {
      schemaVersion: 0 as const,
      blocks: [
        {
          id: 'p1',
          type: 'paragraph',
          content: [
            {
              id: 't1',
              type: 'text',
              attrs: {},
              meta: { text: 'Hi', marks: ['bold' as const] },
            },
          ],
        },
      ],
    };
    const result = coerceImportedBlockDocument(withMarks, 0);
    expect(result.schemaVersion).toBe(1);
    expect(normalizeBlockDocumentSchemaVersion(withMarks as never).schemaVersion).toBe(1);
  });

  it('rejects unsupported column schema versions', () => {
    expect(() =>
      coerceImportedBlockDocument(exampleBlockDocumentV0, 99, { exportId: 'x', field: 'blocks' })
    ).toThrow(ImportedBlockDocumentError);
  });

  it('rejects null payloads', () => {
    expect(() => coerceImportedBlockDocument(null, 0)).toThrow(ImportedBlockDocumentError);
  });
});
