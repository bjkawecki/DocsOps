import { Anchor, Badge, Box, Button, Group, Stack, Text } from '@mantine/core';
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
      <Box className="landing-hero-grid">
        <Stack className="landing-hero-copy" gap="md">
          <HeroHeadline />

          <Text className="landing-hero-subline" maw={720}>
            {heroCopy.subline}
          </Text>

          <Box className="landing-hero-cta-grid" w="100%">
            <LandingExternalButton href={demoUrl} className="landing-hero-cta-button" fullWidth>
              {heroCopy.primaryCta}
            </LandingExternalButton>
            <Button
              component={Link}
              to="/install"
              className="landing-hero-cta-button"
              leftSection={<IconServer size={20} color="var(--mantine-color-blue-4)" />}
              fullWidth
            >
              {heroCopy.secondaryCta}
            </Button>
          </Box>

          <Group gap="sm" className="landing-hero-trust">
            {heroCopy.trustPills.map((label) => (
              <Badge key={label} variant="filled" color="blue" className="landing-hero-trust-pill">
                {label}
              </Badge>
            ))}
          </Group>
        </Stack>

        <Box className="landing-hero-visual">
          <Box className="landing-hero-preview landing-surface-card">
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
        </Box>

        <Box className="landing-hero-scroll-wrap">
          <Anchor href="#scope" className="landing-hero-scroll" underline="never">
            <Text span className="landing-hero-scroll-label">
              {heroCopy.scrollHint}
            </Text>
            <IconChevronDown size={20} stroke={1.75} aria-hidden />
          </Anchor>
        </Box>
      </Box>
    </Box>
  );
}
