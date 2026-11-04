import { Box, Button, Group, Stack, Text, Title } from '@mantine/core';
import { IconServer } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { LandingExternalButton } from '../LandingExternalLink';
import { getDemoUrl } from '../../config/env';
import { useLandingCopy } from '../../content/useLandingCopy';
import { useLocale } from '../../i18n/LocaleProvider';
import { pathFor } from '../../i18n/locale';

export function FinalCtaSection() {
  const demoUrl = getDemoUrl();
  const { locale } = useLocale();
  const { site } = useLandingCopy();
  const { finalCtaCopy } = site;

  return (
    <Box className="landing-section landing-final-cta">
      <Stack gap="lg" align="center" maw={720} mx="auto" w="100%">
        <Title order={2} ta="center">
          {finalCtaCopy.title}
        </Title>
        <Text ta="center" c="dimmed" lh={1.65}>
          {finalCtaCopy.body}
        </Text>
        <Group justify="center" gap="md" w="100%">
          <LandingExternalButton href={demoUrl} className="landing-hero-cta-button">
            {finalCtaCopy.primaryCta}
          </LandingExternalButton>
          <Button
            component={Link}
            to={pathFor(locale, 'install')}
            variant="default"
            className="landing-hero-cta-button"
            leftSection={<IconServer size={18} color="var(--mantine-color-blue-4)" />}
          >
            {finalCtaCopy.secondaryCta}
          </Button>
        </Group>
      </Stack>
    </Box>
  );
}
