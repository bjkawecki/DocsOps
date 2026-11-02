import { Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { DocumentContributor } from './documentPageTypes.js';
import { DocumentChromeCollapsiblePanel } from './DocumentChromeCollapsiblePanel.js';

type Props = {
  contributors: DocumentContributor[] | undefined;
};

/**
 * Collapsed-by-default chrome panel: document contributors for the current
 * published version (or draft cycle when unpublished).
 */
export function DocumentSidebarContributors({ contributors }: Props) {
  const { t } = useTranslation('documents');
  const rows = contributors ?? [];

  return (
    <DocumentChromeCollapsiblePanel
      sectionId="doc-page:contributors"
      title={t('sidebar.contributors')}
      defaultOpen={false}
    >
      <Stack gap={6} w="100%" px={4}>
        {rows.length === 0 ? (
          <Text size="sm" c="dimmed">
            {t('sidebar.contributorsEmpty')}
          </Text>
        ) : (
          rows.map((person) => (
            <Text key={person.id} size="sm" style={{ lineHeight: 1.4 }}>
              {person.name}
            </Text>
          ))
        )}
      </Stack>
    </DocumentChromeCollapsiblePanel>
  );
}
