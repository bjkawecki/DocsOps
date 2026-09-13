import { Anchor, List, Stack, Text, Title } from '@mantine/core';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const rich = {
  strong: <strong />,
  em: <em />,
} as const;

export function HelpDocumentTypesPage() {
  const { t } = useTranslation('help');
  return (
    <Stack gap={0} align="stretch" style={{ textAlign: 'left' }}>
      <Title order={1}>{t('documentTypes.title')}</Title>
      <Text component="p">
        <Trans i18nKey="documentTypes.p1" ns="help" components={rich} />
      </Text>

      <Title order={2}>{t('documentTypes.choosingHeading')}</Title>
      <List spacing="xs">
        <List.Item>{t('documentTypes.chooseTemplate')}</List.Item>
        <List.Item>{t('documentTypes.chooseBlank')}</List.Item>
        <List.Item>{t('documentTypes.chooseGroups')}</List.Item>
      </List>

      <Title order={2}>{t('documentTypes.processTypesHeading')}</Title>
      <Text component="p" fs="italic">
        {t('documentTypes.processTypesIntro')}
      </Text>
      <List spacing="sm">
        <List.Item>
          <Trans i18nKey="documentTypes.policyVsStandard" ns="help" components={rich} />
        </List.Item>
        <List.Item>
          <Trans i18nKey="documentTypes.guidelineVs" ns="help" components={rich} />
        </List.Item>
        <List.Item>
          <Trans i18nKey="documentTypes.procedureVsRunbook" ns="help" components={rich} />
        </List.Item>
      </List>

      <Title order={2}>{t('documentTypes.projectTypesHeading')}</Title>
      <List spacing="sm">
        <List.Item>
          <Trans i18nKey="documentTypes.adrVsArch" ns="help" components={rich} />
        </List.Item>
        <List.Item>
          <Trans i18nKey="documentTypes.runbookVsPostmortem" ns="help" components={rich} />
        </List.Item>
      </List>

      <Title order={2}>{t('documentTypes.changingHeading')}</Title>
      <Text component="p">{t('documentTypes.changingP1')}</Text>

      <Title order={2}>{t('documentTypes.templatesHeading')}</Title>
      <Text component="p">
        <Trans i18nKey="documentTypes.templatesP1" ns="help" components={rich} />
      </Text>
      <List spacing="xs">
        <List.Item>{t('documentTypes.templatesLead')}</List.Item>
        <List.Item>{t('documentTypes.templatesAdmin')}</List.Item>
        <List.Item>{t('documentTypes.templatesAuthors')}</List.Item>
      </List>
      <Text component="p">
        <Trans
          i18nKey="documentTypes.templatesP2"
          ns="help"
          components={{
            templatesLink: <Anchor component={Link} to="/templates" />,
          }}
        />
      </Text>
    </Stack>
  );
}
