import { z } from 'zod';

/**
 * Recursive block tree for Edit-System v0 (ADR 001, EPIC-0 / PR-0c).
 * `schemaVersion` 0 is the initial contract; bump only with migrations + ADR update.
 */
export interface BlockNode {
  id: string;
  type: string;
  attrs?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  content?: BlockNode[];
}

export const blockNodeSchema: z.ZodType<BlockNode> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    attrs: z.record(z.string(), z.unknown()).optional(),
    meta: z.record(z.string(), z.unknown()).optional(),
    content: z.array(blockNodeSchema).optional(),
  })
);

export const blockDocumentSchemaV0 = z.object({
  schemaVersion: z.literal(0),
  blocks: z.array(blockNodeSchema),
});

export const blockTextMarkSchema = z.enum(['bold', 'italic', 'code']);

export const blockSuggestionKindSchema = z.enum(['insert', 'delete']);

export const blockSuggestionStatusSchema = z.enum(['pending', 'accepted', 'rejected', 'withdrawn']);

/** Inline draft suggestion on a text leaf (ADR 004). Only `pending` is persisted in draftBlocks. */
export const blockSuggestionMetaSchema = z.object({
  id: z.string().min(1),
  kind: blockSuggestionKindSchema,
  authorId: z.string().min(1),
  status: blockSuggestionStatusSchema,
  createdAt: z.string().min(1),
});

export type BlockSuggestionMeta = z.infer<typeof blockSuggestionMetaSchema>;

