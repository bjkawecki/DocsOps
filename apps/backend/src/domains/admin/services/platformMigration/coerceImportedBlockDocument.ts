import type { Prisma } from '../../../../../generated/prisma/client.js';
import {
  MAX_SUPPORTED_BLOCKS_SCHEMA_VERSION,
  normalizeBlockDocumentSchemaVersion,
  parseBlockDocument,
  safeParseBlockDocument,
  type BlockDocument,
} from '../../../documents/services/blocks/blockSchema.js';

export class ImportedBlockDocumentError extends Error {
  constructor(
    message: string,
    readonly exportId?: string,
    readonly field?: string
  ) {
    super(message);
    this.name = 'ImportedBlockDocumentError';
  }
}

function resolveSchemaVersionHint(columnVersion: number | null | undefined): 0 | 1 {
  if (columnVersion === 1) return 1;
  return 0;
}

/**
 * Build a candidate BlockDocument from export JSON + optional column version.
 * Accepts a full BlockDocument, `{ blocks }` without schemaVersion, or a bare blocks array.
 */
function toCandidate(raw: unknown, columnVersion: number | null | undefined): unknown {
  if (Array.isArray(raw)) {
    return { schemaVersion: resolveSchemaVersionHint(columnVersion), blocks: raw };
  }
  if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.schemaVersion === 'number' && Array.isArray(obj.blocks)) {
      return raw;
    }
    if (Array.isArray(obj.blocks) && obj.schemaVersion == null) {
      return {
        schemaVersion: resolveSchemaVersionHint(columnVersion),
        blocks: obj.blocks,
      };
    }
  }
  return raw;
}

export type CoercedImportedBlockDocument = {
  document: BlockDocument;
  json: Prisma.InputJsonValue;
  schemaVersion: number;
};

/**
 * Normalize and validate block JSON from a platform-export package before Prisma write.
 */
export function coerceImportedBlockDocument(
  raw: unknown,
  columnVersion: number | null | undefined,
  context?: { exportId?: string; field?: string }
): CoercedImportedBlockDocument {
  const { exportId, field } = context ?? {};
  const label = [exportId ? `exportId=${exportId}` : null, field ? `field=${field}` : null]
    .filter(Boolean)
    .join(', ');

  if (raw == null) {
    throw new ImportedBlockDocumentError(
      `Missing block document${label ? ` (${label})` : ''}`,
      exportId,
      field
    );
  }

  if (typeof columnVersion === 'number' && columnVersion > MAX_SUPPORTED_BLOCKS_SCHEMA_VERSION) {
    throw new ImportedBlockDocumentError(
      `Unsupported blocksSchemaVersion ${columnVersion} (max ${MAX_SUPPORTED_BLOCKS_SCHEMA_VERSION})${label ? ` (${label})` : ''}`,
      exportId,
      field
    );
  }

  const candidate = toCandidate(raw, columnVersion);
  const parsed = safeParseBlockDocument(candidate);
  if (!parsed.success) {
    throw new ImportedBlockDocumentError(
      `Invalid block document${label ? ` (${label})` : ''}: ${parsed.error.message}`,
      exportId,
      field
    );
  }

  if (parsed.data.schemaVersion > MAX_SUPPORTED_BLOCKS_SCHEMA_VERSION) {
    throw new ImportedBlockDocumentError(
      `Unsupported block schemaVersion ${parsed.data.schemaVersion} (max ${MAX_SUPPORTED_BLOCKS_SCHEMA_VERSION})${label ? ` (${label})` : ''}`,
      exportId,
      field
    );
  }

  const normalized = normalizeBlockDocumentSchemaVersion(parsed.data);
  const document = parseBlockDocument(normalized);
  return {
    document,
    json: document as unknown as Prisma.InputJsonValue,
    schemaVersion: document.schemaVersion,
  };
}
