import { Box, Stack, Text, Title } from '@mantine/core';
import { ScopeDiagram } from '../diagrams/ScopeDiagram';
import { scopeCopy } from '../../content/siteCopy';

export function ScopeSection() {
  return (
    <Box id="scope" className="landing-section">
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
            {scopeCopy.title}
          </Title>
          <Text c="gray.4" ta="center" lh={1.65} size="md">
            {scopeCopy.intro}
          </Text>
        </Stack>

        <ScopeDiagram />
      </Stack>
    </Box>
  );
}
