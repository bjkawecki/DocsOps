import { Alert } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { DocumentPublishedVersionHint } from './DocumentPublishedVersionBanner.js';

type Props = {
  show: boolean;
  currentVersion: number;
  acknowledgedVersion: number;
  onReload: () => void;
};

/** Filled banner when a newer published version exists than the user is viewing. */
export function DocumentPublishedVersionAlert({
  show,
  currentVersion,
  acknowledgedVersion,
  onReload,
}: Props) {
  const { t } = useTranslation('documents');
  if (!show) return null;

  return (
    <Alert color="blue" variant="filled" title={t('leadDraft.newPublishedVersionTitle')}>
      <DocumentPublishedVersionHint
        currentVersion={currentVersion}
        acknowledgedVersion={acknowledgedVersion}
        onReload={onReload}
        onFilledAlert
      />
    </Alert>
  );
}
