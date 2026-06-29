import { Alert } from '@mantine/core';
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
  if (!show) return null;

  return (
    <Alert color="blue" variant="filled" title="New published version">
      <DocumentPublishedVersionHint
        currentVersion={currentVersion}
        acknowledgedVersion={acknowledgedVersion}
        onReload={onReload}
        onFilledAlert
      />
    </Alert>
  );
}
