import { Group, Text } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { IconUpload, IconX } from '@tabler/icons-react';

const MAX_UPLOAD_LABEL = '2 GB';

type Props = {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
};

export function PlatformImportDropzone({ onFileSelect, disabled = false }: Props) {
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
            Drop <code>docsops-platform-export-*.tar.zst</code> here or click to browse
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Maximum archive size: {MAX_UPLOAD_LABEL}
          </Text>
        </div>
      </Group>
    </Dropzone>
  );
}
