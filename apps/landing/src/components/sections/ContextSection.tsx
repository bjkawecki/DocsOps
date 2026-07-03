import { Box, Paper, Stack, Text, Title } from '@mantine/core';
import { contextCopy } from '../../content/siteCopy';

type ContextTypeId = keyof typeof contextCopy.types;

function ContextTypeCard({ typeId }: { typeId: ContextTypeId }) {
  const type = contextCopy.types[typeId];

  return (
    <Paper
      className="landing-context-type-card landing-surface-card landing-surface-card--interactive"
      p="xl"
      h="100%"
      withBorder
      bg="dark.7"
    >
      <Title order={3} className="landing-context-type-card-title" mb="md">
        {type.title}
      </Title>
      <Text size="md" c="gray.1" lh={1.65} className="landing-context-type-description">
        {type.description}
      </Text>
      <Stack component="ul" gap="sm" mt="md" className="landing-context-type-examples">
        {type.examples.map((example) => (
          <Text
            key={example}
            component="li"
            size="md"
            c="gray.2"
            lh={1.55}
            className="landing-context-type-example"
          >
            {example}
          </Text>
        ))}
      </Stack>
    </Paper>
  );
}

function ContextOrDivider() {
  return (
    <Box className="landing-context-or-divider" aria-hidden>
      <Text className="landing-context-or-watermark">?</Text>
      <Text className="landing-context-or-label">{contextCopy.orLabel}</Text>
    </Box>
  );
}

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
          <Text c="gray.3" ta="center" lh={1.65} size="md">
            {contextCopy.intro}
          </Text>
        </Stack>

        <Box className="landing-context-choice" maw={900} mx="auto" w="100%">
          <ContextTypeCard typeId="process" />
          <ContextOrDivider />
          <ContextTypeCard typeId="project" />
        </Box>
      </Stack>
    </Box>
  );
}
