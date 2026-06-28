import { Button, Group, Text } from '@mantine/core';
import type { SuggestionHoverTarget } from '../../../tiptap/suggestionHoverExtension.js';
import type { SuggestionMutationAction } from './useDraftSuggestionMutations.js';

type Props = {
  target: SuggestionHoverTarget | null;
  authorNameById: Record<string, string>;
  canPublish: boolean;
  currentUserId?: string;
  isPending: boolean;
  onAction: (action: SuggestionMutationAction, suggestionId: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

const HOVER_BRIDGE_WIDTH = 10;
const HOVER_GAP = 2;

export function SuggestionMarkPopover({
  target,
  authorNameById,
  canPublish,
  currentUserId,
  isPending,
  onAction,
  onMouseEnter,
  onMouseLeave,
}: Props) {
  if (!target) return null;

  const authorName = authorNameById[target.authorId] ?? 'Unknown';
  const isOwn = currentUserId === target.authorId;
  const kindLabel = target.kind === 'insert' ? 'Suggested addition' : 'Suggested deletion';
  const bridgeLeft = target.anchorRect.right;
  const popoverLeft = target.anchorRect.right + HOVER_GAP + HOVER_BRIDGE_WIDTH;
  const top = target.anchorRect.top + target.anchorRect.height / 2;
  const bridgeHeight = Math.max(target.anchorRect.height, 20);

  return (
    <>
      <div
        aria-hidden
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          position: 'fixed',
          left: bridgeLeft,
          top: top - bridgeHeight / 2,
          width: HOVER_BRIDGE_WIDTH + HOVER_GAP,
          height: bridgeHeight,
          zIndex: 399,
        }}
      />
      <div
        role="tooltip"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          position: 'fixed',
          left: popoverLeft,
          top,
          transform: 'translateY(-50%)',
          zIndex: 400,
          padding: '6px 8px',
          borderRadius: 'var(--mantine-radius-sm)',
          background: 'var(--mantine-color-dark-6)',
          border: '1px solid var(--mantine-color-dark-4)',
          boxShadow: 'var(--mantine-shadow-md)',
          maxWidth: 260,
        }}
      >
        <Group gap="xs" wrap="nowrap" align="center">
          <Text size="xs" c="dimmed" style={{ flex: 1 }}>
            {isOwn ? `Your ${target.kind}` : `${authorName} · ${kindLabel}`}
          </Text>
          {canPublish && (
            <>
              <Button
                size="compact-xs"
                variant="light"
                color="green"
                loading={isPending}
                onClick={() => onAction('accept', target.suggestionId)}
              >
                Accept
              </Button>
              <Button
                size="compact-xs"
                variant="light"
                color="red"
                loading={isPending}
                onClick={() => onAction('decline', target.suggestionId)}
              >
                Decline
              </Button>
            </>
          )}
          {!canPublish && isOwn && (
            <Button
              size="compact-xs"
              variant="subtle"
              loading={isPending}
              onClick={() => onAction('withdraw', target.suggestionId)}
            >
              Withdraw
            </Button>
          )}
        </Group>
      </div>
    </>
  );
}
