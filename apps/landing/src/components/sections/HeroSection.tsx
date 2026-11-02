import { Anchor, Box, Button, Group, Stack, Text } from '@mantine/core';
import { IconChevronDown, IconServer } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { LandingExternalButton } from '../LandingExternalLink';
import { getDemoUrl } from '../../config/env';
import { heroCopy } from '../../content/siteCopy';
import showroomImage from '../../assets/images/showroom.png';
import { HeroHeadline } from './HeroHeadline';

export function HeroSection() {
  const demoUrl = getDemoUrl();

  return (
    <Box className="landing-hero">
      <Stack className="landing-hero-inner" align="center" gap="xl">
        <Stack gap="md" align="center" maw={720} w="100%">
          <HeroHeadline />

          <Text className="landing-hero-subline" ta="center">
            {heroCopy.subline}
          </Text>

          <Text className="landing-hero-trust-line" ta="center">
            {heroCopy.trustPills.join(' · ')}
          </Text>
        </Stack>

        <Group className="landing-hero-actions" justify="center" gap="sm">
          <LandingExternalButton href={demoUrl} className="landing-hero-cta-button" size="md">
            {heroCopy.primaryCta}
          </LandingExternalButton>
          <Button
            component={Link}
            to="/install"
            className="landing-hero-cta-button"
            variant="default"
            size="md"
            leftSection={<IconServer size={18} color="var(--mantine-color-blue-4)" />}
          >
            {heroCopy.secondaryCta}
          </Button>
        </Group>

        <Box className="landing-hero-preview landing-surface-card" w="100%">
          <img
            src={showroomImage}
            alt={heroCopy.showroomAlt}
            className="landing-hero-preview-image"
            width={2894}
            height={1556}
            loading="eager"
            fetchPriority="high"
            decoding="async"
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
