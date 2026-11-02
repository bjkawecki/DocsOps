import { useQuery } from '@tanstack/react-query';
import { Box, Select, Stack, Text, Textarea } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../../api/client.js';

export type MentionCandidate = { id: string; name: string };

type Props = {
  documentId: string;
  enabled: boolean;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  minRows?: number;
  maxLength?: number;
  /** Prefer parent-provided candidates to avoid a second fetch when available. */
  candidates?: MentionCandidate[];
};

export function DocumentCommentMentionTextarea({
  documentId,
  enabled,
  label,
  placeholder,
  value,
  onChange,
  minRows = 2,
  maxLength = 16_000,
  candidates: candidatesProp,
}: Props) {
  const { t } = useTranslation('documents');
  const candidatesQuery = useQuery({
    queryKey: ['documents', documentId, 'comment-mention-candidates'] as const,
    enabled: enabled && candidatesProp == null,
    queryFn: async (): Promise<MentionCandidate[]> => {
      const res = await apiFetch(`/api/v1/documents/${documentId}/comments/mention-candidates`);
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? t('comments.loadMentionCandidatesFailed'));
      }
      const body = (await res.json()) as { items: MentionCandidate[] };
      return body.items;
    },
    staleTime: 60_000,
  });

  const candidates = candidatesProp ?? candidatesQuery.data ?? [];

  return (
    <Stack gap={4}>
      {label != null ? (
        <Text size="sm" fw={500}>
          {label}
        </Text>
      ) : null}
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        minRows={minRows}
        maxLength={maxLength}
      />
      {candidates.length > 0 ? (
        <Box>
          <Select
            size="xs"
            placeholder={t('comments.mentionSelectPlaceholder')}
            searchable
            clearable
            data={candidates.map((c) => ({ value: c.id, label: c.name }))}
            value={null}
            onChange={(userId) => {
              if (userId == null || userId === '') return;
              const candidate = candidates.find((c) => c.id === userId);
              const labelText = candidate?.name?.trim() || 'user';
              onChange(
                `${value}${value.endsWith(' ') || value.length === 0 ? '' : ' '}@${labelText} `
              );
            }}
          />
        </Box>
      ) : null}
      <Text size="xs" c="dimmed">
        {t('comments.mentionHint')}
      </Text>
    </Stack>
  );
}
