import { List, Stack, Text, Title } from '@mantine/core';
import { Trans, useTranslation } from 'react-i18next';

const rich = {
  strong: <strong />,
  em: <em />,
} as const;

export function HelpPermissionsPage() {
  const { t } = useTranslation('help');
  return (
    <Stack gap={0} align="stretch" style={{ textAlign: 'left' }}>
      <Title order={1}>{t('permissions.title')}</Title>
      <Text component="p">
        <Trans i18nKey="permissions.p1" ns="help" components={rich} />
      </Text>
      <Title order={2}>{t('permissions.readWriteHeading')}</Title>
      <List spacing="xs">
        <List.Item>
          <Trans i18nKey="permissions.read" ns="help" components={rich} />
        </List.Item>
        <List.Item>
          <Trans i18nKey="permissions.write" ns="help" components={rich} />
        </List.Item>
      </List>
      <Text component="p">{t('permissions.p2')}</Text>
    </Stack>
  );
}
