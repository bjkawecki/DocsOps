import type { BlockNode } from './blockSchema.js';

function escapeTableCell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/** GFM pipe table from `table` block (rows of `table_header` / `table_cell`). */
export function tableBlockToMarkdown(
  node: BlockNode,
  cellText: (cell: BlockNode) => string
): string {
  const rows = (node.content ?? []).filter((r) => r.type === 'table_row');
  if (rows.length === 0) return '';

  const matrix = rows.map((row) =>
    (row.content ?? [])
      .filter((c) => c.type === 'table_cell' || c.type === 'table_header')
      .map((c) => escapeTableCell(cellText(c)))
  );
  const colCount = Math.max(1, ...matrix.map((r) => r.length));
  const normalized = matrix.map((row) => {
    const cells = [...row];
    while (cells.length < colCount) cells.push('');
    return cells.slice(0, colCount);
  });

  const header = normalized[0] ?? Array.from({ length: colCount }, () => '');
  const body = normalized.slice(1);
  const sep = Array.from({ length: colCount }, () => '---');
  const lines = [
    `| ${header.join(' | ')} |`,
    `| ${sep.join(' | ')} |`,
    ...body.map((row) => `| ${row.join(' | ')} |`),
  ];
  return lines.join('\n');
}

function isPipeTableRow(line: string): boolean {
  const t = line.trim();
  return t.startsWith('|') && t.endsWith('|') && t.includes('|', 1);
}

function isPipeTableSeparator(line: string): boolean {
  const t = line.trim();
  if (!t.includes('-')) return false;
  return /^\|?[\s:|-]+\|?$/.test(t) && /:-+:?|-+/.test(t) && t.includes('|');
}

function parsePipeTableCells(line: string): string[] {
  const t = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return t.split('|').map((c) => c.trim());
}

export function tryParseMarkdownTable(
  lines: string[],
  startIndex: number,
  makeTextNode: (text: string) => BlockNode,
  makeId: () => string
): { block: BlockNode; nextIndex: number } | null {
  const headerLine = lines[startIndex];
  const sepLine = lines[startIndex + 1];
  if (headerLine === undefined || sepLine === undefined) return null;
  if (!isPipeTableRow(headerLine) || !isPipeTableSeparator(sepLine)) return null;

  const headerCells = parsePipeTableCells(headerLine);
  if (headerCells.length === 0) return null;

  const bodyRows: string[][] = [];
  let i = startIndex + 2;
  while (i < lines.length) {
    const row = lines[i];
    if (row === undefined || row.trim() === '') break;
    if (!isPipeTableRow(row) || isPipeTableSeparator(row)) break;
    bodyRows.push(parsePipeTableCells(row));
    i += 1;
  }

  const colCount = Math.max(headerCells.length, ...bodyRows.map((r) => r.length), 1);

  const pad = (cells: string[]): string[] => {
    const out = [...cells];
    while (out.length < colCount) out.push('');
    return out.slice(0, colCount);
  };

  const cellNode = (text: string, type: 'table_header' | 'table_cell'): BlockNode => ({
    id: makeId(),
    type,
    content: [
      {
        id: makeId(),
        type: 'paragraph',
        content: [makeTextNode(text)],
      },
    ],
  });

  const rowNode = (cells: string[], header: boolean): BlockNode => ({
    id: makeId(),
    type: 'table_row',
    content: pad(cells).map((text) => cellNode(text, header ? 'table_header' : 'table_cell')),
  });

  return {
    block: {
      id: makeId(),
      type: 'table',
      content: [rowNode(headerCells, true), ...bodyRows.map((cells) => rowNode(cells, false))],
    },
    nextIndex: i,
  };
}

export function looksLikeMarkdownTableStart(lines: string[], index: number): boolean {
  const line = lines[index];
  const next = lines[index + 1];
  if (line === undefined || next === undefined) return false;
  return isPipeTableRow(line) && isPipeTableSeparator(next);
}
