import { Box, Button, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useLandingCopy } from '../../content/useLandingCopy';
import { useLocale } from '../../i18n/LocaleProvider';
import { pathFor } from '../../i18n/locale';

export function PhilosophyTeaserSection() {
  const { locale } = useLocale();
  const { site } = useLandingCopy();
  const { philosophyTeaserCopy } = site;

  return (
    <Box className="landing-section">
      <Box className="landing-surface-card landing-philosophy-teaser" maw={720} mx="auto" w="100%">
        <Stack gap="md">
          <Title order={2} size="h3">
            {philosophyTeaserCopy.title}
          </Title>
          <Text c="gray.2" lh={1.65}>
            {philosophyTeaserCopy.body}
          </Text>
          <Box>
            <Button component={Link} to={pathFor(locale, 'philosophy')} variant="light">
              {philosophyTeaserCopy.cta}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
