import { Box, Stack } from '@mantine/core';
import { lazy, Suspense } from 'react';
import { useLandingCopy } from '../../content/useLandingCopy';
import { LandingRouteFallback } from '../LandingRouteFallback';
import { LandingSectionHeader } from './LandingSectionHeader';

const RolesDocumentDiagram = lazy(() =>
  import('../diagrams/RolesDocumentDiagram').then((m) => ({ default: m.RolesDocumentDiagram }))
);

export function RolesPublicationSection() {
  const { site } = useLandingCopy();
  const { rolesPublicationCopy } = site;

  return (
    <Box id="roles" className="landing-section">
      <Stack gap="xl">
        <LandingSectionHeader
          title={rolesPublicationCopy.title}
          intro={rolesPublicationCopy.intro}
          introHighlights={rolesPublicationCopy.introHighlights}
        />

        <Suspense fallback={<LandingRouteFallback />}>
          <RolesDocumentDiagram />
        </Suspense>
      </Stack>
    </Box>
  );
}
