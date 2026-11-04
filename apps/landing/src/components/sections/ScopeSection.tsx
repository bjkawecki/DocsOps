import { Box, Stack } from '@mantine/core';
import { lazy, Suspense } from 'react';
import { useLandingCopy } from '../../content/useLandingCopy';
import { LandingRouteFallback } from '../LandingRouteFallback';
import { LandingSectionHeader } from './LandingSectionHeader';

const ScopeDiagram = lazy(() =>
  import('../diagrams/ScopeDiagram').then((m) => ({ default: m.ScopeDiagram }))
);

export function ScopeSection() {
  const { site } = useLandingCopy();
  const { scopeCopy } = site;

  return (
    <Box id="scope" className="landing-section">
      <Stack gap="xl">
        <LandingSectionHeader
          title={scopeCopy.title}
          intro={scopeCopy.intro}
          introHighlights={scopeCopy.introHighlights}
        />

        <Suspense fallback={<LandingRouteFallback />}>
          <ScopeDiagram />
        </Suspense>
      </Stack>
    </Box>
  );
}
