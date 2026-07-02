import { Badge, Box, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { contextCopy } from '../../content/siteCopy';

const CONTEXT_TYPES = ['process', 'project'] as const;

const CONTEXT_BADGE_COLOR: Record<(typeof CONTEXT_TYPES)[number], string> = {
  process: 'blue',
  project: 'grape',
};

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

        <SimpleGrid
          cols={{ base: 1, sm: 2 }}
          spacing="lg"
          maw={900}
          mx="auto"
          w="100%"
          className="landing-context-type-grid"
        >
          {CONTEXT_TYPES.map((typeId) => {
            const type = contextCopy.types[typeId];
            return (
              <Paper
                key={typeId}
                className="landing-context-type-card landing-surface-card"
                p="xl"
                h="100%"
                withBorder
                bg="dark.7"
              >
                <Text size="lg" fw={600} mb="sm">
                  {type.title}
                </Text>
                <Badge
                  variant="light"
                  color={CONTEXT_BADGE_COLOR[typeId]}
                  size="sm"
                  mb="md"
                  className="landing-context-type-badge"
                >
                  {type.subtitle}
                </Badge>
                <Text size="md" c="gray.2" lh={1.65} className="landing-context-type-description">
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
