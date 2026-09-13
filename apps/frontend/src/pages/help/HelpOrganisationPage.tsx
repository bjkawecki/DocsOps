import { Anchor, Stack, Text, Title } from '@mantine/core';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const rich = {
  strong: <strong />,
  em: <em />,
} as const;

export function HelpOrganisationPage() {
  const { t } = useTranslation('help');
  return (
    <Stack gap={0} align="stretch" style={{ textAlign: 'left' }}>
      <Title order={1}>{t('organisation.title')}</Title>
      <Text component="p">
        <Trans i18nKey="organisation.p1" ns="help" components={rich} />
      </Text>
      <Title order={2}>{t('organisation.contextsHeading')}</Title>
      <Text component="p">
        <Trans
          i18nKey="organisation.p2"
          ns="help"
          components={{
            ...rich,
            contextsLink: <Anchor component={Link} to="/help/contexts" />,
          }}
        />
      </Text>
    </Stack>
  );
}
