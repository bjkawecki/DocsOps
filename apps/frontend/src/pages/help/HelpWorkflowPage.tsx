import { List, Stack, Text, Title } from '@mantine/core';
import { Trans, useTranslation } from 'react-i18next';

const rich = {
  strong: <strong />,
  em: <em />,
} as const;

export function HelpWorkflowPage() {
  const { t } = useTranslation('help');
  return (
    <Stack gap={0} align="stretch" style={{ textAlign: 'left' }}>
      <Title order={1}>{t('workflow.title')}</Title>
      <Text component="p">{t('workflow.p1')}</Text>
      <List type="ordered" spacing="sm">
        <List.Item>
          <Trans i18nKey="workflow.draft" ns="help" components={rich} />
        </List.Item>
        <List.Item>
          <Trans i18nKey="workflow.edit" ns="help" components={rich} />
        </List.Item>
        <List.Item>
          <Trans i18nKey="workflow.review" ns="help" components={rich} />
        </List.Item>
        <List.Item>
          <Trans i18nKey="workflow.publish" ns="help" components={rich} />
        </List.Item>
      </List>
      <Text component="p">{t('workflow.p2')}</Text>
    </Stack>
  );
}
