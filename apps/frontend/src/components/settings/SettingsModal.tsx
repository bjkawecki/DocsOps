import { Group, Modal, Text } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import { SettingsPanel } from '../../pages/settings/SettingsPanel.js';
import { closeSettingsSearchParams, isSettingsOpen } from '../../pages/settings/settingsLayout.js';

/** Fixed modal width so content length does not resize the dialog. */
const SETTINGS_MODAL_SIZE = 960;
const SETTINGS_MODAL_BODY_HEIGHT = 'min(70vh, 640px)';

export function SettingsModal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const opened = isSettingsOpen(searchParams);

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
            Settings
          </Text>
        </Group>
      }
      size={SETTINGS_MODAL_SIZE}
      centered
      padding="md"
      styles={{
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
      }}
    >
      {opened ? <SettingsPanel /> : null}
    </Modal>
  );
}
