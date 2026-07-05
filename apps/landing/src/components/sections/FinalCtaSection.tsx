import { Anchor, Box, Button, Group, Stack, Text, Title } from '@mantine/core';
import { IconExternalLink, IconPlayerPlay, IconServer } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { LandingExternalButton } from '../LandingExternalLink';
import { getDemoUrl } from '../../config/env';
import { finalCtaCopy } from '../../content/siteCopy';

export function FinalCtaSection() {
  const demoUrl = getDemoUrl();

  return (
    <Box className="landing-section landing-final-cta">
      <Stack gap="lg" align="center" maw={720} mx="auto" w="100%">
        <Title order={2} ta="center">
          {finalCtaCopy.title}
        </Title>
        <Text ta="center" c="gray.2" lh={1.65}>
          {finalCtaCopy.body}
        </Text>
        <Group justify="center" gap="md" w="100%">
          <LandingExternalButton
            href={demoUrl}
            showIcon={false}
            leftSection={<IconPlayerPlay size={18} color="var(--mantine-color-blue-4)" />}
            rightSection={<IconExternalLink size={14} stroke={1.75} aria-hidden />}
            className="landing-hero-cta-button"
          >
            {finalCtaCopy.primaryCta}
          </LandingExternalButton>
          <Button
            component={Link}
            to="/install"
            variant="default"
            className="landing-hero-cta-button"
            leftSection={<IconServer size={18} color="var(--mantine-color-blue-4)" />}
          >
            {finalCtaCopy.secondaryCta}
          </Button>
        </Group>
        <Anchor
          component={Link}
          to="/philosophie"
          className="landing-footer-link"
          underline="always"
        >
          {finalCtaCopy.philosophyLink}
        </Anchor>
      </Stack>
    </Box>
  );
}
