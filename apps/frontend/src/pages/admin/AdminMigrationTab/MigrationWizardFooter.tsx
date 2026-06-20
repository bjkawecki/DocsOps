import { Button, Group } from '@mantine/core';

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
  cancelLabel = 'Cancel',
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
  return (
    <Group
      justify="flex-end"
      mt="md"
      pt="md"
      style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
    >
      {onCancel ? (
        <Button variant="default" onClick={onCancel}>
          {cancelLabel}
        </Button>
      ) : null}
      {showBack && onBack ? (
        <Button variant="default" onClick={onBack}>
          Back
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
