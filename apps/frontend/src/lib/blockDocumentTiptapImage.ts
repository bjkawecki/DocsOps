import type { JSONContent } from '@tiptap/core';
import type { BlockNodeV0 } from '../api/document-types.js';
import { documentAttachmentUrl } from './figureCaption.js';

export function imageOurToTiptap(
  block: BlockNodeV0,
  documentId: string | undefined
): JSONContent | null {
  const attachmentId =
    typeof block.attrs?.attachmentId === 'string' ? block.attrs.attachmentId : '';
  if (!attachmentId) return null;
  const caption = typeof block.attrs?.caption === 'string' ? block.attrs.caption : '';
  const alt = typeof block.attrs?.alt === 'string' ? block.attrs.alt : '';
  const docId = documentId?.trim() ?? '';
  return {
    type: 'image',
    attrs: {
      blockId: block.id,
      attachmentId,
      caption,
      alt,
      src: docId ? documentAttachmentUrl(docId, attachmentId) : '',
    },
  };
}

export function tiptapImageToOur(
  node: JSONContent,
  readBlockId: (attrs: Record<string, unknown> | undefined) => string
): BlockNodeV0 | null {
  const attachmentId = typeof node.attrs?.attachmentId === 'string' ? node.attrs.attachmentId : '';
  if (!attachmentId) return null;
  const caption = typeof node.attrs?.caption === 'string' ? node.attrs.caption.trim() : '';
  const alt = typeof node.attrs?.alt === 'string' ? node.attrs.alt.trim() : '';
  const attrs: Record<string, unknown> = { attachmentId };
  if (caption.length > 0) attrs.caption = caption;
  if (alt.length > 0) attrs.alt = alt;
  return {
    id: readBlockId(node.attrs as Record<string, unknown> | undefined),
    type: 'image',
    attrs,
  };
}
