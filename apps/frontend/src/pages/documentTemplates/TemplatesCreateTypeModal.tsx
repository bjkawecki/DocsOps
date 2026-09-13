import { Box, Button, Group, Modal, Select, Stack, Text, TextInput, Textarea } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { WIDE_MIN_WIDTH } from '../../components/appShell/appShellLayoutConstants.js';

export type TemplatesCreateTypeModalProps = {
  opened: boolean;
  onClose: () => void;
  label: string;
  setLabel: (v: string) => void;
  whenToUse: string;
  setWhenToUse: (v: string) => void;
  exampleTitle: string;
  setExampleTitle: (v: string) => void;
  oftenUsedIn: string | null;
  setOftenUsedIn: (v: string | null) => void;
  scopeOptions: { value: string; label: string }[];
  scopeType: string | null;
  setScopeType: (v: string | null) => void;
  sectionsText: string;
  setSectionsText: (v: string) => void;
  createLoading: boolean;
  onCreate: () => void;
};

/** Create custom document type – fullscreen + sticky footer under compact. */
export function TemplatesCreateTypeModal({
  opened,
  onClose,
  label,
  setLabel,
  whenToUse,
  setWhenToUse,
  exampleTitle,
  setExampleTitle,
  oftenUsedIn,
  setOftenUsedIn,
  scopeOptions,
  scopeType,
  setScopeType,
  sectionsText,
  setSectionsText,
  createLoading,
  onCreate,
}: TemplatesCreateTypeModalProps) {
  const { t } = useTranslation(['templates', 'documents']);
  const isWide = useMediaQuery(WIDE_MIN_WIDTH) ?? true;
  const canSubmit = label.trim().length > 0 && whenToUse.trim().length > 0;

  const footer = (
    <Group justify="flex-end" gap="sm" wrap="nowrap">
      <Button variant="default" onClick={onClose} fullWidth={!isWide}>
        {t('templates:newType.cancel')}
      </Button>
      <Button loading={createLoading} disabled={!canSubmit} onClick={onCreate} fullWidth={!isWide}>
        {t('templates:newType.create')}
      </Button>
    </Group>
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={600} lineClamp={2}>
          {isWide ? t('templates:newType.modalTitle') : t('templates:newType.modalTitleShort')}
        </Text>
      }
      size={isWide ? 'lg' : '100%'}
      fullScreen={!isWide}
      centered={isWide}
      padding="md"
      zIndex={1100}
      styles={
        isWide
          ? undefined
          : {
              content: {
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              },
              body: {
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
              },
            }
      }
    >
      <Stack
        gap="sm"
        style={
          isWide ? undefined : { flex: 1, minHeight: 0, overflow: 'auto', paddingBottom: '0.5rem' }
        }
      >
        <TextInput
          label={t('templates:newType.labelField')}
          value={label}
          onChange={(e) => setLabel(e.currentTarget.value)}
          required
        />
        <Textarea
          label={t('templates:newType.whenToUseField')}
          value={whenToUse}
          onChange={(e) => setWhenToUse(e.currentTarget.value)}
          minRows={2}
          required
        />
        <TextInput
          label={t('templates:newType.exampleTitleField')}
          value={exampleTitle}
          onChange={(e) => setExampleTitle(e.currentTarget.value)}
        />
        <Select
          label={t('templates:newType.oftenUsedInField')}
          data={[
            { value: 'process', label: t('documents:typePicker.groupProcess') },
            { value: 'project', label: t('documents:typePicker.groupProject') },
          ]}
          value={oftenUsedIn}
          onChange={setOftenUsedIn}
          clearable
        />
        <Select
          label={t('templates:newType.scopeField')}
          data={scopeOptions}
          value={scopeType}
          onChange={setScopeType}
          required
        />
        <Textarea
          label={t('templates:newType.sectionsField')}
          description={t('templates:newType.sectionsDescription')}
          value={sectionsText}
          onChange={(e) => setSectionsText(e.currentTarget.value)}
          minRows={isWide ? 8 : 4}
          autosize
          maxRows={isWide ? undefined : 12}
        />
        {isWide ? footer : null}
      </Stack>
      {!isWide ? (
        <Box
          pt="sm"
          style={{
            flexShrink: 0,
            borderTop: '1px solid var(--mantine-color-default-border)',
            marginInline: 'calc(var(--mantine-spacing-md) * -1)',
            paddingInline: 'var(--mantine-spacing-md)',
            paddingTop: 'var(--mantine-spacing-sm)',
          }}
        >
          {footer}
        </Box>
      ) : null}
    </Modal>
  );
}
