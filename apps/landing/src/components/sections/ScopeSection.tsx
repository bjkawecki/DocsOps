import { Box, Stack } from '@mantine/core';
import { ScopeDiagram } from '../diagrams/ScopeDiagram';
import { scopeCopy } from '../../content/siteCopy';
import { LandingSectionHeader } from './LandingSectionHeader';

export function ScopeSection() {
  return (
    <Box id="scope" className="landing-section">
      <Stack gap="xl">
        <LandingSectionHeader
          title={scopeCopy.title}
          intro={scopeCopy.intro}
          introHighlights={scopeCopy.introHighlights}
        />

        <ScopeDiagram />
      </Stack>
    </Box>
  );
}
