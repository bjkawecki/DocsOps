import { Box, Stack, Text, Title } from '@mantine/core';
import { useLandingCopy } from '../../content/useLandingCopy';
import { LandingSectionHeader } from './LandingSectionHeader';

export function ExampleSection() {
  const { site } = useLandingCopy();
  const { exampleCopy } = site;

  return (
    <Box id="example" className="landing-section">
      <Stack gap="xl">
        <LandingSectionHeader
          title={exampleCopy.title}
          intro={exampleCopy.intro}
          introHighlights={exampleCopy.introHighlights}
        />

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
