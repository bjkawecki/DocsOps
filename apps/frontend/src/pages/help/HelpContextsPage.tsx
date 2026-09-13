import { Anchor, List, Stack, Text, Title } from '@mantine/core';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const rich = {
  strong: <strong />,
  em: <em />,
} as const;

export function HelpContextsPage() {
  const { t } = useTranslation('help');
  return (
    <Stack gap={0} align="stretch" style={{ textAlign: 'left' }}>
      <Title order={1}>{t('contexts.title')}</Title>
      <Text component="p">
        <Trans i18nKey="contexts.p1" ns="help" components={rich} />
      </Text>

      <Title order={2}>{t('contexts.twoQuestionsHeading')}</Title>
      <List spacing="xs">
        <List.Item>
          <Trans i18nKey="contexts.processQ" ns="help" components={rich} />
        </List.Item>
        <List.Item>
          <Trans i18nKey="contexts.projectQ" ns="help" components={rich} />
        </List.Item>
      </List>

      <Title order={2}>{t('contexts.belongsHeading')}</Title>
      <Text component="p">
        <Trans i18nKey="contexts.belongsProcess" ns="help" components={rich} />
      </Text>
      <Text component="p">
        <Trans i18nKey="contexts.belongsProject" ns="help" components={rich} />
      </Text>
      <Text component="p">
        <Trans i18nKey="contexts.belongsSub" ns="help" components={rich} />
      </Text>

      <Title order={2}>{t('contexts.namingHeading')}</Title>
      <List spacing="xs">
        <List.Item>
          <Trans i18nKey="contexts.nameProcess" ns="help" components={rich} />
        </List.Item>
        <List.Item>
          <Trans i18nKey="contexts.nameProject" ns="help" components={rich} />
        </List.Item>
        <List.Item>
          <Trans i18nKey="contexts.nameAvoid" ns="help" components={rich} />
        </List.Item>
      </List>

      <Title order={2}>{t('contexts.existingHeading')}</Title>
      <List spacing="xs">
        <List.Item>
          <Trans i18nKey="contexts.existingSame" ns="help" components={rich} />
        </List.Item>
        <List.Item>
          <Trans i18nKey="contexts.existingDetail" ns="help" components={rich} />
        </List.Item>
        <List.Item>
          <Trans i18nKey="contexts.existingUnsure" ns="help" components={rich} />
        </List.Item>
      </List>

      <Title order={2}>{t('contexts.shapeHeading')}</Title>
      <Text component="p">
        <Trans i18nKey="contexts.shapeP1" ns="help" components={rich} />
      </Text>
      <Text component="p">
        <Trans
          i18nKey="contexts.shapeP2"
          ns="help"
          components={{
            ...rich,
            organisationLink: <Anchor component={Link} to="/help/organisation" />,
          }}
        />
      </Text>

      <Title order={2}>{t('contexts.movingHeading')}</Title>
      <Text component="p">
        <Trans i18nKey="contexts.movingP1" ns="help" components={rich} />
      </Text>
      <List spacing="xs">
        <List.Item>
          <Trans i18nKey="contexts.movingSame" ns="help" components={rich} />
        </List.Item>
        <List.Item>
          <Trans
            i18nKey="contexts.movingDiff"
            ns="help"
            components={{
              ...rich,
              approvalsLink: <Anchor component={Link} to="/approvals?tab=moves" />,
            }}
          />
        </List.Item>
      </List>
      <Text component="p">
        <Trans
          i18nKey="contexts.movingP2"
          ns="help"
          components={{
            collaborationLink: <Anchor component={Link} to="/help/collaboration" />,
          }}
        />
      </Text>
    </Stack>
  );
}
