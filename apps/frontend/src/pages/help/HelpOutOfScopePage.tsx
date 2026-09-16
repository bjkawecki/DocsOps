import { Anchor, List, Stack, Text, Title } from '@mantine/core';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const rich = {
  strong: <strong />,
  em: <em />,
} as const;

export function HelpOutOfScopePage() {
  const { t } = useTranslation('help');
  return (
    <Stack gap={0} align="stretch" style={{ textAlign: 'left' }}>
      <Title order={1}>{t('outOfScope.title')}</Title>
      <Text component="p">
        <Trans
          i18nKey="outOfScope.p1"
          ns="help"
          components={{
            ...rich,
            overviewLink: <Anchor component={Link} to="/help/overview" />,
          }}
        />
      </Text>
      <Text component="p">
        <Trans i18nKey="outOfScope.p2" ns="help" components={rich} />
      </Text>

      <Title order={2}>{t('outOfScope.outOfScopeHeading')}</Title>
      <List spacing="sm">
        {(['issueTrackers', 'chat', 'opsSignals', 'codeTruth', 'fileDrives'] as const).map(
          (key) => (
            <List.Item key={key}>
              <Trans i18nKey={`outOfScope.items.${key}`} ns="help" components={rich} />
            </List.Item>
          )
        )}
      </List>

      <Title order={2}>{t('outOfScope.fineLineHeading')}</Title>
      <List spacing="xs">
        {(['knownIssue', 'runbook', 'meeting'] as const).map((key) => (
          <List.Item key={key}>
            <Trans i18nKey={`outOfScope.fineLine.${key}`} ns="help" components={rich} />
          </List.Item>
        ))}
      </List>
    </Stack>
  );
}
