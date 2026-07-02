import { Anchor, Box, Button, Stack, Text } from '@mantine/core';
import { IconBrandGithub, IconChevronDown, IconPlayerPlay } from '@tabler/icons-react';
import { getDemoUrl, getInstallDocsUrl } from '../../config/env';
import { heroCopy } from '../../content/siteCopy';
import showroomImage from '../../assets/images/showroom.png';
import { HeroHeadline } from './HeroHeadline';

export function HeroSection() {
  const demoUrl = getDemoUrl();
  const installUrl = getInstallDocsUrl();

  return (
    <Box className="landing-hero">
      <Stack className="landing-hero-inner" align="center">
        <Stack gap="md" align="center" w="100%">
          <HeroHeadline />

          <Text className="landing-hero-subline" ta="center" maw={720}>
            {heroCopy.subline}
          </Text>
        </Stack>

        <Stack gap="md" align="center" w="100%">
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

          <Text className="landing-hero-trust" component="p">
            {heroCopy.trustLine}
          </Text>
        </Stack>

        <Box className="landing-hero-preview landing-surface-card" w="100%">
          <img
            src={showroomImage}
            alt={heroCopy.showroomAlt}
            className="landing-hero-preview-image"
          />
        </Box>

        <Anchor href="#scope" className="landing-hero-scroll" underline="never">
          <Text span className="landing-hero-scroll-label">
            {heroCopy.scrollHint}
          </Text>
          <IconChevronDown size={20} stroke={1.75} aria-hidden />
        </Anchor>
      </Stack>
    </Box>
  );
}
