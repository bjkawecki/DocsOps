import type { BlockNodeV0 } from '../api/document-types.js';

type BlockSuggestion = {
  id: string;
  kind: 'insert' | 'delete';
  authorId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: string;
};

function readSuggestion(meta: Record<string, unknown> | undefined): BlockSuggestion | null {
  const raw = meta?.suggestion;
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  if (
    typeof s.id !== 'string' ||
    (s.kind !== 'insert' && s.kind !== 'delete') ||
    typeof s.authorId !== 'string' ||
    typeof s.createdAt !== 'string' ||
    (s.status !== 'pending' &&
      s.status !== 'accepted' &&
      s.status !== 'rejected' &&
      s.status !== 'withdrawn')
  ) {
    return null;
  }
  return {
    id: s.id,
    kind: s.kind,
    authorId: s.authorId,
    status: s.status,
    createdAt: s.createdAt,
  };
}

function suggestionMetaEqual(a: BlockSuggestion, b: BlockSuggestion): boolean {
  return (
    a.id === b.id &&
    a.kind === b.kind &&
    a.authorId === b.authorId &&
    a.status === b.status &&
    a.createdAt === b.createdAt
  );
}

export function mergeAdjacentSuggestionLeaves(leaves: BlockNodeV0[]): BlockNodeV0[] {
  const out: BlockNodeV0[] = [];
  for (const leaf of leaves) {
    const prev = out[out.length - 1];
    const prevS = prev ? readSuggestion(prev.meta) : null;
    const curS = readSuggestion(leaf.meta);
    const prevMarks = JSON.stringify(prev?.meta?.marks ?? []);
    const curMarks = JSON.stringify(leaf.meta?.marks ?? []);
    if (
      prev?.type === 'text' &&
      leaf.type === 'text' &&
      prevS &&
      curS &&
      suggestionMetaEqual(prevS, curS) &&
      prevMarks === curMarks &&
      typeof prev.meta?.text === 'string' &&
      typeof leaf.meta?.text === 'string'
    ) {
      prev.meta = { ...prev.meta, text: prev.meta.text + leaf.meta.text };
      continue;
    }
    out.push({ ...leaf, meta: leaf.meta ? { ...leaf.meta } : {} });
  }
  return out;
}

export function isEffectivelyEmptyInlineBlock(block: BlockNodeV0): boolean {
  if (block.type !== 'paragraph' && block.type !== 'heading') return false;
  for (const leaf of block.content ?? []) {
    if (leaf.type !== 'text') continue;
    const text = typeof leaf.meta?.text === 'string' ? leaf.meta.text : '';
    if (readSuggestion(leaf.meta)?.status === 'pending') return false;
    if (text.length > 0) return false;
  }
  return true;
}

export function pruneEmptyTextLeaves(block: BlockNodeV0): BlockNodeV0 {
  if (block.type !== 'paragraph' && block.type !== 'heading') return block;
  const content = (block.content ?? []).filter((leaf) => {
    if (leaf.type !== 'text') return true;
    const text = typeof leaf.meta?.text === 'string' ? leaf.meta.text : '';
    if (readSuggestion(leaf.meta)?.status === 'pending') return true;
    return text.length > 0;
  });
  return { ...block, content };
}
