import { Anchor, List, Stack, Text, Title } from '@mantine/core';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const rich = {
  strong: <strong />,
  em: <em />,
} as const;

export function HelpCollaborationPage() {
  const { t } = useTranslation('help');
  return (
    <Stack gap={0} align="stretch" style={{ textAlign: 'left' }}>
      <Title order={1}>{t('collaboration.title')}</Title>
      <Text component="p">
        <Trans i18nKey="collaboration.p1" ns="help" components={rich} />
      </Text>
      <Title order={2}>{t('collaboration.whyHeading')}</Title>
      <Text component="p">
        <Trans i18nKey="collaboration.whyP1" ns="help" components={rich} />
      </Text>
      <Title order={2}>{t('collaboration.hubHeading')}</Title>
      <Text component="p">
        <Trans i18nKey="collaboration.hubP1" ns="help" components={rich} />
      </Text>
      <List spacing="xs">
        <List.Item>
          <Trans i18nKey="collaboration.hubReviews" ns="help" components={rich} />
        </List.Item>
        <List.Item>
          <Trans i18nKey="collaboration.hubMoves" ns="help" components={rich} />
        </List.Item>
      </List>
      <Text component="p">
        <Trans
          i18nKey="collaboration.hubP2"
          ns="help"
          components={{
            contextsLink: <Anchor component={Link} to="/help/contexts" />,
            workflowLink: <Anchor component={Link} to="/help/workflow" />,
          }}
        />
      </Text>
      <Title order={2}>{t('collaboration.getHeading')}</Title>
      <List spacing="xs">
        <List.Item>{t('collaboration.getPublished')}</List.Item>
        <List.Item>{t('collaboration.getReview')}</List.Item>
        <List.Item>{t('collaboration.getAmbiguity')}</List.Item>
        <List.Item>{t('collaboration.getHub')}</List.Item>
      </List>
    </Stack>
  );
}
