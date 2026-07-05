import { Box, Button, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import { philosophyTeaserCopy } from '../../content/siteCopy';

export function PhilosophyTeaserSection() {
  return (
    <Box className="landing-section">
      <Box className="landing-surface-card landing-philosophy-teaser" maw={720} mx="auto" w="100%">
        <Stack gap="md">
          <Title order={2} size="h3">
            {philosophyTeaserCopy.title}
          </Title>
          <Text c="gray.2" lh={1.65}>
            {philosophyTeaserCopy.body}
          </Text>
          <Box>
            <Button component={Link} to="/philosophie" variant="light">
              {philosophyTeaserCopy.cta}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
