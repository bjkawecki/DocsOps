import { Box, Stack, Text, Title } from '@mantine/core';
import { exampleCopy } from '../../content/siteCopy';

export function ExampleSection() {
  return (
    <Box id="einordnen" className="landing-section">
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
            {exampleCopy.title}
          </Title>
          <Text c="gray.4" ta="center" lh={1.65} size="md">
            {exampleCopy.intro}
          </Text>
        </Stack>

        <Stack gap="xl" maw={720} mx="auto" w="100%" className="landing-example-steps">
          {exampleCopy.steps.map((step, index) => (
            <Box
              key={step.question}
              component="section"
              className={`landing-example-step${index > 0 ? ' landing-example-step--bordered' : ''}`}
            >
              <Title order={3} size="h4" fw={600} mb="sm" className="landing-example-step-question">
                {index + 1}. {step.question}
              </Title>
              <Text size="md" c="gray.2" lh={1.65}>
                {step.answer}
              </Text>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
