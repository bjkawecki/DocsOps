import { Button, Group, Stack, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function DocumentPageErrorView() {
  const { t } = useTranslation('documents');
  return (
    <Stack gap="md">
      <Text size="sm" c="red">
        {t('documentPage.notFound')}
      </Text>
      <Group gap="xs">
        <Button variant="filled" size="sm" component={Link} to="/catalog">
          {t('documentPage.backToCatalog')}
        </Button>
        <Button variant="subtle" size="sm" component={Link} to="/">
          {t('documentPage.dashboard')}
        </Button>
      </Group>
    </Stack>
  );
}
