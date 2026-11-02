import { Alert, Button, Group, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

type Props = {
  canPublish: boolean;
  remotePending: { revision: number; doc: unknown } | null;
  dirty: boolean;
  knownServerRevision: number;
  appliedRevision: number | null;
  incomingRevision: number;
  onLoadLatest: () => void;
  onKeepMine: () => void;
};

export function DraftCollaborationBanner({
  canPublish,
  remotePending,
  dirty,
  knownServerRevision,
  appliedRevision,
  incomingRevision,
  onLoadLatest,
  onKeepMine,
}: Props) {
  const { t } = useTranslation('documents');
  const show = Boolean(remotePending) && (canPublish ? dirty : true);
  if (!show) return null;

  return (
    <Alert color="blue" variant="filled" title={t('leadDraft.remoteUpdateTitle')}>
      <Stack gap="xs">
        <Text size="sm">
          {remotePending
            ? t('leadDraft.remotePendingMessage', { revision: remotePending.revision })
            : t('leadDraft.revisionAvailableMessage', {
                revision: knownServerRevision,
                applied: appliedRevision ?? incomingRevision,
              })}
        </Text>
        <Group gap="xs">
          <Button
            size="compact-sm"
            variant="white"
            color="blue"
            onClick={() => void onLoadLatest()}
          >
            {t('leadDraft.loadLatest')}
          </Button>
          {remotePending && (
            <Button size="compact-sm" variant="light" color="blue" onClick={onKeepMine}>
              {t('leadDraft.keepMine')}
            </Button>
          )}
        </Group>
      </Stack>
    </Alert>
  );
}
