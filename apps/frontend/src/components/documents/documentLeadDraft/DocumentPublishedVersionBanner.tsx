import { Anchor, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

type Props = {
  currentVersion: number;
  acknowledgedVersion: number;
  onReload: () => void;
  /** When nested in a filled Alert, use light-on-color text. */
  onFilledAlert?: boolean;
};

export function DocumentPublishedVersionHint({
  currentVersion,
  acknowledgedVersion,
  onReload,
  onFilledAlert = false,
}: Props) {
  const { t } = useTranslation('documents');
  const textColor = onFilledAlert ? 'white' : 'dimmed';
  return (
    <Text size="sm" c={textColor} component="span">
      {t('leadDraft.publishedHint', { current: currentVersion, acknowledged: acknowledgedVersion })}{' '}
      <Anchor
        component="button"
        type="button"
        size="sm"
        c={textColor}
        underline="always"
        onClick={onReload}
      >
        {t('leadDraft.reload')}
      </Anchor>
    </Text>
  );
}
