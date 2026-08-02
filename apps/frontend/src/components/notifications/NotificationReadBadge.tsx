import { Badge, Box } from '@mantine/core';
import { useTranslation } from 'react-i18next';

/** Read status chip with vertically centered dot + label. */
export function NotificationReadBadge() {
  const { t } = useTranslation('notifications');
  return (
    <Badge
      size="xs"
      variant="light"
      color="gray"
      leftSection={
        <Box
          w={6}
          h={6}
          style={{
            borderRadius: '50%',
            background: 'currentColor',
            flexShrink: 0,
          }}
        />
      }
      styles={{
        root: {
          display: 'inline-flex',
          alignItems: 'center',
          textTransform: 'uppercase',
        },
        section: {
          display: 'inline-flex',
          alignItems: 'center',
          marginInlineEnd: 6,
        },
        label: { lineHeight: 1 },
      }}
    >
      {t('detail.read')}
    </Badge>
  );
}
