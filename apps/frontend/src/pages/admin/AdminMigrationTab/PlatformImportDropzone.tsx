import { Group, Text } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { IconUpload, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

const MAX_UPLOAD_LABEL = '2 GB';

type Props = {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
};

export function PlatformImportDropzone({ onFileSelect, disabled = false }: Props) {
  const { t } = useTranslation('admin');
  return (
    <Dropzone
      onDrop={(files) => {
        const file = files[0];
        if (file) onFileSelect(file);
      }}
      onReject={() => undefined}
      maxSize={2 * 1024 * 1024 * 1024}
      accept={{ 'application/zstd': ['.tar.zst'], 'application/octet-stream': ['.tar.zst'] }}
      disabled={disabled}
      multiple={false}
    >
      <Group justify="center" gap="xs" mih={120} style={{ pointerEvents: 'none' }}>
        <Dropzone.Accept>
          <IconUpload size={32} stroke={1.5} />
        </Dropzone.Accept>
        <Dropzone.Reject>
          <IconX size={32} stroke={1.5} />
        </Dropzone.Reject>
        <Dropzone.Idle>
          <IconUpload size={32} stroke={1.5} />
        </Dropzone.Idle>
        <div>
          <Text size="sm" fw={500}>
            {t('migration.dropzone.instructionBefore')}{' '}
            <code>docsops-platform-export-*.tar.zst</code>{' '}
            {t('migration.dropzone.instructionAfter')}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            {t('migration.dropzone.maxSize', { size: MAX_UPLOAD_LABEL })}
          </Text>
        </div>
      </Group>
    </Dropzone>
  );
}
