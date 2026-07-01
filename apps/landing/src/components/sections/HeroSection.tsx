import { Box, Button, Stack, Text } from '@mantine/core';
import { IconBrandGithub, IconPlayerPlay } from '@tabler/icons-react';
import { getDemoUrl, getInstallDocsUrl } from '../../config/env';
import { heroCopy } from '../../content/siteCopy';
import { HeroHeadline } from './HeroHeadline';

export function HeroSection() {
  const demoUrl = getDemoUrl();
  const installUrl = getInstallDocsUrl();

  return (
    <Box className="landing-hero">
      <Stack gap="xl" align="center">
        <HeroHeadline />

        <Text className="landing-hero-subline" c="dimmed" ta="center" maw={640}>
          {heroCopy.subline}
        </Text>

        <Box className="landing-hero-cta-grid" w="100%">
          <Button
            component="a"
            href={demoUrl}
            target="_blank"
            rel="noreferrer"
            className="landing-hero-cta-button"
            leftSection={<IconPlayerPlay size={20} color="var(--mantine-color-blue-4)" />}
            fullWidth
          >
            {heroCopy.primaryCta}
          </Button>
          <Button
            component="a"
            href={installUrl}
            target="_blank"
            rel="noreferrer"
            className="landing-hero-cta-button"
            leftSection={<IconBrandGithub size={20} color="var(--mantine-color-blue-4)" />}
            fullWidth
          >
            {heroCopy.secondaryCta}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
