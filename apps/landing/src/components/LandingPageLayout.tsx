import { Box, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';

type LandingPageLayoutProps = {
  title: string;
  intro?: string;
  children: ReactNode;
  narrow?: boolean;
};

export function LandingPageLayout({
  title,
  intro,
  children,
  narrow = false,
}: LandingPageLayoutProps) {
  return (
    <Box className={`landing-page${narrow ? ' landing-page--narrow' : ''}`}>
      <Stack gap="xl" align="center">
        <Stack gap="sm" align="center" className="landing-page-header">
          <Title order={1} className="landing-page-title">
            {title}
          </Title>
          {intro ? (
            <Text c="gray.3" size="lg" ta="center" maw={640} lh={1.65}>
              {intro}
            </Text>
          ) : null}
        </Stack>
        <Box w="100%">{children}</Box>
      </Stack>
    </Box>
  );
}

type LandingPageSectionProps = {
  title: string;
  children: ReactNode;
  centered?: boolean;
};

export function LandingPageSection({ title, children, centered = true }: LandingPageSectionProps) {
  return (
    <Stack gap="sm" className="landing-page-section">
      <Title
        order={2}
        className={`landing-page-section-title${centered ? '' : ' landing-page-section-title--left'}`}
      >
        {title}
      </Title>
      {children}
    </Stack>
  );
}
