import { Box, Stack } from '@mantine/core';
import { lazy, Suspense } from 'react';
import { scopeCopy } from '../../content/siteCopy';
import { LandingRouteFallback } from '../LandingRouteFallback';
import { LandingSectionHeader } from './LandingSectionHeader';

const ScopeDiagram = lazy(() =>
  import('../diagrams/ScopeDiagram').then((m) => ({ default: m.ScopeDiagram }))
);

export function ScopeSection() {
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
