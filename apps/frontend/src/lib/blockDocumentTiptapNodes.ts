import type { BlockNodeV0 } from '../api/document-types';
import { readTextNodeLink } from './blockLinkHref.js';
import {
  innerTextFromBlockNode,
  readSuggestion,
  textLeaf,
  type TiptapConvertContext,
} from './blockDocumentTiptapInline.js';
import { ourTopLevelBlockToTiptap } from './blockDocumentTiptapOurToPm.js';
import { tiptapTopLevelToOur } from './blockDocumentTiptapPmToOur.js';

export type { TiptapConvertContext };
export { textLeaf, innerTextFromBlockNode, ourTopLevelBlockToTiptap, tiptapTopLevelToOur };

export function blockDocumentUsesInlineMarks(docBlocks: BlockNodeV0[]): boolean {
  const walk = (node: BlockNodeV0): boolean => {
    if (node.type === 'text') {
      const marks = node.meta?.marks;
      if (Array.isArray(marks) && marks.length > 0) return true;
      return readTextNodeLink(node.meta) != null;
    }
    return (node.content ?? []).some(walk);
  };
  return docBlocks.some(walk);
}

export function blockDocumentUsesSuggestions(docBlocks: BlockNodeV0[]): boolean {
  const walk = (node: BlockNodeV0): boolean => {
    if (node.type === 'text') {
      return readSuggestion(node.meta) != null;
    }
    return (node.content ?? []).some(walk);
  };
  return docBlocks.some(walk);
}
