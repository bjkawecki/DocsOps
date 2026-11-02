import { Badge, Box, Button, Group, Select, Stack, Text } from '@mantine/core';
import type { UseMutationResult } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { DocumentCommentItem } from './documentCommentTypes.js';
import { headingLabel } from './documentCommentsConstants.js';
import { encodeMentionsForApi, formatCommentMentionText } from './documentCommentMentionUtils.js';
import {
  DocumentCommentMentionTextarea,
  type MentionCandidate,
} from './DocumentCommentMentionTextarea.js';

type PatchArgs = {
  commentId: string;
  text: string;
  anchorHeadingId?: string | null;
};

type Props = {
  documentId: string;
  panelOpen: boolean;
  c: DocumentCommentItem;
  indent: boolean;
  mentionNameByUserId: ReadonlyMap<string, string>;
  mentionCandidates: MentionCandidate[];
  headings: { id: string; text: string }[];
  currentUserId: string | undefined;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editDraft: string;
  setEditDraft: (s: string) => void;
  editAnchorSlug: string | null;
  setEditAnchorSlug: (s: string | null) => void;
  patchMutation: UseMutationResult<void, Error, PatchArgs, unknown>;
  deleteMutation: UseMutationResult<void, Error, string, unknown>;
};

export function DocumentCommentItemView({
  documentId,
  panelOpen,
  c,
  indent,
  mentionNameByUserId,
  mentionCandidates,
  headings,
  currentUserId,
  editingId,
  setEditingId,
  editDraft,
  setEditDraft,
  editAnchorSlug,
  setEditAnchorSlug,
  patchMutation,
  deleteMutation,
}: Props) {
  const { t } = useTranslation('documents');
  const isAuthor = currentUserId != null && c.authorId === currentUserId;
  const canEdit = isAuthor;
  const showDelete = c.canDelete;
  const isEditing = editingId === c.id;
  const isRoot = c.parentId == null;
  const rootRemoved = isRoot && c.deletedAt != null && c.deletedAt !== '';

  return (
    <Box
      py="xs"
      pl={indent ? 'md' : 0}
      style={
        indent
          ? { borderLeft: '2px solid var(--mantine-color-default-border)' }
          : { borderTop: '1px solid var(--mantine-color-default-border)' }
      }
    >
      {rootRemoved ? (
        <Text size="sm" c="dimmed" fs="italic">
          {t('comments.removed')}
        </Text>
      ) : (
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
          <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
            <Group gap={6} wrap="wrap">
              <Text size="sm" fw={600}>
                {c.authorName}
              </Text>
              <Text span size="xs" c="dimmed" fw={400}>
                {new Date(c.createdAt).toLocaleString()}
                {c.updatedAt !== c.createdAt ? ` · ${t('comments.edited')}` : ''}
              </Text>
              {c.parentId == null &&
                c.anchorHeadingId != null &&
                c.anchorHeadingId !== '' &&
                headingLabel(headings, c.anchorHeadingId) != null && (
                  <Badge size="xs" variant="filled" color="gray">
                    {t('comments.sectionLabel', {
                      section: headingLabel(headings, c.anchorHeadingId),
                    })}
                  </Badge>
                )}
            </Group>
            {isEditing ? (
              <Stack gap="xs">
                <DocumentCommentMentionTextarea
                  documentId={documentId}
                  enabled={panelOpen}
                  candidates={mentionCandidates}
                  value={editDraft}
                  onChange={setEditDraft}
                  minRows={2}
                />
                {isRoot && headings.length > 0 && (
                  <Select
                    size="sm"
                    label={t('comments.editSectionLabel')}
                    placeholder={t('comments.noSection')}
                    clearable
                    data={headings.map((h) => ({ value: h.id, label: h.text }))}
                    value={editAnchorSlug}
                    onChange={setEditAnchorSlug}
                  />
                )}
                <Group gap="xs">
                  <Button
                    size="xs"
                    onClick={() => {
                      const text = encodeMentionsForApi(editDraft.trim(), mentionCandidates);
                      if (!text) return;
                      if (isRoot && headings.length > 0) {
                        patchMutation.mutate({
                          commentId: c.id,
                          text,
                          anchorHeadingId:
                            editAnchorSlug === null || editAnchorSlug === ''
                              ? null
                              : editAnchorSlug,
                        });
                      } else {
                        patchMutation.mutate({ commentId: c.id, text });
                      }
                    }}
                    loading={patchMutation.isPending}
                  >
                    {t('comments.save')}
                  </Button>
                  <Button
                    size="xs"
                    variant="default"
                    onClick={() => {
                      setEditingId(null);
                      setEditAnchorSlug(null);
                    }}
                  >
                    {t('comments.cancel')}
                  </Button>
                </Group>
              </Stack>
            ) : (
              <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                {formatCommentMentionText(c.text, mentionNameByUserId)}
              </Text>
            )}
          </Stack>
          {!isEditing && (canEdit || showDelete) && (
            <Group gap={4} wrap="nowrap">
              {canEdit && (
                <Button
                  size="compact-xs"
                  variant="subtle"
                  onClick={() => {
                    setEditingId(c.id);
                    setEditDraft(formatCommentMentionText(c.text, mentionNameByUserId));
                    setEditAnchorSlug(
                      isRoot && c.anchorHeadingId != null && c.anchorHeadingId !== ''
                        ? c.anchorHeadingId
                        : null
                    );
                  }}
                >
                  {t('comments.edit')}
                </Button>
              )}
              {showDelete && (
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="red"
                  loading={deleteMutation.isPending}
                  onClick={() => {
                    if (window.confirm(t('comments.confirmDelete'))) {
                      deleteMutation.mutate(c.id);
                    }
                  }}
                >
                  {t('comments.delete')}
                </Button>
              )}
            </Group>
          )}
        </Group>
      )}
    </Box>
  );
}
