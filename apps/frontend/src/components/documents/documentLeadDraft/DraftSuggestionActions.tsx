import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { useMemo } from 'react';
import type { BlockDocument } from '../../../api/document-types.js';
import { useDraftSuggestionMutations } from './useDraftSuggestionMutations.js';

type PendingSuggestion = {
  id: string;
  kind: 'insert' | 'delete';
  authorId: string;
  createdAt: string;
  preview: string;
};

function collectPendingSuggestions(doc: BlockDocument): PendingSuggestion[] {
  const out: PendingSuggestion[] = [];
  const walk = (nodes: BlockDocument['blocks']) => {
    for (const block of nodes) {
      if (block.type === 'paragraph' || block.type === 'heading') {
        for (const leaf of block.content ?? []) {
          if (leaf.type !== 'text') continue;
          const raw = leaf.meta?.suggestion;
          if (!raw || typeof raw !== 'object') continue;
          const s = raw as Record<string, unknown>;
          if (s.status !== 'pending') continue;
          if (typeof s.id !== 'string' || (s.kind !== 'insert' && s.kind !== 'delete')) continue;
          if (typeof s.authorId !== 'string' || typeof s.createdAt !== 'string') continue;
          const text = typeof leaf.meta?.text === 'string' ? leaf.meta.text : '';
          out.push({
            id: s.id,
            kind: s.kind,
            authorId: s.authorId,
            createdAt: s.createdAt,
            preview: text.length > 40 ? `${text.slice(0, 40)}…` : text,
          });
        }
      }
      if (block.content) walk(block.content);
    }
  };
  walk(doc.blocks);
  return out;
}

type Props = {
  documentId: string;
  draftRevision: number;
  blocks: BlockDocument;
  canPublish: boolean;
  currentUserId?: string;
  onApplied: (revision: number, blocks: BlockDocument) => void;
};

export function DraftSuggestionActions({
  documentId,
  draftRevision,
  blocks,
  canPublish,
  currentUserId,
  onApplied,
}: Props) {
  const pending = useMemo(() => collectPendingSuggestions(blocks), [blocks]);
  const mutation = useDraftSuggestionMutations({ documentId, draftRevision, onApplied });

  if (pending.length === 0) return null;

  return (
    <Stack gap="xs">
      <Text size="sm" fw={600}>
        Pending suggestions ({pending.length})
      </Text>
      {pending.map((s) => (
        <Group key={s.id} gap="xs" wrap="nowrap" align="center">
          <Badge size="sm" color={s.kind === 'insert' ? 'green' : 'red'} variant="light">
            {s.kind}
          </Badge>
          <Text size="xs" c="dimmed" style={{ flex: 1 }} title={s.preview}>
            {s.preview || '(empty)'}
          </Text>
          {canPublish && (
            <>
              <Button
                size="compact-xs"
                variant="light"
                color="green"
                loading={mutation.isPending}
                onClick={() => mutation.mutate({ action: 'accept', suggestionId: s.id })}
              >
                Accept
              </Button>
              <Button
                size="compact-xs"
                variant="light"
                color="red"
                loading={mutation.isPending}
                onClick={() => mutation.mutate({ action: 'decline', suggestionId: s.id })}
              >
                Decline
              </Button>
            </>
          )}
          {!canPublish && currentUserId === s.authorId && (
            <Button
              size="compact-xs"
              variant="subtle"
              loading={mutation.isPending}
              onClick={() => mutation.mutate({ action: 'withdraw', suggestionId: s.id })}
            >
              Withdraw
            </Button>
          )}
        </Group>
      ))}
    </Stack>
  );
}
