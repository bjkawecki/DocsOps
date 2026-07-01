import { Box, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { contextCopy } from '../../content/siteCopy';

const CONTEXT_TYPES = ['process', 'project'] as const;

export function ContextSection() {
  return (
    <Box id="kontext" className="landing-section">
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
            {contextCopy.title}
          </Title>
          <Text c="gray.4" ta="center" lh={1.65} size="md">
            {contextCopy.intro}
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" maw={720} mx="auto" w="100%">
          {CONTEXT_TYPES.map((typeId) => {
            const type = contextCopy.types[typeId];
            return (
              <Paper
                key={typeId}
                className="landing-context-type-card landing-surface-card"
                p="xl"
                withBorder
                bg="dark.7"
              >
                <Text size="lg" fw={600} mb={4}>
                  {type.title}
                </Text>
                <Text size="sm" c="gray.4" mb="md">
                  {type.subtitle}
                </Text>
                <Text size="md" c="gray.2" lh={1.65}>
                  {type.description}
                </Text>
              </Paper>
            );
          })}
        </SimpleGrid>
      </Stack>
    </Box>
  );
}
