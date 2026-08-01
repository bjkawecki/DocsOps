import type { BlockDocumentV0, BlockNodeV0 } from '../../api/document-types.js';
import { randomId } from '../../lib/randomId.js';
import type { DocumentTypeDto } from './documentTypeTypes.js';

function textNode(text: string): BlockNodeV0 {
  return { id: randomId(), type: 'text', attrs: {}, meta: { text } };
}

function paragraph(text: string): BlockNodeV0 {
  return { id: randomId(), type: 'paragraph', content: [textNode(text)] };
}

function heading(level: 1 | 2, text: string): BlockNodeV0 {
  return {
    id: randomId(),
    type: 'heading',
    attrs: { level },
    content: [textNode(text)],
  };
}

function bulletList(items: string[]): BlockNodeV0 {
  return {
    id: randomId(),
    type: 'bullet_list',
    content: items.map((item) => ({
      id: randomId(),
      type: 'list_item',
      content: [paragraph(item)],
    })),
  };
}

/**
 * Synthetic block document for Templates detail – rendered via DocumentBlocksPreview
 * so typography matches document view (`.document-content` SSoT).
 */
export function buildTemplateTypePreviewDocument(type: DocumentTypeDto): BlockDocumentV0 {
  const blocks: BlockNodeV0[] = [heading(1, type.label), paragraph(type.whenToUse)];
  for (const section of type.sections) {
    blocks.push(heading(2, section.heading));
    if (section.prompts.length > 0) {
      blocks.push(bulletList(section.prompts));
    }
  }
  return { schemaVersion: 0, blocks };
}
