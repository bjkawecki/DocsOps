import type { JSONContent } from '@tiptap/core';
import type { BlockNodeV0 } from '../api/document-types';

type ParagraphConverter = (p: BlockNodeV0) => JSONContent;
type TextLeafFactory = (text: string) => BlockNodeV0;
type ParagraphFromTiptap = (node: JSONContent) => BlockNodeV0;
type InlineLeavesFromPm = (content: JSONContent[] | undefined) => BlockNodeV0[];
type ReadBlockId = (attrs: Record<string, unknown> | undefined) => string;

function emptyParagraph(
  newId: () => string,
  textLeaf: TextLeafFactory,
  paragraphOurToTiptap: ParagraphConverter
): JSONContent {
  return paragraphOurToTiptap({ id: newId(), type: 'paragraph', content: [textLeaf('')] });
}

function cellContentToTiptap(
  cell: BlockNodeV0,
  paragraphOurToTiptap: ParagraphConverter,
  newId: () => string,
  textLeaf: TextLeafFactory
): JSONContent[] {
  const paras = (cell.content ?? []).filter((c) => c.type === 'paragraph');
  if (paras.length > 0) return paras.map((p) => paragraphOurToTiptap(p));
  return [emptyParagraph(newId, textLeaf, paragraphOurToTiptap)];
}

function tableCellOurToTiptap(
  cell: BlockNodeV0,
  paragraphOurToTiptap: ParagraphConverter,
  newId: () => string,
  textLeaf: TextLeafFactory
): JSONContent {
  return {
    type: cell.type === 'table_header' ? 'tableHeader' : 'tableCell',
    attrs: { blockId: cell.id },
    content: cellContentToTiptap(cell, paragraphOurToTiptap, newId, textLeaf),
  };
}

function tableRowOurToTiptap(
  row: BlockNodeV0,
  paragraphOurToTiptap: ParagraphConverter,
  newId: () => string,
  textLeaf: TextLeafFactory
): JSONContent {
  const cells = (row.content ?? []).filter(
    (c) => c.type === 'table_cell' || c.type === 'table_header'
  );
  return {
    type: 'tableRow',
    attrs: { blockId: row.id },
    content:
      cells.length > 0
        ? cells.map((c) => tableCellOurToTiptap(c, paragraphOurToTiptap, newId, textLeaf))
        : [
            tableCellOurToTiptap(
              { id: newId(), type: 'table_cell', content: [] },
              paragraphOurToTiptap,
              newId,
              textLeaf
            ),
          ],
  };
}

export function tableOurToTiptap(
  block: BlockNodeV0,
  paragraphOurToTiptap: ParagraphConverter,
  newId: () => string,
  textLeaf: TextLeafFactory
): JSONContent {
  const rows = (block.content ?? []).filter((c) => c.type === 'table_row');
  return {
    type: 'table',
    attrs: { blockId: block.id },
    content:
      rows.length > 0
        ? rows.map((r) => tableRowOurToTiptap(r, paragraphOurToTiptap, newId, textLeaf))
        : [
            tableRowOurToTiptap(
              { id: newId(), type: 'table_row', content: [] },
              paragraphOurToTiptap,
              newId,
              textLeaf
            ),
          ],
  };
}

function tiptapCellToOur(
  node: JSONContent,
  readBlockId: ReadBlockId,
  tiptapParagraphToOur: ParagraphFromTiptap,
  pmInlineToTextLeaves: InlineLeavesFromPm,
  textLeaf: TextLeafFactory,
  newId: () => string
): BlockNodeV0 {
  const id = readBlockId(node.attrs);
  const type = node.type === 'tableHeader' ? 'table_header' : 'table_cell';
  const inner = (node.content ?? []).map((c) => {
    if (c.type === 'paragraph') return tiptapParagraphToOur(c);
    return {
      id: newId(),
      type: 'paragraph' as const,
      content: pmInlineToTextLeaves(c.content),
    };
  });
  return {
    id,
    type,
    content:
      inner.length > 0 ? inner : [{ id: newId(), type: 'paragraph', content: [textLeaf('')] }],
  };
}

function tiptapRowToOur(
  node: JSONContent,
  readBlockId: ReadBlockId,
  tiptapParagraphToOur: ParagraphFromTiptap,
  pmInlineToTextLeaves: InlineLeavesFromPm,
  textLeaf: TextLeafFactory,
  newId: () => string
): BlockNodeV0 {
  const id = readBlockId(node.attrs);
  const cells = (node.content ?? [])
    .filter((c) => c.type === 'tableCell' || c.type === 'tableHeader')
    .map((c) =>
      tiptapCellToOur(c, readBlockId, tiptapParagraphToOur, pmInlineToTextLeaves, textLeaf, newId)
    );
  return {
    id,
    type: 'table_row',
    content:
      cells.length > 0
        ? cells
        : [
            {
              id: newId(),
              type: 'table_cell',
              content: [{ id: newId(), type: 'paragraph', content: [textLeaf('')] }],
            },
          ],
  };
}

export function tiptapTableToOur(
  node: JSONContent,
  readBlockId: ReadBlockId,
  tiptapParagraphToOur: ParagraphFromTiptap,
  pmInlineToTextLeaves: InlineLeavesFromPm,
  textLeaf: TextLeafFactory,
  newId: () => string
): BlockNodeV0 {
  const id = readBlockId(node.attrs);
  const rows = (node.content ?? [])
    .filter((c) => c.type === 'tableRow')
    .map((c) =>
      tiptapRowToOur(c, readBlockId, tiptapParagraphToOur, pmInlineToTextLeaves, textLeaf, newId)
    );
  return {
    id,
    type: 'table',
    content:
      rows.length > 0
        ? rows
        : [
            {
              id: newId(),
              type: 'table_row',
              content: [
                {
                  id: newId(),
                  type: 'table_cell',
                  content: [{ id: newId(), type: 'paragraph', content: [textLeaf('')] }],
                },
              ],
            },
          ],
  };
}
