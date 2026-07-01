import { Box, Stack, Text, Title } from '@mantine/core';
import { RolesDocumentDiagram } from '../diagrams/RolesDocumentDiagram';
import { rolesPublicationCopy } from '../../content/siteCopy';

export function RolesPublicationSection() {
  return (
    <Box id="rechte" className="landing-section">
      <Stack gap="xl">
        <Stack
          gap="sm"
          maw={720}
          mx="auto"
          w="100%"
          align="center"
          className="landing-section-header"
        >
          <Title order={2} className="landing-section-title" mb={0} ta="center">
            {rolesPublicationCopy.title}
          </Title>
          <Text c="gray.4" ta="center" lh={1.65} size="md">
            {rolesPublicationCopy.intro}
          </Text>
        </Stack>

        <RolesDocumentDiagram />
      </Stack>
    </Box>
  );
}
