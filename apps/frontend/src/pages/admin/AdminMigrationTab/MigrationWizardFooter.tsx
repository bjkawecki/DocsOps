import { Button, Group } from '@mantine/core';
import { useTranslation } from 'react-i18next';

type Props = {
  onCancel?: () => void;
  cancelLabel?: string;
  showBack?: boolean;
  onBack?: () => void;
  showPrimary?: boolean;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryLoading?: boolean;
  primaryDisabled?: boolean;
  primaryColor?: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export function MigrationWizardFooter({
  onCancel,
  cancelLabel,
  showBack = false,
  onBack,
  showPrimary = false,
  primaryLabel,
  onPrimary,
  primaryLoading = false,
  primaryDisabled = false,
  primaryColor,
  secondaryLabel,
  onSecondary,
}: Props) {
  const { t } = useTranslation('admin');
  return (
    <Group
      justify="flex-end"
      mt="md"
      pt="md"
      style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
    >
      {onCancel ? (
        <Button variant="default" onClick={onCancel}>
          {cancelLabel ?? t('migration.footer.cancel')}
        </Button>
      ) : null}
      {showBack && onBack ? (
        <Button variant="default" onClick={onBack}>
          {t('migration.footer.back')}
        </Button>
      ) : null}
      {secondaryLabel && onSecondary ? (
        <Button variant="light" onClick={onSecondary}>
          {secondaryLabel}
        </Button>
      ) : null}
      {showPrimary && onPrimary && primaryLabel ? (
        <Button
          color={primaryColor}
          loading={primaryLoading}
          disabled={primaryDisabled}
          onClick={onPrimary}
        >
          {primaryLabel}
        </Button>
      ) : null}
    </Group>
  );
}
