import { Anchor, Stack, Text, Title } from '@mantine/core';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const rich = {
  strong: <strong />,
  em: <em />,
} as const;

export function HelpOverviewPage() {
  const { t } = useTranslation('help');
  return (
    <Stack gap={0} align="stretch" style={{ textAlign: 'left' }}>
      <Title order={1}>{t('overview.title')}</Title>
      <Text component="p">{t('overview.p1')}</Text>
      <Text component="p">
        <Trans i18nKey="overview.p2" ns="help" components={rich} />
      </Text>
      <Text component="p">
        <Trans
          i18nKey="overview.p3"
          ns="help"
          components={{
            ...rich,
            contextsLink: <Anchor component={Link} to="/help/contexts" />,
            outOfScopeLink: <Anchor component={Link} to="/help/out-of-scope" />,
          }}
        />
      </Text>
    </Stack>
  );
}
