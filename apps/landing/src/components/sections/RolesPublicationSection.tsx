import { Box, Stack } from '@mantine/core';
import { lazy, Suspense } from 'react';
import { rolesPublicationCopy } from '../../content/siteCopy';
import { LandingRouteFallback } from '../LandingRouteFallback';
import { LandingSectionHeader } from './LandingSectionHeader';

const RolesDocumentDiagram = lazy(() =>
  import('../diagrams/RolesDocumentDiagram').then((m) => ({ default: m.RolesDocumentDiagram })),
);

export function RolesPublicationSection() {
  return (
    <Box id="rollen" className="landing-section">
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
