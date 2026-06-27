/**
 * Block-JSON v0 (Edit-System) – deckungsgleich mit Backend `blockSchema` / GET /documents.
 */
export type BlockNodeV0 = {
  id: string;
  type: string;
  attrs?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  content?: BlockNodeV0[];
};

export type BlockDocumentV0 = {
  schemaVersion: 0;
  blocks: BlockNodeV0[];
};

export type BlockDocumentV1 = {
  schemaVersion: 1;
  blocks: BlockNodeV0[];
};

export type BlockDocument = BlockDocumentV0 | BlockDocumentV1;

/** GET /api/v1/documents/:id – Block-Felder (Lead-Draft / Published). */
export type DocumentBlocksFields = {
  draftRevision: number;
  blocks: BlockDocument | null;
  publishedBlocks: BlockDocument | null;
  publishedBlocksSchemaVersion: number | null;
};

/** GET /api/v1/documents/:id/lead-draft */
export type LeadDraftResponse = {
  draftRevision: number;
  blocks: BlockDocument | null;
  canEdit: boolean;
};

/** GET /api/v1/documents/:id/draft/presence */
export type DraftPresenceResponse = {
  documentId: string;
  editors: Array<{ userId: string; name: string }>;
};