/** True when href is http(s) or an in-document heading hash (ADR 005). */
export function isAllowedLinkHref(href: string): boolean {
  if (/^https?:\/\//i.test(href)) return true;
  if (/^#[^\s#]+$/.test(href)) return true;
  return false;
}

export class InvalidBlockLinkHrefError extends Error {
  readonly href: string;

  constructor(href: string) {
    super(`Invalid link href: ${href}`);
    this.name = 'InvalidBlockLinkHrefError';
    this.href = href;
  }
}

export function assertAllowedLinkHref(href: string): void {
  if (isAllowedLinkHref(href)) return;
  throw new InvalidBlockLinkHrefError(href);
}

export const blockTextLinkSchema = z.object({
  href: z
    .string()
    .min(1)
    .refine(isAllowedLinkHref, { message: 'Link href must be http(s) or #heading-slug' }),
});

export type BlockTextLink = z.infer<typeof blockTextLinkSchema>;

export const blockTextMetaSchema = z.object({
  text: z.string(),
  marks: z.array(blockTextMarkSchema).optional(),
  /** Inline link (ADR 005); parallel to string marks. */
  link: blockTextLinkSchema.optional(),
  suggestion: blockSuggestionMetaSchema.optional(),
});

/** Block document v1: same tree as v0; text nodes may carry inline `marks` / `link` in meta. */
export const blockDocumentSchemaV1 = z.object({
  schemaVersion: z.literal(1),
  blocks: z.array(blockNodeSchema),
});

export const blockDocumentSchema = z.union([blockDocumentSchemaV0, blockDocumentSchemaV1]);

export type BlockDocumentV0 = z.infer<typeof blockDocumentSchemaV0>;
export type BlockDocumentV1 = z.infer<typeof blockDocumentSchemaV1>;
export type BlockDocument = BlockDocumentV0 | BlockDocumentV1;

export function parseBlockDocumentV0(input: unknown): BlockDocumentV0 {
  return blockDocumentSchemaV0.parse(input);
}

export function safeParseBlockDocumentV0(input: unknown) {
  return blockDocumentSchemaV0.safeParse(input);
}

export function safeParseBlockDocumentV1(input: unknown) {
  return blockDocumentSchemaV1.safeParse(input);
}

export function safeParseBlockDocument(input: unknown) {
  return blockDocumentSchema.safeParse(input);
}

export function parseBlockDocument(input: unknown): BlockDocument {
  return blockDocumentSchema.parse(input);
}

function textNodeHasLink(meta: Record<string, unknown> | undefined): boolean {
  const link = meta?.link;
  return link != null && typeof link === 'object' && !Array.isArray(link);
}

/** Read `meta.link.href` when present; otherwise null. */
export function readTextNodeLinkHref(meta: Record<string, unknown> | undefined): string | null {
  if (!textNodeHasLink(meta)) return null;
  const link = meta!.link as Record<string, unknown>;
  return typeof link.href === 'string' ? link.href : null;
}

/**
 * Reject documents that carry `meta.link` with a disallowed href (ADR 005).
 * Call after parse/normalize on save paths – no silent strip.
 */
export function assertBlockDocumentLinksValid(doc: BlockDocument): void {
  const walk = (node: BlockNode): void => {
    if (node.type === 'text') {
      const href = readTextNodeLinkHref(node.meta);
      if (href != null) assertAllowedLinkHref(href);
    }
    for (const child of node.content ?? []) walk(child);
  };
  for (const block of doc.blocks) walk(block);
}

/**
 * Image block (§28a): `type: 'image'` with `attrs.attachmentId` (cuid),
 * optional `attrs.alt` / `attrs.caption` (strings). Figure numbers are not stored.
 */
export function readImageAttachmentId(attrs: Record<string, unknown> | undefined): string | null {
  const id = attrs?.attachmentId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

export function readImageCaption(attrs: Record<string, unknown> | undefined): string | null {
  const caption = attrs?.caption;
  return typeof caption === 'string' ? caption : null;
}

export function readImageAlt(attrs: Record<string, unknown> | undefined): string | null {
  const alt = attrs?.alt;
  return typeof alt === 'string' ? alt : null;
}

export class InvalidBlockImageError extends Error {
  readonly attachmentId: string | null;
  readonly reason: 'missing' | 'unknown';

  constructor(reason: 'missing' | 'unknown', attachmentId: string | null) {
    const detail =
      reason === 'missing'
        ? 'Image block requires attrs.attachmentId'
        : `Image attachment not found on document: ${attachmentId ?? ''}`;
    super(detail);
    this.name = 'InvalidBlockImageError';
    this.reason = reason;
    this.attachmentId = attachmentId;
  }
}

/**
 * Reject image blocks with missing/foreign attachmentIds (§28a).
 * Call after parse/normalize on save paths – no silent strip.
 */
export function assertBlockDocumentImagesValid(
  doc: BlockDocument,
  knownAttachmentIds: ReadonlySet<string>
): void {
  const walk = (node: BlockNode): void => {
    if (node.type === 'image') {
      const attachmentId = readImageAttachmentId(node.attrs);
      if (attachmentId == null) throw new InvalidBlockImageError('missing', null);
      if (!knownAttachmentIds.has(attachmentId)) {
        throw new InvalidBlockImageError('unknown', attachmentId);
      }
    }
    for (const child of node.content ?? []) walk(child);
  };
  for (const block of doc.blocks) walk(block);
}

/** Collect attachmentIds referenced by top-level and nested `image` blocks. */
export function collectImageAttachmentIds(doc: BlockDocument): string[] {
  const ids: string[] = [];
  const walk = (node: BlockNode): void => {
    if (node.type === 'image') {
      const id = readImageAttachmentId(node.attrs);
      if (id != null) ids.push(id);
    }
    for (const child of node.content ?? []) walk(child);
  };
  for (const block of doc.blocks) walk(block);
  return ids;
}

/** Callout variants (§28a). */
export const CALLOUT_VARIANTS = ['info', 'warning', 'tip'] as const;
export type CalloutVariant = (typeof CALLOUT_VARIANTS)[number];

const CALLOUT_VARIANT_SET = new Set<string>(CALLOUT_VARIANTS);

/** GFM alert tags ↔ callout variants. */
export const CALLOUT_VARIANT_TO_GFM: Record<CalloutVariant, 'NOTE' | 'WARNING' | 'TIP'> = {
  info: 'NOTE',
  warning: 'WARNING',
  tip: 'TIP',
};

export function gfmAlertTagToCalloutVariant(tag: string): CalloutVariant | null {
  switch (tag.trim().toUpperCase()) {
    case 'NOTE':
      return 'info';
    case 'WARNING':
      return 'warning';
    case 'TIP':
      return 'tip';
    default:
      return null;
  }
}

export function readCalloutVariant(
  attrs: Record<string, unknown> | undefined
): CalloutVariant | null {
  const raw = attrs?.variant;
  return typeof raw === 'string' && CALLOUT_VARIANT_SET.has(raw) ? (raw as CalloutVariant) : null;
}

export class InvalidBlockCalloutError extends Error {
  readonly variant: unknown;

  constructor(variant: unknown) {
    super(
      `Callout block requires attrs.variant in (${CALLOUT_VARIANTS.join('|')}); got ${String(variant)}`
    );
    this.name = 'InvalidBlockCalloutError';
    this.variant = variant;
  }
}

/**
 * Reject callout blocks with missing/invalid variant (§28a).
 * Call after parse/normalize on save paths – no silent default.
 */
export function assertBlockDocumentCalloutsValid(doc: BlockDocument): void {
  const walk = (node: BlockNode): void => {
    if (node.type === 'callout') {
      const variant = readCalloutVariant(node.attrs);
      if (variant == null) throw new InvalidBlockCalloutError(node.attrs?.variant);
    }
    for (const child of node.content ?? []) walk(child);
  };
  for (const block of doc.blocks) walk(block);
}

/** True when any text node carries inline formatting marks or an inline link (ADR 002 / 005). */
export function blockDocumentUsesInlineMarks(doc: BlockDocument): boolean {
  const walk = (node: BlockNode): boolean => {
    if (node.type === 'text') {
      const marks = node.meta?.marks;
      if (Array.isArray(marks) && marks.length > 0) return true;
      return textNodeHasLink(node.meta);
    }
    return (node.content ?? []).some(walk);
  };
  return doc.blocks.some(walk);
}

/** True when any text node carries a draft inline suggestion (ADR 004). */
export function blockDocumentUsesSuggestions(doc: BlockDocument): boolean {
  const walk = (node: BlockNode): boolean => {
    if (node.type === 'text') {
      const raw = node.meta?.suggestion;
      return raw != null && typeof raw === 'object';
    }
    return (node.content ?? []).some(walk);
  };
  return doc.blocks.some(walk);
}

export function normalizeBlockDocumentSchemaVersion(doc: BlockDocument): BlockDocument {
  return blockDocumentUsesInlineMarks(doc) || blockDocumentUsesSuggestions(doc)
    ? { schemaVersion: 1, blocks: doc.blocks }
    : { schemaVersion: 0, blocks: doc.blocks };
}

/** Minimal example used in tests and docs; not a full editor schema. */
export const exampleBlockDocumentV0: BlockDocumentV0 = {
  schemaVersion: 0,
  blocks: [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'heading',
      attrs: { level: 1 },
      content: [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          type: 'text',
          attrs: {},
          meta: { text: 'Titel' },
        },
      ],
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      type: 'paragraph',
      content: [
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          type: 'text',
          attrs: {},
          meta: { text: 'Absatztext.' },
        },
      ],
    },
  ],
};
