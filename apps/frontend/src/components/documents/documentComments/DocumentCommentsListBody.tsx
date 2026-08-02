import { Box, Button, Group, Loader, Select, Stack, Text } from '@mantine/core';
import type {
  InfiniteData,
  UseInfiniteQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { DocumentCommentItem, CommentsListResponse } from './documentCommentTypes.js';
import { DocumentCommentItemView } from './DocumentCommentItemView.js';
import { DocumentCommentMentionTextarea } from './DocumentCommentMentionTextarea.js';

type CreatePayload = { text: string; parentId?: string; anchorHeadingId?: string };
type PatchArgs = {
  commentId: string;
  text: string;
  anchorHeadingId?: string | null;
};

type Props = {
  documentId: string;
  panelOpen: boolean;
  mentionNameByUserId: ReadonlyMap<string, string>;
  listQuery: UseInfiniteQueryResult<InfiniteData<CommentsListResponse>, Error>;
  items: DocumentCommentItem[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  headings: { id: string; text: string }[];
  currentUserId: string | undefined;
  newText: string;
  setNewText: (s: string) => void;
  anchorSlug: string | null;
  setAnchorSlug: (s: string | null) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editDraft: string;
  setEditDraft: (s: string) => void;
  editAnchorSlug: string | null;
  setEditAnchorSlug: (s: string | null) => void;
  replyToRootId: string | null;
  setReplyToRootId: (id: string | null) => void;
  replyDraft: string;
  setReplyDraft: (s: string) => void;
  createMutation: UseMutationResult<void, Error, CreatePayload, unknown>;
  patchMutation: UseMutationResult<void, Error, PatchArgs, unknown>;
  deleteMutation: UseMutationResult<void, Error, string, unknown>;
};

export function DocumentCommentsListBody({
  documentId,
  panelOpen,
  mentionNameByUserId,
  listQuery,
  items,
  hasNextPage,
  isFetchingNextPage,
  headings,
  currentUserId,
  newText,
  setNewText,
  anchorSlug,
  setAnchorSlug,
  editingId,
  setEditingId,
  editDraft,
  setEditDraft,
  editAnchorSlug,
  setEditAnchorSlug,
  replyToRootId,
  setReplyToRootId,
  replyDraft,
  setReplyDraft,
  createMutation,
  patchMutation,
  deleteMutation,
}: Props) {
  const { t } = useTranslation('documents');
  return (
    <>
      {!listQuery.isPending && !listQuery.isError && items.length === 0 && (
        <Text size="sm" c="dimmed" mb="sm">
          {t('comments.empty')}
        </Text>
      )}

      {replyToRootId != null && (
        <Box mb="sm" p="xs" style={{ background: 'var(--mantine-color-default-hover)' }}>
          <Text size="xs" c="dimmed" mb={4}>
            {t('comments.replyToThread')}
          </Text>
          <DocumentCommentMentionTextarea
            documentId={documentId}
            enabled={panelOpen}
            placeholder={t('comments.replyPlaceholder')}
            value={replyDraft}
            onChange={setReplyDraft}
            minRows={2}
          />
          <Group justify="flex-end" gap="xs" mt="xs">
            <Button size="xs" variant="default" onClick={() => setReplyToRootId(null)}>
              {t('comments.cancel')}
            </Button>
            <Button
              size="xs"
              loading={createMutation.isPending}
              disabled={!replyDraft.trim()}
              onClick={() => {
                const text = replyDraft.trim();
                if (!text || replyToRootId == null) return;
                createMutation.mutate({ text, parentId: replyToRootId });
              }}
            >
              {t('comments.postReply')}
            </Button>
          </Group>
        </Box>
      )}

      {replyToRootId == null && (
        <Stack gap="xs" mb="md">
          {headings.length > 0 && (
            <Select
              size="sm"
              label={t('comments.attachToSection')}
              placeholder={t('comments.noSection')}
              clearable
              data={headings.map((h) => ({ value: h.id, label: h.text }))}
              value={anchorSlug}
              onChange={setAnchorSlug}
            />
          )}
          <DocumentCommentMentionTextarea
            documentId={documentId}
            enabled={panelOpen}
            label={t('comments.addComment')}
            placeholder={t('comments.commentPlaceholder')}
            value={newText}
            onChange={setNewText}
            minRows={2}
          />
          <Group justify="flex-end">
            <Button
              size="sm"
              onClick={() => {
                const text = newText.trim();
                if (!text) return;
                const payload: { text: string; anchorHeadingId?: string } = { text };
                if (anchorSlug != null && anchorSlug !== '') payload.anchorHeadingId = anchorSlug;
                createMutation.mutate(payload);
              }}
              loading={createMutation.isPending}
              disabled={!newText.trim()}
            >
              {t('comments.postComment')}
            </Button>
          </Group>
        </Stack>
      )}

      {listQuery.isError && (
        <Text size="sm" c="red">
          {listQuery.error instanceof Error ? listQuery.error.message : t('comments.loadFailed')}
        </Text>
      )}
      {listQuery.isPending && (
        <Group justify="center" py="md">
          <Loader size="sm" />
        </Group>
      )}

      <Stack gap={0}>
        {items.map((root) => {
          const rootDeleted = root.deletedAt != null && root.deletedAt !== '';
          return (
            <Box key={root.id}>
              <DocumentCommentItemView
                c={root}
                indent={false}
                mentionNameByUserId={mentionNameByUserId}
                headings={headings}
                currentUserId={currentUserId}
                editingId={editingId}
                setEditingId={setEditingId}
                editDraft={editDraft}
                setEditDraft={setEditDraft}
                editAnchorSlug={editAnchorSlug}
                setEditAnchorSlug={setEditAnchorSlug}
                patchMutation={patchMutation}
                deleteMutation={deleteMutation}
              />
              {(root.replies ?? []).map((r) => (
                <DocumentCommentItemView
                  key={r.id}
                  c={r}
                  indent
                  mentionNameByUserId={mentionNameByUserId}
                  headings={headings}
                  currentUserId={currentUserId}
                  editingId={editingId}
                  setEditingId={setEditingId}
                  editDraft={editDraft}
                  setEditDraft={setEditDraft}
                  editAnchorSlug={editAnchorSlug}
                  setEditAnchorSlug={setEditAnchorSlug}
                  patchMutation={patchMutation}
                  deleteMutation={deleteMutation}
                />
              ))}
              {!rootDeleted && (
                <Box pl="md" pb="xs">
                  <Button
                    size="compact-xs"
                    variant="subtle"
                    onClick={() => {
                      setReplyToRootId(root.id);
                      setReplyDraft('');
                    }}
                  >
                    {t('comments.reply')}
                  </Button>
                </Box>
              )}
            </Box>
          );
        })}
      </Stack>

      {hasNextPage && (
        <Group justify="center" mt="md">
          <Button
            size="xs"
            variant="filled"
            loading={isFetchingNextPage}
            onClick={() => void listQuery.fetchNextPage()}
          >
            {t('comments.loadMore')}
          </Button>
        </Group>
      )}
    </>
  );
}
