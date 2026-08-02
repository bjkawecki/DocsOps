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

/**
 * Synthetic block document for Templates detail – rendered via DocumentBlocksPreview
 * so typography matches document view (`.document-content` SSoT).
 *
 * Shape: H1 + lead, then H2 + prose paragraph per section (no lists).
 */
export function buildTemplateTypePreviewDocument(
  type: DocumentTypeDto,
  options?: { displayLabel?: string }
): BlockDocumentV0 {
  const title = options?.displayLabel?.trim() || type.label;
  const blocks: BlockNodeV0[] = [heading(1, title), paragraph(type.whenToUse)];

  for (const section of type.sections) {
    blocks.push(heading(2, section.heading));
    const body = section.prompts
      .map((p) => p.trim())
      .filter(Boolean)
      .join(' ');
    if (body.length > 0) {
      blocks.push(paragraph(body));
    }
  }

  return { schemaVersion: 0, blocks };
}
