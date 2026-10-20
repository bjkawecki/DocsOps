import { Button, Group } from '@mantine/core';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { flattenHelpTopics } from './helpTopics.js';

const navButtonStyles = {
  root: {
    flex: '0 0 auto',
    width: 'auto',
    height: 36,
    minHeight: 36,
    paddingTop: 0,
    paddingBottom: 0,
  },
  inner: {
    height: '100%',
    alignItems: 'center',
  },
  section: {
    display: 'inline-flex',
    alignItems: 'center',
    lineHeight: 0,
  },
  label: {
    lineHeight: 1.25,
  },
};

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
          variant="light"
          color="gray"
          leftSection={<IconArrowLeft size={16} stroke={1.5} />}
          styles={navButtonStyles}
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
          variant="light"
          color="gray"
          rightSection={<IconArrowRight size={16} stroke={1.5} />}
          styles={navButtonStyles}
        >
          {t('nav.next')}
        </Button>
      ) : (
        <span />
      )}
    </Group>
  );
}
