import { Box, Stack } from '@mantine/core';
import { RolesDocumentDiagram } from '../diagrams/RolesDocumentDiagram';
import { rolesPublicationCopy } from '../../content/siteCopy';
import { LandingSectionHeader } from './LandingSectionHeader';

export function RolesPublicationSection() {
  return (
    <Box id="rollen" className="landing-section">
      <Stack gap="xl">
        <LandingSectionHeader
          title={rolesPublicationCopy.title}
          intro={rolesPublicationCopy.intro}
          introHighlights={rolesPublicationCopy.introHighlights}
        />

        <RolesDocumentDiagram />
      </Stack>
    </Box>
  );
}
