import { Group, Modal, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconSettings } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { WIDE_MIN_WIDTH } from '../appShell/appShellLayoutConstants.js';
import { SettingsPanel } from '../../pages/settings/SettingsPanel.js';
import { closeSettingsSearchParams, isSettingsOpen } from '../../pages/settings/settingsLayout.js';

/** Fixed modal width so content length does not resize the dialog (wide only). */
const SETTINGS_MODAL_SIZE = 960;
const SETTINGS_MODAL_BODY_HEIGHT = 'min(70vh, 640px)';

export function SettingsModal() {
  const { t } = useTranslation('shell');
  const [searchParams, setSearchParams] = useSearchParams();
  const opened = isSettingsOpen(searchParams);
  const isWide = useMediaQuery(WIDE_MIN_WIDTH) ?? true;

  const handleClose = () => {
    setSearchParams(closeSettingsSearchParams(searchParams), { replace: true });
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm" wrap="nowrap">
          <IconSettings size={22} stroke={1.5} aria-hidden />
          <Text fw={600} size="lg">
            {t('account.settings')}
          </Text>
        </Group>
      }
      size={isWide ? SETTINGS_MODAL_SIZE : '100%'}
      fullScreen={!isWide}
      centered={isWide}
      padding="md"
      styles={
        isWide
          ? {
              content: {
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 'min(85vh, 900px)',
              },
              body: {
                flex: 1,
                minHeight: SETTINGS_MODAL_BODY_HEIGHT,
                maxHeight: SETTINGS_MODAL_BODY_HEIGHT,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              },
            }
          : {
              content: {
                display: 'flex',
                flexDirection: 'column',
              },
              body: {
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              },
            }
      }
    >
      {opened ? <SettingsPanel /> : null}
    </Modal>
  );
}
