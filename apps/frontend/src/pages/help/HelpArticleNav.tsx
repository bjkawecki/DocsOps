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
      className="help-article-nav"
      justify="space-between"
      align="center"
      gap="md"
      wrap="wrap"
      mt="md"
    >
      {previous != null ? (
        <Button
          component={Link}
          to={previous.to}
          variant="default"
          size="sm"
          leftSection={<IconArrowLeft size={16} stroke={1.5} />}
        >
          {t('nav.previous')}
        </Button>
      ) : (
        <span />
      )}
      {next != null ? (
        <Button
          component={Link}
          to={next.to}
          variant="default"
          size="sm"
          rightSection={<IconArrowRight size={16} stroke={1.5} />}
        >
          {t('nav.next')}
        </Button>
      ) : (
        <span />
      )}
    </Group>
  );
}
