import { Button, Group } from '@mantine/core';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { flattenHelpTopics } from './helpTopics.js';

/** Previous / next article controls under help reading content. */
export function HelpArticleNav() {
  const { t } = useTranslation('help');
  const { pathname } = useLocation();
  const topics = flattenHelpTopics();
  const index = topics.findIndex((topic) => topic.to === pathname);
  if (index < 0) return null;

  const previous = index > 0 ? topics[index - 1] : null;
  const next = index < topics.length - 1 ? topics[index + 1] : null;
  if (previous == null && next == null) return null;

  return (
    <Group
      justify="space-between"
      align="stretch"
      gap="md"
      wrap="wrap"
      mt="xl"
      pt="md"
      style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
    >
      {previous != null ? (
        <Button
          component={Link}
          to={previous.to}
          variant="default"
          leftSection={<IconArrowLeft size={16} stroke={1.5} />}
          style={{ flex: '1 1 12rem' }}
        >
          {t('nav.previous')}: {t(previous.labelKey)}
        </Button>
      ) : (
        <span style={{ flex: '1 1 12rem' }} />
      )}
      {next != null ? (
        <Button
          component={Link}
          to={next.to}
          variant="default"
          rightSection={<IconArrowRight size={16} stroke={1.5} />}
          style={{ flex: '1 1 12rem' }}
        >
          {t('nav.next')}: {t(next.labelKey)}
        </Button>
      ) : (
        <span style={{ flex: '1 1 12rem' }} />
      )}
    </Group>
  );
}
